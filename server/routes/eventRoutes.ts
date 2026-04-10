import express from 'express';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.ts';
import { protect, authorize } from '../middleware/authMiddleware.ts';
import { validateEvent } from '../middleware/validationMiddleware.ts';

const router = express.Router();

router.route('/').get(getEvents).post(protect, authorize('organizer', 'admin'), validateEvent, createEvent);

router
  .route('/:id')
  .get(getEvent)
  .put(protect, authorize('organizer', 'admin'), validateEvent, updateEvent)
  .delete(protect, authorize('organizer', 'admin'), deleteEvent);

export default router;
