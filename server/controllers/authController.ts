import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.ts';
import AuthOtp from '../models/AuthOtp.ts';
import {
  getEmailTransportConfig,
  getGoogleClientId,
  isDirectRegistrationEnabled,
  isProductionEnv,
} from '../utils/env.ts';
import { clearAuthCookie, setAuthCookie } from '../utils/cookies.ts';
import { sendOtpEmail } from '../utils/mailer.ts';

type OtpPurpose = 'signup' | 'login';

const buildAuthPayload = (user: any) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profilePicture: user.profilePicture || '',
  bio: user.bio || '',
  upiId: user.upiId || '',
  emailVerified: Boolean(user.emailVerified),
  authProvider: user.authProvider || 'local',
  createdAt: user.createdAt,
});

const getPublicRegistrationRole = (role: unknown) => (
  role === 'organizer' ? 'organizer' : 'user'
);

const OTP_EXPIRY_MINUTES = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 3;
const OTP_BCRYPT_ROUNDS = 10;
const GENERIC_OTP_SEND_MESSAGE = 'If the details are valid, a verification code has been sent.';
const GENERIC_OTP_INVALID_MESSAGE = 'The verification code is invalid or has expired.';
const GENERIC_OTP_LOCKED_MESSAGE = 'Too many invalid attempts. Request a new verification code.';
const googleClient = new OAuth2Client();

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const createOtp = () => crypto.randomInt(100000, 1000000).toString();
const getOtpExpiryDate = () => new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
const buildOtpResponse = (message = GENERIC_OTP_SEND_MESSAGE) => ({
  success: true,
  message,
  expiresIn: OTP_EXPIRY_MINUTES * 60,
  cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
});
const getOtpDeliveryMessage = () => {
  if (getEmailTransportConfig()) {
    return GENERIC_OTP_SEND_MESSAGE;
  }

  return isProductionEnv()
    ? GENERIC_OTP_SEND_MESSAGE
    : `${GENERIC_OTP_SEND_MESSAGE} In local development without SMTP, check .dev-mail/otp-outbox/.`;
};

const getCooldownSecondsRemaining = (lastSentAt: Date | null | undefined) => {
  if (!lastSentAt) {
    return 0;
  }

  const retryAt = lastSentAt.getTime() + (OTP_RESEND_COOLDOWN_SECONDS * 1000);
  const remainingMs = retryAt - Date.now();

  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
};

const isOtpRequestEligible = (purpose: OtpPurpose, existingUser: any) => (
  purpose === 'signup' ? !existingUser : Boolean(existingUser)
);

const respondWithAuth = (res: Response, user: any, status = 200) => {
  const token = setAuthCookie(res, user._id.toString(), user.role);

  res.status(status).json({
    success: true,
    token,
    user: buildAuthPayload(user),
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isDirectRegistrationEnabled()) {
      return res.status(403).json({
        success: false,
        error: 'Direct registration is disabled. Use the OTP signup flow to create an account.',
      });
    }

    const { name, password, role } = req.body;
    const email = normalizeEmail(req.body.email);
    const publicRole = getPublicRegistrationRole(role);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: publicRole,
      emailVerified: true,
      authProvider: 'local',
    });

    respondWithAuth(res, user, 201);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const password = req.body.password;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    const user: any = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, error: 'Password login is not available for this account' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    respondWithAuth(res, user);
  } catch (err) {
    next(err);
  }
};

