import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, logout, sendOtp, verifyOtp, googleAuth } from '../controllers/authController.ts';
import { protect } from '../middleware/authMiddleware.ts';
import {
  validateRegister,
  validateLogin,
  validateSendOtp,
  validateVerifyOtp,
  validateGoogleAuth,
} from '../middleware/validationMiddleware.ts';

const router = express.Router();
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many OTP requests. Please try again later.' },
});
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many OTP verification attempts. Please try again later.' },
});
const googleAuthLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many Google sign-in attempts. Please try again later.' },
});

router.use((req, res, next) => {
  console.log(`[auth:route] ${req.method} ${req.originalUrl}`);
  next();
});

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/send-otp', otpSendLimiter, validateSendOtp, sendOtp);
router.post('/verify-otp', otpVerifyLimiter, validateVerifyOtp, verifyOtp);
router.post('/google', googleAuthLimiter, validateGoogleAuth, googleAuth);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe);

export default router;
