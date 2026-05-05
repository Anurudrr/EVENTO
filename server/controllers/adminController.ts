import type { Response, NextFunction } from 'express';
import User from '../models/User.ts';
import Service from '../models/Service.ts';
import Booking from '../models/Booking.ts';
import Payment from '../models/Payment.ts';
import { createNotification } from '../utils/notifications.ts';
import { syncSettlementForBooking } from '../utils/ops.ts';
import { isInactiveBookingStatus } from '../utils/bookingState.ts';
import {
  isSmokeTestBooking,
  isSmokeTestPayment,
  isSmokeTestService,
  isSmokeTestUser,
} from '../utils/smokeArtifacts.ts';

const userSelect = 'name email role profilePicture bio createdAt upiId';
const organizerSelect = 'name email role profilePicture bio createdAt upiId businessName businessType businessLocation responseTimeHours verificationStatus verificationNotes verificationSubmittedAt verifiedAt';
const serviceOrganizerPopulate = { path: 'organizer', select: organizerSelect };
const ADMIN_PENDING_REVIEW_LIMIT = 40;
const ADMIN_RECENT_USERS_LIMIT = 24;
const ADMIN_RECENT_SERVICES_LIMIT = 24;
const ADMIN_RECENT_BOOKINGS_LIMIT = 24;
const ADMIN_PENDING_PAYMENTS_LIMIT = 40;
const ADMIN_RECENT_PAYMENTS_LIMIT = 24;

const populatePaymentById = async (paymentId: string) => (
  Payment.findById(paymentId).populate([
    { path: 'user', select: userSelect },
    { path: 'organizer', select: organizerSelect },
    { path: 'service', populate: serviceOrganizerPopulate },
    {
      path: 'booking',
      populate: [
        { path: 'user', select: userSelect },
        { path: 'organizer', select: organizerSelect },
        { path: 'service', populate: serviceOrganizerPopulate },
      ],
    },
  ])
);

const populateBookingById = async (bookingId: string) => (
  Booking.findById(bookingId)
    .populate([
      { path: 'service', populate: serviceOrganizerPopulate },
      { path: 'user', select: userSelect },
      { path: 'organizer', select: organizerSelect },
    ])
);

const mergeUniqueById = <T extends { _id?: { toString?: () => string } | string }>(...groups: T[][]) => {
  const merged = new Map<string, T>();

  groups.flat().forEach((entry) => {
    const id = entry?._id?.toString?.() || String(entry?._id || '');
    if (id && !merged.has(id)) {
      merged.set(id, entry);
    }
  });

  return Array.from(merged.values());
};