// @desc    Send signup/login OTP
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawEmail = typeof req.body.email === 'string' ? req.body.email : '';

    if (!rawEmail.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const { purpose, name, password, role } = req.body as {
      purpose: OtpPurpose;
      name?: string;
      password?: string;
      role?: 'user' | 'organizer';
    };
    const email = normalizeEmail(rawEmail);
    const publicRole = getPublicRegistrationRole(role);
    const existingUser = await User.findOne({ email }).select('name');
    const existingOtpRecord: any = await AuthOtp.findOne({ email, purpose });
    const cooldownSeconds = getCooldownSecondsRemaining(existingOtpRecord?.lastSentAt);

    if (cooldownSeconds > 0) {
      return res.status(429).json({
        success: false,
        error: 'Please wait before requesting another verification code.',
        cooldownSeconds,
      });
    }

    const otp = createOtp();
    const otpHash = await bcrypt.hash(otp, OTP_BCRYPT_ROUNDS);
    const expiresAt = getOtpExpiryDate();
    const isEligibleRequest = isOtpRequestEligible(purpose, existingUser);
    const pendingPasswordHash = purpose === 'signup' && isEligibleRequest && password
      ? await bcrypt.hash(password, 10)
      : '';

    await AuthOtp.findOneAndUpdate(
      { email, purpose },
      {
        userId: purpose === 'login' ? existingUser?._id || null : null,
        email,
        purpose,
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
        pendingName: purpose === 'signup' && isEligibleRequest ? (name || '') : '',
        pendingPasswordHash,
        pendingRole: publicRole,
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      },
    );

    if (isEligibleRequest) {
      await sendOtpEmail({
        email,
        otp,
        purpose,
        name: purpose === 'signup' ? name : existingUser?.name,
      });
    }

    res.status(200).json(buildOtpResponse(getOtpDeliveryMessage()));
  } catch (err) {
    next(err);
  }
};

// @desc    Verify signup/login OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawEmail = typeof req.body.email === 'string' ? req.body.email : '';

    if (!rawEmail.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const { purpose, otp } = req.body as { purpose: OtpPurpose; otp: string };
    const email = normalizeEmail(rawEmail);
    const otpRecord: any = await AuthOtp.findOne({ email, purpose }).select('+otpHash +pendingPasswordHash');

    if (!otpRecord || otpRecord.expiresAt.getTime() <= Date.now()) {
      if (otpRecord) {
        await otpRecord.deleteOne();
      }

      return res.status(400).json({ success: false, error: GENERIC_OTP_INVALID_MESSAGE });
    }

    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      await otpRecord.deleteOne();
      return res.status(429).json({ success: false, error: GENERIC_OTP_LOCKED_MESSAGE });
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
        await otpRecord.deleteOne();
        return res.status(429).json({ success: false, error: GENERIC_OTP_LOCKED_MESSAGE });
      }

      return res.status(400).json({ success: false, error: GENERIC_OTP_INVALID_MESSAGE });
    }

    let user: any;

    if (purpose === 'signup') {
      const existingUser = await User.findOne({ email });

      if (existingUser || !otpRecord.pendingPasswordHash) {
        await otpRecord.deleteOne();
        return res.status(400).json({ success: false, error: GENERIC_OTP_INVALID_MESSAGE });
      }

      user = await User.create({
        name: otpRecord.pendingName || email.split('@')[0],
        email,
        password: otpRecord.pendingPasswordHash,
        role: otpRecord.pendingRole,
        emailVerified: true,
        authProvider: 'local',
      });
    } else {
      user = otpRecord.userId
        ? await User.findById(otpRecord.userId)
        : await User.findOne({ email });

      if (!user) {
        await otpRecord.deleteOne();
        return res.status(400).json({ success: false, error: GENERIC_OTP_INVALID_MESSAGE });
      }
    }

    await otpRecord.deleteOne();
    respondWithAuth(res, user, purpose === 'signup' ? 201 : 200);
  } catch (err) {
    next(err);
  }
};

// @desc    Login or signup with Google
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idToken, role } = req.body as { idToken: string; role?: 'user' | 'organizer' };
    const publicRole = getPublicRegistrationRole(role);

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: getGoogleClientId(),
    });
    const payload = ticket.getPayload();

    if (!payload?.email || !payload.sub || !payload.email_verified) {
      return res.status(401).json({ success: false, error: 'Unable to verify Google account' });
    }

    const email = normalizeEmail(payload.email);
    let user: any = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: payload.name || email.split('@')[0],
        email,
        role: publicRole,
        profilePicture: payload.picture || '',
        googleId: payload.sub,
        authProvider: 'google',
        emailVerified: true,
      });
    } else {
      let shouldSave = false;

      if (!user.googleId) {
        user.googleId = payload.sub;
        shouldSave = true;
      }

      if (!user.profilePicture && payload.picture) {
        user.profilePicture = payload.picture;
        shouldSave = true;
      }

      if (!user.emailVerified) {
        user.emailVerified = true;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    }

    respondWithAuth(res, user);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: buildAuthPayload(user),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    clearAuthCookie(res);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};
