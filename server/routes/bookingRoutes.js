import express from 'express';
import {
  bookEvent,
  cancelBooking,
  getMyBookings,
  getOrganizerBookings,
} from '../controllers/bookingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, bookEvent);

router.get('/mybookings', protect, getMyBookings);
router.get('/organizer', protect, authorize('organizer', 'admin'), getOrganizerBookings);

router.delete('/:id', protect, cancelBooking);

export default router;