export const getAdminOverview = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userListSelect = 'name email role profilePicture bio createdAt upiId businessName businessType businessLocation responseTimeHours verificationStatus verificationNotes verificationSubmittedAt verifiedAt';
    const bookingPopulate = [
      { path: 'user', select: 'name email role profilePicture' },
      { path: 'organizer', select: 'name email role profilePicture' },
      {
        path: 'service',
        populate: { path: 'organizer', select: 'name email role profilePicture' },
      },
    ];
    const paymentPopulate = [
      { path: 'user', select: userSelect },
      { path: 'organizer', select: organizerSelect },
      { path: 'service', populate: serviceOrganizerPopulate },
      {
        path: 'booking',
        select: 'orderId bookingReference date time status paymentStatus amount currency contactName phone eventType paidAt createdAt',
      },
    ];

    const [
      totalUsers,
      totalOrganizers,
      totalVerifiedOrganizers,
      totalPendingOrganizerReviews,
      totalServices,
      totalBookings,
      totalPayments,
      pendingOrganizerUsers,
      recentUsers,
      recentServices,
      recentBookings,
      pendingPayments,
      recentPayments,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'organizer' }),
      User.countDocuments({ role: 'organizer', verificationStatus: 'verified' }),
      User.countDocuments({ role: 'organizer', verificationStatus: 'pending' }),
      Service.countDocuments(),
      Booking.countDocuments(),
      Payment.countDocuments(),
      User.find({ role: 'organizer', verificationStatus: 'pending' })
        .sort({ verificationSubmittedAt: 1, createdAt: -1 })
        .select(userListSelect)
        .limit(ADMIN_PENDING_REVIEW_LIMIT),
      User.find()
        .sort({ createdAt: -1 })
        .select(userListSelect)
        .limit(ADMIN_RECENT_USERS_LIMIT),
      Service.find()
        .populate('organizer', 'name email role profilePicture')
        .sort({ createdAt: -1 })
        .limit(ADMIN_RECENT_SERVICES_LIMIT),
      Booking.find()
        .populate(bookingPopulate)
        .sort({ createdAt: -1 })
        .limit(ADMIN_RECENT_BOOKINGS_LIMIT),
      Payment.find({ status: 'pending' })
        .populate(paymentPopulate)
        .sort({ submittedAt: -1, createdAt: -1 })
        .limit(ADMIN_PENDING_PAYMENTS_LIMIT),
      Payment.find()
        .populate(paymentPopulate)
        .sort({ createdAt: -1 })
        .limit(ADMIN_RECENT_PAYMENTS_LIMIT),
    ]);

    const visibleUsers = mergeUniqueById(pendingOrganizerUsers, recentUsers)
      .filter((user: any) => !isSmokeTestUser(user));
    const visibleServices = recentServices.filter((service: any) => !isSmokeTestService(service));
    const visibleBookings = recentBookings.filter((booking: any) => !isSmokeTestBooking(booking));
    const visiblePayments = mergeUniqueById(pendingPayments, recentPayments)
      .filter((payment: any) => !isSmokeTestPayment(payment));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          users: totalUsers,
          organizers: totalOrganizers,
          verifiedOrganizers: totalVerifiedOrganizers,
          pendingOrganizerReviews: totalPendingOrganizerReviews,
          services: totalServices,
          bookings: totalBookings,
          payments: totalPayments,
        },
        users: visibleUsers,
        services: visibleServices,
        bookings: visibleBookings,
        payments: visiblePayments,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deleteServiceAsAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

