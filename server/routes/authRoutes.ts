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
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many verification code requests. Please try again later.' },
});
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many registration attempts. Please try again later.' },
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts. Please try again later.' },
});
const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
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

router.post('/register', registerLimiter, validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/send-otp', otpSendLimiter, validateSendOtp, sendOtp);
router.post('/verify-otp', otpVerifyLimiter, validateVerifyOtp, verifyOtp);
router.post('/google', googleAuthLimiter, validateGoogleAuth, googleAuth);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe);

export default router;
