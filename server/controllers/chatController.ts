import type { Response, NextFunction } from 'express';
import Booking from '../models/Booking.ts';
import ChatMessage from '../models/ChatMessage.ts';
import { createNotification } from '../utils/notifications.ts';
import { isSmokeTestBooking } from '../utils/smokeArtifacts.ts';

const userSelect = 'name email role profilePicture';

const getAuthorizedBooking = async (bookingId: string, user: any) => {
  const booking = await Booking.findById(bookingId).populate('service', 'title organizer');

  if (!booking) {
    return { booking: null, error: 'Booking not found', status: 404 };
  }

  if (isSmokeTestBooking(booking)) {
    return { booking: null, error: 'Booking not found', status: 404 };
  }

  const allowed = [
    booking.user.toString(),
    booking.organizer.toString(),
  ];

  if (!allowed.includes(user.id) && user.role !== 'admin') {
    return { booking: null, error: 'Not authorized to access this chat', status: 403 };
  }

  return { booking, error: null, status: 200 };
};

export const getBookingMessages = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { booking, error, status } = await getAuthorizedBooking(req.params.bookingId, req.user);

    if (!booking) {
      return res.status(status).json({ success: false, error });
    }

    await ChatMessage.updateMany(
      {
        booking: booking._id,
        recipient: req.user.id,
        readAt: null,
      },
      { $set: { readAt: new Date() } },
    );

    const messages = await ChatMessage.find({ booking: booking._id })
      .populate('sender', userSelect)
      .populate('recipient', userSelect)
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (err) {
    next(err);
  }
};

export const sendBookingMessage = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { booking, error, status } = await getAuthorizedBooking(req.params.bookingId, req.user);

    if (!booking) {
      return res.status(status).json({ success: false, error });
    }

    const recipientId = booking.user.toString() === req.user.id
      ? booking.organizer.toString()
      : booking.user.toString();

    const message = await ChatMessage.create({
      booking: booking._id,
      service: (booking.service as any)?._id || booking.service,
      sender: req.user.id,
      recipient: recipientId,
      text: req.body.text.trim(),
    });

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender', userSelect)
      .populate('recipient', userSelect);

    await createNotification({
      user: recipientId,
      type: 'chat',
      title: 'New message',
      message: `${req.user.name} sent you a new message about ${(booking.service as any)?.title || 'a booking'}.`,
      link: req.user.role === 'organizer' ? '/dashboard/buyer' : '/dashboard/seller',
      metadata: {
        bookingId: booking._id.toString(),
        messageId: message._id.toString(),
      },
    });

    res.status(201).json({
      success: true,
      data: populatedMessage,
    });
  } catch (err) {
    next(err);
  }
};
