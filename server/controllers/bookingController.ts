import crypto from 'crypto';
import type { Response, NextFunction } from 'express';
import Booking, { createBookingOrderId } from '../models/Booking.ts';
import Payment from '../models/Payment.ts';
import Service from '../models/Service.ts';
import { uploadImageBuffer } from '../utils/cloudinary.ts';
import { createNotification } from '../utils/notifications.ts';
import { isPastDateKey, startOfDayUtc, toDateKey } from '../utils/date.ts';
import { isSmokeTestBooking } from '../utils/smokeArtifacts.ts';

const userSelect = 'name email role profilePicture bio createdAt upiId';
const organizerSelect = 'name email role profilePicture bio createdAt upiId';
const serviceOrganizerPopulate = { path: 'organizer', select: organizerSelect };

const populateBookingById = async (bookingId: string) => (
  Booking.findById(bookingId)
    .populate([
      { path: 'service', populate: serviceOrganizerPopulate },
      { path: 'user', select: userSelect },
      { path: 'organizer', select: organizerSelect },
    ])
);

const resolveReferenceId = (value: any) => {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value._id?.toString?.() || value.id?.toString?.() || value.toString();
};

const ensureOrganizerAccess = (booking: any, user: any) => {
  return resolveReferenceId(booking.organizer) === user.id || user.role === 'admin';
};

const ensureUserAccess = (booking: any, user: any) => {
  return resolveReferenceId(booking.user) === user.id || user.role === 'admin';
};

const findAvailabilityEntry = (service: any, bookingDate: string | Date) => {
  const dateKey = toDateKey(bookingDate);

  return (service.availability || []).find((entry: any) => {
    try {
      return toDateKey(entry.date) === dateKey;
    } catch {
      return false;
    }
  });
};

const transitionBookingStatus = (booking: any, nextStatus: 'accepted' | 'confirmed' | 'rejected' | 'completed') => {
  const targetStatus = nextStatus === 'accepted' ? 'confirmed' : nextStatus;

  if (booking.status === 'cancelled') {
    throw new Error('Cancelled bookings cannot be updated');
  }

  if (booking.status === 'rejected' && targetStatus !== 'confirmed') {
    throw new Error('Rejected bookings can only be moved back to confirmed');
  }

  if (targetStatus === 'completed' && !['confirmed', 'accepted'].includes(booking.status)) {
    throw new Error('Only confirmed bookings can be marked as completed');
  }

  booking.status = targetStatus;
};

const buildBookingReference = () => (
  `EVT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
);

const buildPaymentOrderId = () => (
  `EVTPAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
);

const getDuplicateKeyFields = (error: any) => (
  Object.keys(error?.keyPattern || error?.keyValue || {})
);

const isDuplicateKeyError = (error: any, fields?: string[]) => {
  if (error?.code !== 11000) {
    return false;
  }

  if (!fields?.length) {
    return true;
  }

  const duplicateFields = getDuplicateKeyFields(error);
  return duplicateFields.some((field) => fields.includes(field));
};

