import type { Response, NextFunction } from 'express';
import User from '../models/User.ts';
import Service from '../models/Service.ts';
import Booking from '../models/Booking.ts';
import Payment from '../models/Payment.ts';
import { createNotification } from '../utils/notifications.ts';
import {
  isSmokeTestBooking,
  isSmokeTestPayment,
  isSmokeTestService,
  isSmokeTestUser,
} from '../utils/smokeArtifacts.ts';

const userSelect = 'name email role profilePicture bio createdAt upiId';
const organizerSelect = 'name email role profilePicture bio createdAt upiId';
const serviceOrganizerPopulate = { path: 'organizer', select: organizerSelect };

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

export const getAdminOverview = async (req: any, res: Response, next: NextFunction) => {
  try {
    const [users, services, bookings, payments] = await Promise.all([
      User.find().sort({ createdAt: -1 }).select('name email role profilePicture createdAt'),
      Service.find()
        .populate('organizer', 'name email role profilePicture')
        .sort({ createdAt: -1 }),
      Booking.find()
        .populate('user', 'name email role profilePicture')
        .populate('organizer', 'name email role profilePicture')
        .populate({
          path: 'service',
          populate: { path: 'organizer', select: 'name email role profilePicture' },
        })
        .sort({ createdAt: -1 }),
      Payment.find()
        .populate([
          { path: 'user', select: userSelect },
          { path: 'organizer', select: organizerSelect },
          { path: 'service', populate: serviceOrganizerPopulate },
          {
            path: 'booking',
            select: 'orderId bookingReference date time status paymentStatus amount currency contactName phone eventType paidAt createdAt',
          },
        ])
        .sort({ createdAt: -1 }),
    ]);

    const visibleUsers = users.filter((user: any) => !isSmokeTestUser(user));
    const visibleServices = services.filter((service: any) => !isSmokeTestService(service));
    const visibleBookings = bookings.filter((booking: any) => !isSmokeTestBooking(booking));
    const visiblePayments = payments.filter((payment: any) => !isSmokeTestPayment(payment));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          users: visibleUsers.length,
          organizers: visibleUsers.filter((user: any) => user.role === 'organizer').length,
          services: visibleServices.length,
          bookings: visibleBookings.length,
          payments: visiblePayments.length,
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

    if (['cancelled', 'rejected'].includes(booking.status)) {
      return res.status(400).json({ success: false, error: 'Cancelled or rejected bookings cannot be approved' });
    }

    payment.status = 'confirmed';
    payment.rejectionReason = '';
    payment.reviewedAt = new Date();
    await payment.save();

    booking.paymentProvider = booking.paymentProvider === 'none' ? 'upi_qr' : booking.paymentProvider;
    booking.paymentOrderId = payment.orderId;
    booking.transactionId = payment.utr;
    booking.upiIdUsed = payment.upiId || booking.upiIdUsed || (booking.service as any)?.upiId || '';
    booking.paymentStatus = 'verified';
    booking.paymentFailureReason = '';
    booking.paidAt = booking.paidAt || payment.submittedAt || new Date();
    booking.status = booking.status === 'cancelled' ? booking.status : 'confirmed';
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
