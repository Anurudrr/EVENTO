import Notification from '../models/Notification.ts';

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
  return Notification.create({
    user,
    type,
    title,
    message,
    link,
    metadata,
  });
};
