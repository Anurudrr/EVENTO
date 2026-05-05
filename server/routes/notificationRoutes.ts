import express from 'express';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  streamNotifications,
} from '../controllers/notificationController.ts';
import { protect } from '../middleware/authMiddleware.ts';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/stream', streamNotifications);
router.put('/read-all', markAllNotificationsRead);
router.put('/:id/read', markNotificationRead);

export default router;
