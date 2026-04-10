import express from 'express';
import {
  getServiceReviews,
  createServiceReview,
  deleteServiceReview,
} from '../controllers/reviewController.ts';
import { protect } from '../middleware/authMiddleware.ts';
import { validateReview } from '../middleware/validationMiddleware.ts';

const router = express.Router();

router.route('/:serviceId').get(getServiceReviews).post(protect, validateReview, createServiceReview);
router.route('/:id').delete(protect, deleteServiceReview);

export default router;
