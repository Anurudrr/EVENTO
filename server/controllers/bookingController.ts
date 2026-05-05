import crypto from 'crypto';
import type { Response, NextFunction } from 'express';
import Booking, { createBookingOrderId } from '../models/Booking.ts';
import Payment from '../models/Payment.ts';
import Service from '../models/Service.ts';
import RefundRequest from '../models/RefundRequest.ts';
import Dispute from '../models/Dispute.ts';
import { uploadImageBuffer } from '../utils/cloudinary.ts';
import { createNotification } from '../utils/notifications.ts';
import { isPastDateKey, startOfDayUtc, toDateKey } from '../utils/date.ts';
import { isSmokeTestBooking } from '../utils/smokeArtifacts.ts';
import { recordAuditLog } from '../utils/audit.ts';
import { syncSettlementForBooking } from '../utils/ops.ts';
import {
  assertBookingStatusTransition,
  getPaymentVerificationLockError,
  isInactiveBookingStatus,
} from '../utils/bookingState.ts';

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

const ensureBookingPaymentAccess = (booking: any, user: any) => {
  return [resolveReferenceId(booking.user), resolveReferenceId(booking.organizer)].includes(user.id) || user.role === 'admin';
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

const buildBookingReference = () => (
  `EVT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
);

const buildPaymentOrderId = () => (
  `EVTPAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
);

const getDuplicateKeyFields = (error: any) => (
  Object.keys(error?.keyPattern || error?.keyValue || {})
);

const buildDuplicateKeyMessage = (error: any) => {
  const duplicateFields = getDuplicateKeyFields(error);

  if (duplicateFields.length === 0) {
    return 'A unique booking constraint was hit. Please retry.';
  }

  return `A unique booking constraint was hit for: ${duplicateFields.join(', ')}. Please retry.`;
};

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

const normalizeServiceLocation = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const lat = Number(candidate.lat);
  const lng = Number(candidate.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return {
    lat,
    lng,
  };
};

const resolveSelectedPackage = (service: any, packageIdValue: unknown) => {
  const packageId = typeof packageIdValue === 'string' ? packageIdValue.trim() : '';

  if (!packageId || !Array.isArray(service?.packages)) {
    return null;
  }

  return service.packages.find((pkg: any) => pkg?._id?.toString?.() === packageId) || null;
};

const resolveSelectedAddOns = (service: any, value: unknown) => {
  const requestedAddOns = Array.isArray(value) ? value : [];
  const availableAddOns = Array.isArray(service?.addOns) ? service.addOns : [];

  return requestedAddOns
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const addOnId = typeof (entry as Record<string, unknown>).addOnId === 'string'
        ? (entry as Record<string, unknown>).addOnId as string
        : '';
      const quantity = Math.max(1, Number((entry as Record<string, unknown>).quantity || 1));
      const matchedAddOn = availableAddOns.find((addOn: any) => addOn?._id?.toString?.() === addOnId);

      if (!matchedAddOn) {
        return null;
      }

      return {
        addOnId,
        name: matchedAddOn.name,
        price: Number(matchedAddOn.price || 0),
        quantity,
      };
    })
    .filter(Boolean);
};

const resolveCustomResponses = (service: any, value: unknown) => {
  const requestedResponses = Array.isArray(value) ? value : [];
  const availableQuestions = Array.isArray(service?.customQuestions) ? service.customQuestions : [];

  return requestedResponses
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const entryRecord = entry as Record<string, unknown>;
      const questionId = typeof (entry as Record<string, unknown>).questionId === 'string'
        ? (entry as Record<string, unknown>).questionId as string
        : '';
      const answerValue = entryRecord.answer;
      const answer = typeof answerValue === 'string'
        ? answerValue.trim()
        : '';

      if (!answer) {
        return null;
      }

      const matchedQuestion = availableQuestions.find((question: any) => question?._id?.toString?.() === questionId);
      const label = matchedQuestion?.label
        || (typeof entryRecord.label === 'string' ? entryRecord.label as string : '');

      return {
        questionId,
        label,
        answer,
      };
    })
    .filter(Boolean);
};

const validateRequiredQuestions = (service: any, responses: Array<{ questionId?: string; answer: string }>) => {
  const availableQuestions = Array.isArray(service?.customQuestions) ? service.customQuestions : [];

  const missingQuestions = availableQuestions.filter((question: any) => {
    if (!question?.required) {
      return false;
    }

    return !responses.some((response) => response.questionId === question._id.toString() && response.answer.trim());
  });

  return missingQuestions;
};

