import crypto from 'crypto';
import type { Response, NextFunction } from 'express';
import Booking from '../models/Booking.ts';
import Payment from '../models/Payment.ts';
import Service from '../models/Service.ts';
import { getRazorpayConfig, hasRazorpayCredentials } from '../utils/env.ts';
import { createNotification } from '../utils/notifications.ts';
import { getRazorpayClient, verifyRazorpaySignature } from '../utils/razorpay.ts';
import { isSmokeTestBooking, isSmokeTestPayment } from '../utils/smokeArtifacts.ts';
import { syncSettlementForBooking } from '../utils/ops.ts';
import {
  getPaymentStartError,
  getPaymentVerificationLockError,
  isInactiveBookingStatus,
} from '../utils/bookingState.ts';
import { sendPaymentSubmittedAlertEmail, sendPaymentVerifiedEmail } from '../utils/mailer.ts';

const userSelect = 'name email role profilePicture bio createdAt upiId';
const organizerSelect = 'name email role profilePicture bio createdAt upiId';
const serviceOrganizerPopulate = { path: 'organizer', select: organizerSelect };
const PAYMENT_WINDOW_MINUTES = 10;
const PAYMENT_PAYEE_NAME = 'Evento';

const populateBookingById = async (bookingId: string) => (
  Booking.findById(bookingId)
    .populate([
      { path: 'service', populate: serviceOrganizerPopulate },
      { path: 'user', select: userSelect },
      { path: 'organizer', select: organizerSelect },
    ])
);