const createBookingRecord = async (payload: Record<string, unknown>) => {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await Booking.create({
        ...payload,
        orderId: createBookingOrderId(),
        bookingReference: buildBookingReference(),
      });
    } catch (error) {
      lastError = error;

      if (!isDuplicateKeyError(error, ['orderId'])) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const createBooking = async (req: any, res: Response, next: NextFunction) => {
  try {
    const service = await Service.findById(req.body.serviceId);

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    if (service.organizer.toString() === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot book your own service' });
    }

    if (isPastDateKey(req.body.date)) {
      return res.status(400).json({ success: false, error: 'Bookings must be scheduled for today or a future date' });
    }

    const availabilityEntry = findAvailabilityEntry(service, req.body.date);
    if (availabilityEntry && !availabilityEntry.isAvailable) {
      return res.status(400).json({
        success: false,
        error: availabilityEntry.note || 'The organizer is unavailable on the selected date',
      });
    }

    const normalizedDate = startOfDayUtc(req.body.date);

    const existingBooking = await Booking.findOne({
      user: req.user.id,
      service: service._id,
      date: normalizedDate,
      time: req.body.time.trim(),
      status: { $in: ['pending', 'accepted', 'confirmed'] },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active booking request for this service, date, and time',
      });
    }

    const booking = await createBookingRecord({
      user: req.user.id,
      service: service._id,
      organizer: service.organizer,
      date: normalizedDate,
      contactName: typeof req.body.contactName === 'string' && req.body.contactName.trim()
        ? req.body.contactName.trim()
        : req.user.name,
      phone: typeof req.body.phone === 'string' ? req.body.phone.trim() : '',
      eventType: typeof req.body.eventType === 'string' && req.body.eventType.trim()
        ? req.body.eventType.trim()
        : 'General Event',
      eventLocation: typeof req.body.eventLocation === 'string' ? req.body.eventLocation.trim() : '',
      time: req.body.time.trim(),
      guests: Number(req.body.guests),
      notes: req.body.notes || '',
      amount: service.price,
      status: 'pending',
      paymentStatus: 'pending',
      paymentProvider: service.upiId ? 'upi_qr' : 'none',
      upiIdUsed: service.upiId || '',
    });

    const populatedBooking = await populateBookingById(booking._id.toString());

    await createNotification({
      user: service.organizer.toString(),
      type: 'booking',
      title: 'New booking request',
      message: `${req.user.name} requested ${service.title} for ${toDateKey(normalizedDate)} at ${booking.time} (${booking.eventType}).`,
      link: '/dashboard/seller',
      metadata: {
        bookingId: booking._id.toString(),
        serviceId: service._id.toString(),
      },
    });

    res.status(201).json({
      success: true,
      data: populatedBooking,
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate field error fixed',
        error: 'Duplicate field error fixed',
      });
    }

    next(err);
  }
};

