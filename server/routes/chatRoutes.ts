import express from 'express';
import { getBookingMessages, sendBookingMessage } from '../controllers/chatController.ts';
import { protect } from '../middleware/authMiddleware.ts';
import { validateChatMessage } from '../middleware/validationMiddleware.ts';

const router = express.Router();

router.use(protect);

router.get('/bookings/:bookingId/messages', getBookingMessages);
router.post('/bookings/:bookingId/messages', validateChatMessage, sendBookingMessage);

export default router;