const roundCurrency = (value: number) => Math.round((Number(value) || 0) * 100) / 100;

const resolveBookingPricing = (service: any, selectedPackage: any, selectedAddOns: any[]) => {
  const baseAmount = roundCurrency(Number(selectedPackage?.price ?? service?.price ?? 0));
  const minimumSpend = roundCurrency(Number(service?.minimumSpend || 0));
  const addOnAmount = roundCurrency(selectedAddOns.reduce(
    (sum, addOn) => sum + (Number(addOn.price || 0) * Number(addOn.quantity || 1)),
    0,
  ));
  const totalAmount = roundCurrency(Math.max(minimumSpend, baseAmount + addOnAmount));
  const advancePercentage = Number(service?.advancePercentage ?? 100);
  const normalizedAdvancePercentage = Number.isFinite(advancePercentage)
    ? Math.min(100, Math.max(0, advancePercentage))
    : 100;
  const advanceAmount = normalizedAdvancePercentage > 0
    ? roundCurrency(totalAmount * (normalizedAdvancePercentage / 100))
    : totalAmount;
  const balanceAmount = roundCurrency(Math.max(0, totalAmount - advanceAmount));
  const pricingMode = selectedPackage
    ? 'package'
    : (service?.bookingMode === 'quote' || selectedAddOns.length > 0 ? 'quote' : 'standard');

  return {
    pricingMode,
    totalAmount,
    advanceAmount,
    balanceAmount,
  };
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
    const serviceLocation = normalizeServiceLocation(req.body.serviceLocation);
    const selectedPackage = resolveSelectedPackage(service, req.body.selectedPackageId);
    const selectedAddOns = resolveSelectedAddOns(service, req.body.selectedAddOns);
    const customResponses = resolveCustomResponses(service, req.body.customResponses);
    const missingRequiredQuestions = validateRequiredQuestions(service, customResponses as any);

    if (!serviceLocation) {
      return res.status(400).json({
        success: false,
        error: 'A valid service location must be selected on the map',
      });
    }

    if (typeof req.body.selectedPackageId === 'string' && req.body.selectedPackageId.trim() && !selectedPackage) {
      return res.status(400).json({
        success: false,
        error: 'The selected package is no longer available for this service',
      });
    }

    if (missingRequiredQuestions.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Please answer the required booking questions: ${missingRequiredQuestions.map((question: any) => question.label).join(', ')}`,
      });
    }

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

    const pricing = resolveBookingPricing(service, selectedPackage, selectedAddOns as any[]);

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
      serviceLocation,
      time: req.body.time.trim(),
      guests: Number(req.body.guests),
      notes: req.body.notes || '',
      pricingMode: pricing.pricingMode,
      selectedPackageId: selectedPackage?._id?.toString?.() || '',
      packageName: selectedPackage?.name || '',
      packagePrice: Number(selectedPackage?.price || 0),
      selectedAddOns,
      customResponses,
      amount: pricing.advanceAmount,
      totalAmount: pricing.totalAmount,
      advanceAmount: pricing.advanceAmount,
      balanceAmount: pricing.balanceAmount,
      commissionRate: 0.12,
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
        pricingMode: pricing.pricingMode,
      },
    });

    await recordAuditLog({
      actor: req.user.id,
      role: req.user.role,
      action: 'booking.created',
      entityType: 'booking',
      entityId: booking._id.toString(),
      status: 'success',
      summary: `Booking created for ${service.title}.`,
      metadata: {
        serviceId: service._id.toString(),
        totalAmount: pricing.totalAmount,
        advanceAmount: pricing.advanceAmount,
        pricingMode: pricing.pricingMode,
      },
    });

    res.status(201).json({
      success: true,
      data: populatedBooking,
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return res.status(409).json({
        success: false,
        error: buildDuplicateKeyMessage(err),
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

    if (isInactiveBookingStatus(booking.status)) {
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

    const paymentVerificationError = getPaymentVerificationLockError(booking);
    if (paymentVerificationError) {
      return res.status(400).json({ success: false, error: paymentVerificationError });
    }

    booking.paymentStatus = 'verified';
    booking.status = 'confirmed';
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

    await Payment.updateMany(
      { booking: booking._id, _id: { $ne: payment._id }, status: 'pending' },
      {
        $set: {
          status: 'rejected',
          rejectionReason: 'Another payment was confirmed for this booking.',
          reviewedAt: new Date(),
        },
      },
    );

    await syncSettlementForBooking(booking, {
      paymentId: payment._id.toString(),
      note: 'Payment verified and settlement prepared for organizer payout.',
    });

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

    await recordAuditLog({
      actor: req.user.id,
      role: req.user.role,
      action: 'booking.payment.verified',
      entityType: 'booking',
      entityId: booking._id.toString(),
      status: 'success',
      summary: `Payment verified for booking ${booking.bookingReference}.`,
      metadata: {
        paymentId: payment._id.toString(),
        orderId: booking.paymentOrderId,
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
      booking.status = assertBookingStatusTransition(booking.status, req.body.status);
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

export const requestBookingRefund = async (req: any, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('service', 'title');

    if (!booking || isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!ensureUserAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized to request a refund for this booking' });
    }

    if (booking.paymentStatus !== 'verified') {
      return res.status(400).json({ success: false, error: 'Only verified payments can enter the refund workflow' });
    }

    if (['requested', 'approved', 'processed'].includes(booking.refundStatus || 'none')) {
      return res.status(400).json({ success: false, error: 'A refund workflow already exists for this booking' });
    }

    const payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });
    const refundAmount = Math.min(
      Number(req.body.amount || booking.amount || 0),
      Number(booking.amount || 0),
    );

    const refundRequest = await RefundRequest.create({
      booking: booking._id,
      payment: payment?._id || null,
      service: booking.service,
      user: booking.user,
      organizer: booking.organizer,
      amount: refundAmount,
      reason: req.body.reason.trim(),
      status: 'requested',
    });

    booking.refundStatus = 'requested';
    booking.refundAmount = refundAmount;
    await booking.save();

    await syncSettlementForBooking(booking, {
      paymentId: payment?._id?.toString?.() || null,
      note: 'Refund requested and settlement placed on hold.',
    });

    await Promise.all([
      createNotification({
        user: booking.organizer.toString(),
        type: 'payment',
        title: 'Refund requested',
        message: `${req.user.name} requested a refund for ${(booking.service as any)?.title || 'a booking'}.`,
        link: '/dashboard/seller',
        metadata: {
          bookingId: booking._id.toString(),
          refundRequestId: refundRequest._id.toString(),
        },
      }),
      recordAuditLog({
        actor: req.user.id,
        role: req.user.role,
        action: 'booking.refund.requested',
        entityType: 'refundRequest',
        entityId: refundRequest._id.toString(),
        status: 'warning',
        summary: `Refund requested for booking ${booking.bookingReference}.`,
        metadata: {
          bookingId: booking._id.toString(),
          amount: refundAmount,
        },
      }),
    ]);

    const populatedBooking = await populateBookingById(booking._id.toString());

    res.status(201).json({
      success: true,
      data: {
        booking: populatedBooking,
        refundRequest,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createBookingDispute = async (req: any, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('service', 'title');

    if (!booking || isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!ensureBookingPaymentAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized to raise a dispute for this booking' });
    }

    const payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });
    const against = resolveReferenceId(booking.user) === req.user.id
      ? resolveReferenceId(booking.organizer)
      : resolveReferenceId(booking.user);

    const dispute = await Dispute.create({
      booking: booking._id,
      payment: payment?._id || null,
      service: booking.service,
      raisedBy: req.user.id,
      against,
      category: req.body.category.trim(),
      details: req.body.details.trim(),
      status: 'open',
    });

    await Promise.all([
      createNotification({
        user: against,
        type: 'system',
        title: 'Booking dispute opened',
        message: `${req.user.name} opened a dispute for ${(booking.service as any)?.title || 'a booking'}.`,
        link: req.user.role === 'organizer' ? '/dashboard/buyer' : '/dashboard/seller',
        metadata: {
          bookingId: booking._id.toString(),
          disputeId: dispute._id.toString(),
        },
      }),
      recordAuditLog({
        actor: req.user.id,
        role: req.user.role,
        action: 'booking.dispute.created',
        entityType: 'dispute',
        entityId: dispute._id.toString(),
        status: 'warning',
        summary: `Dispute opened for booking ${booking.bookingReference}.`,
        metadata: {
          bookingId: booking._id.toString(),
          category: dispute.category,
        },
      }),
    ]);

    res.status(201).json({
      success: true,
      data: dispute,
    });
  } catch (err) {
    next(err);
  }
};