export const approvePaymentAsAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    if (payment.status === 'confirmed') {
      const populatedPayment = await populatePaymentById(payment._id.toString());
      return res.status(200).json({ success: true, data: { payment: populatedPayment } });
    }

    if (payment.status === 'rejected') {
      return res.status(400).json({ success: false, error: 'Rejected payments cannot be approved. Create a new payment session instead.' });
    }

    const booking = await Booking.findById(payment.booking).populate('service', 'title upiId');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found for this payment' });
    }

    if (isInactiveBookingStatus(booking.status)) {
      return res.status(400).json({ success: false, error: 'Inactive bookings cannot be approved' });
    }

    payment.status = 'confirmed';
    payment.rejectionReason = '';
    payment.submittedAt = payment.submittedAt || payment.createdAt || new Date();
    payment.reviewedAt = new Date();
    await payment.save();

    booking.paymentProvider = booking.paymentProvider === 'none' ? 'upi_qr' : booking.paymentProvider;
    booking.paymentOrderId = payment.orderId;
    booking.transactionId = payment.utr;
    booking.upiIdUsed = payment.upiId || booking.upiIdUsed || (booking.service as any)?.upiId || '';
    booking.paymentStatus = 'verified';
    booking.paymentFailureReason = '';
    booking.paidAt = booking.paidAt || payment.submittedAt || new Date();
    booking.status = 'confirmed';
    await booking.save();

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

    await createNotification({
      user: booking.user.toString(),
      type: 'payment',
      title: 'Payment approved',
      message: `Your payment for ${(booking.service as any)?.title || 'your booking'} has been approved.`,
      link: '/dashboard/buyer',
      metadata: {
        bookingId: booking._id.toString(),
        orderId: payment.orderId,
      },
    });

    await syncSettlementForBooking(booking, {
      paymentId: payment._id.toString(),
      note: 'Payment approved by admin and settlement prepared for organizer payout.',
    });

    const [populatedPayment, populatedBooking] = await Promise.all([
      populatePaymentById(payment._id.toString()),
      populateBookingById(booking._id.toString()),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payment: populatedPayment,
        booking: populatedBooking,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const rejectPaymentAsAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }

    if (payment.status === 'confirmed') {
      return res.status(400).json({ success: false, error: 'Confirmed payments cannot be rejected' });
    }

    const booking = await Booking.findById(payment.booking).populate('service', 'title');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found for this payment' });
    }

    const reason = typeof req.body.reason === 'string' && req.body.reason.trim()
      ? req.body.reason.trim()
      : 'Payment could not be verified. Please submit a fresh transaction.';

    payment.status = 'rejected';
    payment.rejectionReason = reason;
    payment.reviewedAt = new Date();
    await payment.save();

    booking.paymentProvider = booking.paymentProvider === 'none' ? 'upi_qr' : booking.paymentProvider;
    booking.paymentOrderId = payment.orderId;
    booking.transactionId = payment.utr;
    booking.paymentStatus = 'failed';
    booking.paymentFailureReason = reason;
    await booking.save();

    await createNotification({
      user: booking.user.toString(),
      type: 'payment',
      title: 'Payment rejected',
      message: `Your payment for ${(booking.service as any)?.title || 'your booking'} was rejected. ${reason}`,
      link: '/dashboard/buyer',
      metadata: {
        bookingId: booking._id.toString(),
        orderId: payment.orderId,
      },
    });

    const [populatedPayment, populatedBooking] = await Promise.all([
      populatePaymentById(payment._id.toString()),
      populateBookingById(booking._id.toString()),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payment: populatedPayment,
        booking: populatedBooking,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const approveOrganizerVerificationAsAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizer = await User.findById(req.params.id);

    if (!organizer || isSmokeTestUser(organizer)) {
      return res.status(404).json({ success: false, error: 'Organizer not found' });
    }

    if (organizer.role !== 'organizer') {
      return res.status(400).json({ success: false, error: 'Only organizer accounts can be verified' });
    }

    organizer.verificationStatus = 'verified';
    organizer.verifiedAt = new Date();
    organizer.verificationSubmittedAt = organizer.verificationSubmittedAt || new Date();
    organizer.verificationNotes = typeof req.body.reason === 'string' && req.body.reason.trim()
      ? req.body.reason.trim()
      : 'Business profile and payment details reviewed by admin.';
    await organizer.save();

    await createNotification({
      user: organizer._id.toString(),
      type: 'system',
      title: 'Organizer verification approved',
      message: 'Your organizer profile is now verified and the badge is visible on your public listings.',
      link: '/profile',
      metadata: {
        organizerId: organizer._id.toString(),
      },
    });

    res.status(200).json({
      success: true,
      data: organizer,
    });
  } catch (err) {
    next(err);
  }
};

export const rejectOrganizerVerificationAsAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const organizer = await User.findById(req.params.id);

    if (!organizer || isSmokeTestUser(organizer)) {
      return res.status(404).json({ success: false, error: 'Organizer not found' });
    }

    if (organizer.role !== 'organizer') {
      return res.status(400).json({ success: false, error: 'Only organizer accounts can be reviewed' });
    }

    const reason = typeof req.body.reason === 'string' && req.body.reason.trim()
      ? req.body.reason.trim()
      : 'Please complete your business profile, payout details, and response SLA before resubmitting.';

    organizer.verificationStatus = 'rejected';
    organizer.verificationNotes = reason;
    organizer.verifiedAt = undefined;
    organizer.verificationSubmittedAt = organizer.verificationSubmittedAt || new Date();
    await organizer.save();

    await createNotification({
      user: organizer._id.toString(),
      type: 'system',
      title: 'Organizer verification needs changes',
      message: reason,
      link: '/profile',
      metadata: {
        organizerId: organizer._id.toString(),
      },
    });

    res.status(200).json({
      success: true,
      data: organizer,
    });
  } catch (err) {
    next(err);
  }
};
