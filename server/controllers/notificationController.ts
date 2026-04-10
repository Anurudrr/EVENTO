import type { Response, NextFunction } from 'express';
import Notification from '../models/Notification.ts';
import { isSmokeTestNotification } from '../utils/smokeArtifacts.ts';

export const getNotifications = async (req: any, res: Response, next: NextFunction) => {
  try {
    const requestedLimit = Number(req.query.limit || 20);
    const limit = Number.isFinite(requestedLimit) ? Math.min(requestedLimit, 50) : 20;
    const expandedLimit = Math.min((limit * 3), 150);

    const [recentNotifications, unreadNotifications] = await Promise.all([
      Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .limit(expandedLimit),
      Notification.find({ user: req.user.id, readAt: null }),
    ]);

    const notifications = recentNotifications
      .filter((notification) => !isSmokeTestNotification(notification))
      .slice(0, limit);
    const unreadCount = unreadNotifications
      .filter((notification) => !isSmokeTestNotification(notification))
      .length;

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req: any, res: Response, next: NextFunction) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    notification.readAt = notification.readAt || new Date();
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req: any, res: Response, next: NextFunction) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, readAt: null },
      { $set: { readAt: new Date() } },
    );

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
