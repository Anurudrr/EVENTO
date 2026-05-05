import express from 'express';
import rateLimit from 'express-rate-limit';
import { createContactMessage } from '../controllers/contactController.ts';
import { validateContact } from '../middleware/validationMiddleware.ts';

const router = express.Router();
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many contact submissions. Please try again later.' },
});

router.post('/', contactLimiter, validateContact, createContactMessage);

export default router;