export const getMyBookings = async (req: any, res: Response, next: NextFunction) => {
  try {
    const query = req.user.role === 'admin' ? {} : { user: req.user.id };

    const bookings = (await Booking.find(query)
      .populate([
        { path: 'service', populate: serviceOrganizerPopulate },
        { path: 'user', select: userSelect },
        { path: 'organizer', select: organizerSelect },
      ])
      .sort({ createdAt: -1 }))
      .filter((booking) => !isSmokeTestBooking(booking));

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrganizerBookings = async (req: any, res: Response, next: NextFunction) => {
  try {
    const query = req.user.role === 'admin' ? {} : { organizer: req.user.id };

    const bookings = (await Booking.find(query)
      .populate([
        { path: 'service', populate: serviceOrganizerPopulate },
        { path: 'user', select: userSelect },
        { path: 'organizer', select: organizerSelect },
      ])
      .sort({ createdAt: -1 }))
      .filter((booking) => !isSmokeTestBooking(booking));

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (req: any, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('service', 'title');

    if (!booking || isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!ensureUserAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Completed bookings cannot be cancelled' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Booking is already cancelled' });
    }

    booking.status = 'cancelled';
    await booking.save();

    await createNotification({
      user: booking.organizer.toString(),
      type: 'booking',
      title: 'Booking cancelled',
      message: `${req.user.name} cancelled a booking for ${(booking.service as any)?.title || 'your service'}.`,
      link: '/dashboard/seller',
      metadata: {
        bookingId: booking._id.toString(),
      },
    });

    const populatedBooking = await populateBookingById(booking._id.toString());

    res.status(200).json({
      success: true,
      data: populatedBooking,
    });
  } catch (err) {
    next(err);
  }
};

export const markBookingPaid = async (req: any, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('service', 'title upiId');

    if (!booking || isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!ensureUserAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    if (['rejected', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, error: 'This booking is no longer active' });
    }

    let paymentScreenshot = booking.paymentScreenshot || '';

    if (req.file) {
      paymentScreenshot = await uploadImageBuffer(req.file.buffer, req.file.originalname, 'payments');
    }

    let payment = await Payment.findOne({ booking: booking._id, status: 'pending' }).sort({ createdAt: -1 });

    if (!payment) {
      payment = await Payment.create({
        user: booking.user,
        organizer: booking.organizer,
        service: booking.service,
        booking: booking._id,
        orderId: booking.paymentOrderId || buildPaymentOrderId(),
        amount: booking.amount,
        currency: booking.currency || 'INR',
        upiId: booking.upiIdUsed || (booking.service as any)?.upiId || '',
        status: 'pending',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });
    }

    payment.utr = typeof req.body.transactionId === 'string' ? req.body.transactionId.trim() : '';
    payment.submittedAt = new Date();
    payment.rejectionReason = '';
    await payment.save();

    booking.paymentStatus = 'paid_pending_verification';
    booking.paymentProvider = 'manual_upi';
    booking.paymentOrderId = payment.orderId;
    booking.transactionId = payment.utr;
    booking.paymentScreenshot = paymentScreenshot;
    booking.paymentFailureReason = '';
    booking.upiIdUsed = payment.upiId || booking.upiIdUsed || '';
    booking.paidAt = payment.submittedAt;
    await booking.save();

    await createNotification({
      user: booking.organizer.toString(),
      type: 'payment',
      title: 'Payment submitted for verification',
      message: `${req.user.name} submitted payment proof for ${(booking.service as any)?.title || 'a booking'}.`,
      link: '/dashboard/seller',
      metadata: {
        bookingId: booking._id.toString(),
      },
    });

    const populatedBooking = await populateBookingById(booking._id.toString());

    res.status(200).json({
      success: true,
      data: populatedBooking,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('service', 'title upiId');

    if (!booking || isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!ensureOrganizerAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    booking.paymentStatus = 'verified';
    booking.status = booking.status === 'cancelled' ? booking.status : 'confirmed';
    booking.paidAt = booking.paidAt || new Date();
    await booking.save();

    let payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });

    if (!payment) {
      payment = await Payment.create({
        user: booking.user,
        organizer: booking.organizer,
        service: booking.service,
        booking: booking._id,
        orderId: booking.paymentOrderId || buildPaymentOrderId(),
        amount: booking.amount,
        currency: booking.currency || 'INR',
        upiId: booking.upiIdUsed || (booking.service as any)?.upiId || '',
        utr: booking.transactionId || '',
        status: 'confirmed',
        submittedAt: booking.paidAt || new Date(),
        reviewedAt: new Date(),
        expiresAt: booking.paidAt || new Date(),
      });
    } else if (payment.status !== 'confirmed') {
      payment.status = 'confirmed';
      payment.reviewedAt = new Date();
      payment.rejectionReason = '';
      if (!payment.submittedAt) {
        payment.submittedAt = booking.paidAt || new Date();
      }
      if (!payment.utr && booking.transactionId) {
        payment.utr = booking.transactionId;
      }
      await payment.save();
    }

    await createNotification({
      user: booking.user.toString(),
      type: 'payment',
      title: 'Payment verified',
      message: `Your payment for ${(booking.service as any)?.title || 'your booking'} has been verified.`,
      link: '/dashboard/buyer',
      metadata: {
        bookingId: booking._id.toString(),
      },
    });

    const populatedBooking = await populateBookingById(booking._id.toString());

    res.status(200).json({
      success: true,
      data: populatedBooking,
    });
  } catch (err) {
    next(err);
  }
};

export const updateBookingStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('service', 'title');

    if (!booking || isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!ensureOrganizerAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    try {
      transitionBookingStatus(booking, req.body.status);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Invalid booking status change',
      });
    }

    await booking.save();

    await createNotification({
      user: booking.user.toString(),
      type: 'booking',
      title: `Booking ${req.body.status}`,
      message: `Your booking for ${(booking.service as any)?.title || 'a service'} is now ${req.body.status}.`,
      link: '/dashboard/buyer',
      metadata: {
        bookingId: booking._id.toString(),
        status: req.body.status,
      },
    });

    const populatedBooking = await populateBookingById(booking._id.toString());

    res.status(200).json({
      success: true,
      data: populatedBooking,
    });
  } catch (err) {
    next(err);
  }
};