const populatePaymentById = async (paymentId: string) => (
  Payment.findById(paymentId)
    .populate([
      { path: 'user', select: userSelect },
      { path: 'organizer', select: organizerSelect },
      { path: 'service', populate: serviceOrganizerPopulate },
      {
        path: 'booking',
        select: 'orderId bookingReference date time status paymentStatus amount currency contactName phone eventType eventLocation paidAt createdAt',
      },
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

const ensureUserAccess = (booking: any, user: any) => (
  resolveReferenceId(booking.user) === user.id || user.role === 'admin'
);

const ensureBookingPaymentAccess = (booking: any, user: any) => (
  [resolveReferenceId(booking.user), resolveReferenceId(booking.organizer)].includes(user.id) || user.role === 'admin'
);

const syncConfirmedPaymentRecord = async (
  booking: any,
  payload: {
    orderId: string;
    paymentReference: string;
    amount: number;
    currency: string;
    submittedAt: Date;
  },
) => {
  let payment = await Payment.findOne({
    booking: booking._id,
    orderId: payload.orderId,
  }).sort({ createdAt: -1 });

  if (!payment) {
    payment = await Payment.create({
      user: booking.user,
      organizer: booking.organizer,
      service: booking.service,
      booking: booking._id,
      orderId: payload.orderId,
      amount: payload.amount,
      currency: payload.currency,
      upiId: '',
      utr: payload.paymentReference,
      status: 'confirmed',
      submittedAt: payload.submittedAt,
      reviewedAt: new Date(),
      expiresAt: payload.submittedAt,
    });
  } else {
    payment.amount = payload.amount;
    payment.currency = payload.currency;
    payment.utr = payload.paymentReference;
    payment.status = 'confirmed';
    payment.rejectionReason = '';
    payment.submittedAt = payment.submittedAt || payload.submittedAt;
    payment.reviewedAt = new Date();
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

  return payment;
};

const buildFailureReason = (payload: Record<string, unknown>) => {
  const parts = [
    payload.description,
    payload.reason,
    payload.code,
  ].filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

  return parts.join(' | ').slice(0, 500);
};

const buildPaymentOrderId = () => (
  `EVTPAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
);

export const createRazorpayOrder = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!hasRazorpayCredentials()) {
      return res.status(503).json({
        success: false,
        error: 'Razorpay is not configured for this environment yet.',
      });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('service', 'title price')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!ensureUserAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const paymentStartError = getPaymentStartError(booking);
    if (paymentStartError) {
      return res.status(400).json({ success: false, error: paymentStartError });
    }

    const amount = Math.round(Number(booking.amount || 0) * 100);
    if (amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid booking amount' });
    }

    const client = getRazorpayClient();
    const order = await client.orders.create({
      amount,
      currency: booking.currency || 'INR',
      receipt: booking.bookingReference,
      notes: {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
      },
    });

    booking.paymentProvider = 'razorpay';
    booking.paymentOrderId = order.id;
    booking.paymentFailureReason = '';
    booking.paymentStatus = 'pending';
    await booking.save();

    const { keyId } = getRazorpayConfig();

    res.status(200).json({
      success: true,
      data: {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        company: 'EVENTO',
        description: typeof booking.service === 'object' ? (booking.service as any)?.title || 'EVENTO booking' : 'EVENTO booking',
        prefill: {
          name: typeof booking.user === 'object' ? (booking.user as any)?.name || booking.contactName : booking.contactName,
          email: typeof booking.user === 'object' ? (booking.user as any)?.email || '' : '',
          contact: booking.phone || '',
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const verifyRazorpayPaymentForBooking = async (req: any, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!ensureUserAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const paymentVerificationError = getPaymentVerificationLockError(booking);
    if (paymentVerificationError) {
      return res.status(400).json({ success: false, error: paymentVerificationError });
    }

    if (booking.paymentOrderId && booking.paymentOrderId !== req.body.razorpay_order_id) {
      return res.status(400).json({ success: false, error: 'Payment order mismatch for this booking' });
    }

    const isValidSignature = verifyRazorpaySignature(
      req.body.razorpay_order_id,
      req.body.razorpay_payment_id,
      req.body.razorpay_signature,
    );

    if (!isValidSignature) {
      return res.status(400).json({ success: false, error: 'Unable to verify Razorpay payment signature' });
    }

    const paidAt = new Date();
    const payment = await syncConfirmedPaymentRecord(booking, {
      orderId: req.body.razorpay_order_id,
      paymentReference: req.body.razorpay_payment_id,
      amount: Number(booking.amount || 0),
      currency: booking.currency || 'INR',
      submittedAt: paidAt,
    });

    booking.paymentProvider = 'razorpay';
    booking.paymentOrderId = req.body.razorpay_order_id;
    booking.paymentId = req.body.razorpay_payment_id;
    booking.paymentSignature = req.body.razorpay_signature;
    booking.transactionId = req.body.razorpay_payment_id;
    booking.paymentStatus = 'verified';
    booking.paymentFailureReason = '';
    booking.paidAt = booking.paidAt || paidAt;
    booking.status = 'confirmed';
    await booking.save();

    await syncSettlementForBooking(booking, {
      paymentId: payment._id.toString(),
      note: 'Razorpay payment verified and settlement prepared for organizer payout.',
    });

    await createNotification({
      user: booking.organizer.toString(),
      type: 'payment',
      title: 'Payment completed',
      message: `${booking.contactName} completed payment for booking ${booking.bookingReference}.`,
      link: '/dashboard/seller',
      metadata: {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
      },
    });

    const populatedBooking = await populateBookingById(booking._id.toString());

    sendPaymentVerifiedEmail({
      buyerEmail: populatedBooking?.user?.email || '',
      buyerName: populatedBooking?.user?.name || '',
      serviceTitle: populatedBooking?.service?.title || '',
      bookingReference: booking.bookingReference,
      amount: booking.amount.toString(),
    }).catch((err) => console.error('[email] Error sending payment verification:', err));

    res.status(200).json({
      success: true,
      data: populatedBooking,
    });
  } catch (err) {
    next(err);
  }
};

const buildUpiPaymentLink = (upiId: string, amount: number, orderId: string) => (
  `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(PAYMENT_PAYEE_NAME)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId)}`
);

const rejectExpiredPayment = async (payment: any) => {
  if (!payment || payment.status !== 'pending' || payment.utr) {
    return payment;
  }

  const expiresAt = new Date(payment.expiresAt);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() > Date.now()) {
    return payment;
  }

  payment.status = 'rejected';
  payment.rejectionReason = 'Payment window expired before transaction details were submitted.';
  payment.reviewedAt = new Date();
  await payment.save();

  return payment;
};

const createSessionPayload = (payment: any, booking: any, service: any) => ({
  bookingId: booking._id.toString(),
  bookingReference: booking.bookingReference,
  orderId: payment.orderId,
  amount: payment.amount,
  currency: payment.currency || 'INR',
  upiId: payment.upiId,
  upiLink: buildUpiPaymentLink(payment.upiId, Number(payment.amount || 0), payment.orderId),
  payeeName: PAYMENT_PAYEE_NAME,
  expiresAt: payment.expiresAt,
  submittedAt: payment.submittedAt,
  status: payment.status,
  rejectionReason: payment.rejectionReason || '',
  serviceTitle: typeof service?.title === 'string' ? service.title : 'EVENTO booking',
  payment,
});

export const createUpiPaymentSession = async (req: any, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'title price upiId organizer')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!ensureUserAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const paymentStartError = getPaymentStartError(booking);
    if (paymentStartError) {
      return res.status(400).json({ success: false, error: paymentStartError });
    }

    const amount = Number(booking.amount || 0);
    if (amount <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid booking amount' });
    }

    const service = typeof booking.service === 'object'
      ? booking.service
      : await Service.findById(booking.service).select('title upiId organizer');

    if (!service?.upiId) {
      return res.status(400).json({ success: false, error: 'This service is not configured for UPI payments yet' });
    }

    let payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });
    if (payment) {
      payment = await rejectExpiredPayment(payment);
    }

    if (!payment || payment.status !== 'pending') {
      payment = await Payment.create({
        user: booking.user,
        organizer: booking.organizer,
        service: booking.service,
        booking: booking._id,
        orderId: buildPaymentOrderId(),
        amount,
        currency: booking.currency || 'INR',
        upiId: service.upiId,
        status: 'pending',
        expiresAt: new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000),
      });
    }

    booking.paymentProvider = 'upi_qr';
    booking.paymentOrderId = payment.orderId;
    booking.upiIdUsed = service.upiId;
    booking.paymentFailureReason = '';
    if (booking.paymentStatus === 'failed') {
      booking.paymentStatus = 'pending';
    }
    await booking.save();

    res.status(200).json({
      success: true,
      data: createSessionPayload(payment, booking, service),
    });
  } catch (err) {
    next(err);
  }
};

export const submitUpiPayment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('service', 'title');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!ensureUserAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    if (isInactiveBookingStatus(booking.status)) {
      return res.status(400).json({ success: false, error: 'This booking is no longer active' });
    }

    let payment = await Payment.findOne({
      booking: booking._id,
      orderId: req.body.orderId,
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment session not found for this booking' });
    }

    payment = await rejectExpiredPayment(payment);

    if (payment.status === 'confirmed') {
      return res.status(400).json({ success: false, error: 'This payment has already been confirmed' });
    }

    if (payment.status === 'rejected') {
      return res.status(400).json({ success: false, error: payment.rejectionReason || 'This payment request has already been rejected' });
    }

    payment.utr = req.body.utr.trim();
    payment.submittedAt = new Date();
    payment.rejectionReason = '';
    await payment.save();

    booking.paymentProvider = 'upi_qr';
    booking.paymentOrderId = payment.orderId;
    booking.transactionId = payment.utr;
    booking.paymentStatus = 'paid_pending_verification';
    booking.paymentFailureReason = '';
    booking.upiIdUsed = payment.upiId || booking.upiIdUsed || '';
    booking.paidAt = payment.submittedAt;
    await booking.save();

    await createNotification({
      user: booking.organizer.toString(),
      type: 'payment',
      title: 'Payment submitted for review',
      message: `${booking.contactName} submitted UTR ${payment.utr} for booking ${booking.bookingReference}.`,
      link: '/dashboard/seller',
      metadata: {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
        orderId: payment.orderId,
      },
    });

    const [populatedBooking, populatedPayment] = await Promise.all([
      populateBookingById(booking._id.toString()),
      populatePaymentById(payment._id.toString()),
    ]);

    sendPaymentSubmittedAlertEmail({
      sellerEmail: populatedBooking?.organizer?.email || '',
      sellerName: populatedBooking?.organizer?.name || '',
      serviceTitle: populatedBooking?.service?.title || '',
      buyerName: populatedBooking?.user?.name || '',
      bookingReference: booking.bookingReference,
      amount: booking.amount.toString(),
      utr: payment.utr || '',
    }).catch((err) => console.error('[email] Error sending payment submission alert:', err));

    res.status(200).json({
      success: true,
      data: {
        booking: populatedBooking,
        payment: populatedPayment,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getUpiPaymentStatus = async (req: any, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!ensureBookingPaymentAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const query: Record<string, unknown> = { booking: booking._id };
    if (typeof req.query.orderId === 'string' && req.query.orderId.trim()) {
      query.orderId = req.query.orderId.trim();
    }

    let payment = await Payment.findOne(query).sort({ createdAt: -1 });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment session not found' });
    }

    payment = await rejectExpiredPayment(payment);

    const [populatedBooking, populatedPayment] = await Promise.all([
      populateBookingById(booking._id.toString()),
      populatePaymentById(payment._id.toString()),
    ]);

    res.status(200).json({
      success: true,
      data: {
        booking: populatedBooking,
        payment: populatedPayment,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getUpiPaymentReceipt = async (req: any, res: Response, next: NextFunction) => {
  try {
    const payment = await Payment.findOne({ orderId: req.params.orderId })
      .populate([
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
      ]);

    if (!payment || isSmokeTestPayment(payment)) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }

    const booking = payment.booking;
    if (!booking || isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found for this payment' });
    }

    if (!ensureBookingPaymentAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    if (payment.status !== 'confirmed') {
      return res.status(400).json({ success: false, error: 'Receipt is available after payment confirmation' });
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        utr: payment.utr || '',
        status: 'paid',
        createdAt: payment.createdAt,
        paidAt: payment.submittedAt || booking.paidAt || payment.createdAt,
        confirmedAt: payment.reviewedAt || payment.updatedAt,
        booking,
        service: payment.service,
        user: payment.user,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const recordBookingPaymentFailure = async (req: any, res: Response, next: NextFunction) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (isSmokeTestBooking(booking)) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (!ensureUserAccess(booking, req.user)) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const payment = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });

    if (payment && payment.status !== 'confirmed' && req.body.source !== 'razorpay') {
      payment.status = 'rejected';
      payment.rejectionReason = buildFailureReason(req.body);
      payment.reviewedAt = new Date();
      await payment.save();
    }

    if (booking.paymentStatus !== 'verified') {
      booking.paymentStatus = 'failed';
      booking.paymentFailureReason = buildFailureReason(req.body);
      await booking.save();
    }

    const populatedBooking = await populateBookingById(booking._id.toString());

    res.status(200).json({
      success: true,
      data: populatedBooking,
    });
  } catch (err) {
    next(err);
  }
};
