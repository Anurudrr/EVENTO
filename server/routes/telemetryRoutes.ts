import express from 'express';
import rateLimit from 'express-rate-limit';
import { createClientTelemetryEvent } from '../controllers/telemetryController.ts';
import { protectOptional } from '../middleware/authMiddleware.ts';
import { validateTelemetryEvent } from '../middleware/validationMiddleware.ts';

const router = express.Router();
const telemetryLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many telemetry events. Please slow down.' },
});

router.post('/events', telemetryLimiter, protectOptional, validateTelemetryEvent, createClientTelemetryEvent);

export default router;
