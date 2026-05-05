import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import {
  createPlannerRequest,
  getMyPlannerRequests,
  getOrganizerPlannerLeads,
} from '../controllers/plannerController.ts';
import { protect, protectOptional, requireOrganizer } from '../middleware/authMiddleware.ts';
import { validatePlannerRequest } from '../middleware/validationMiddleware.ts';
import { checkImageFile } from '../utils/upload.ts';

const router = express.Router();
const plannerRequestLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many planner requests. Please try again later.' },
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 4,
  },
  fileFilter(req, file, cb) {
    checkImageFile(file, cb);
  },
});

router.post('/requests', plannerRequestLimiter, protectOptional, upload.array('attachments', 4), validatePlannerRequest, createPlannerRequest);
router.get('/requests/my', protect, getMyPlannerRequests);
router.get('/requests/organizer', protect, requireOrganizer, getOrganizerPlannerLeads);

export default router;
