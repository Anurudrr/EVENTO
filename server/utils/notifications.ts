import Notification from '../models/Notification.ts';
import { pushNotificationStreamEvent } from './notificationStream.ts';

interface NotificationInput {
  user: string;
  type: 'booking' | 'payment' | 'chat' | 'review' | 'system';
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export const createNotification = async ({
  user,
  type,
  title,
  message,
  link = '',
  metadata = {},
}: NotificationInput) => {
  const notification = await Notification.create({
    user,
    type,
    title,
    message,
    link,
    metadata,
  });

  pushNotificationStreamEvent(user, notification.toObject ? notification.toObject() : notification);

  return notification;
};
