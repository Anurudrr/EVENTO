import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.ts';
import AuthOtp from '../models/AuthOtp.ts';
import { getGoogleClientId, getOtpSecret } from '../utils/env.ts';
import { clearAuthCookie, setAuthCookie } from '../utils/cookies.ts';
import { sendOtpEmail } from '../utils/mailer.ts';

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
const googleClient = new OAuth2Client();

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const logAuth = (scope: string, message: string, details?: Record<string, unknown>) => {
  if (details) {
    console.log(`[auth:${scope}] ${message}`, details);
    return;
  }

  console.log(`[auth:${scope}] ${message}`);
};

const hashOtp = (email: string, purpose: 'signup' | 'login', otp: string) => {
  return crypto
    .createHmac('sha256', getOtpSecret())
    .update(`${normalizeEmail(email)}:${purpose}:${otp}`)
    .digest('hex');
};

const createOtp = () => crypto.randomInt(100000, 1000000).toString();

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

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    // Check for user
    const user: any = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, error: 'Password login is not available for this account' });
    }

    // Check if password matches
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
      purpose: 'signup' | 'login';
      name?: string;
      password?: string;
      role?: 'user' | 'organizer';
    };
    const email = normalizeEmail(rawEmail);
    const publicRole = getPublicRegistrationRole(role);
    const requestId = crypto.randomUUID();

    logAuth('send-otp', 'Request received.', {
      requestId,
      email,
      purpose,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });

    const existingUser = await User.findOne({ email }).select('+password');

    logAuth('send-otp', 'User lookup completed.', {
      requestId,
      userExists: Boolean(existingUser),
    });

    if (purpose === 'signup' && existingUser) {
      logAuth('send-otp', 'Signup blocked because account already exists.', { requestId, email });
      return res.status(400).json({ success: false, error: 'An account with this email already exists' });
    }

    if (purpose === 'login' && !existingUser) {
      logAuth('send-otp', 'Login blocked because account was not found.', { requestId, email });
      return res.status(404).json({ success: false, error: 'No account found for this email' });
    }

    const otp = createOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const pendingPasswordHash = purpose === 'signup' && password
      ? await bcrypt.hash(password, 10)
      : '';

    await AuthOtp.findOneAndUpdate(
      { email, purpose },
      {
        email,
        purpose,
        otpHash: hashOtp(email, purpose, otp),
        expiresAt,
        attempts: 0,
        maxAttempts: 5,
        pendingName: purpose === 'signup' ? name : '',
        pendingPasswordHash,
        pendingRole: publicRole,
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    logAuth('send-otp', 'OTP document upserted.', {
      requestId,
      email,
      expiresAt: expiresAt.toISOString(),
    });

    logAuth('send-otp', 'Sending OTP to dynamic recipient.', {
      requestId,
      recipientEmail: email,
      source: 'req.body.email',
    });

    await sendOtpEmail({
      email,
      otp,
      purpose,
      name: purpose === 'signup' ? name : existingUser?.name,
    });

    logAuth('send-otp', 'OTP email sent successfully.', {
      requestId,
      email,
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: OTP_EXPIRY_MINUTES * 60,
      otpPreview: process.env.NODE_ENV?.trim() === 'production' ? undefined : otp,
    });
  } catch (err) {
    logAuth('send-otp', 'OTP request failed.', {
      error: err instanceof Error ? err.message : 'Unknown error',
    });
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

    const { purpose, otp } = req.body as { purpose: 'signup' | 'login'; otp: string };
    const email = normalizeEmail(rawEmail);

    const otpRecord: any = await AuthOtp.findOne({ email, purpose }).select('+pendingPasswordHash');

    if (!otpRecord || otpRecord.expiresAt.getTime() < Date.now()) {
      if (otpRecord) {
        await otpRecord.deleteOne();
      }

      return res.status(400).json({ success: false, error: 'OTP is invalid or has expired' });
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      await otpRecord.deleteOne();
      return res.status(429).json({ success: false, error: 'Too many invalid attempts. Request a new OTP.' });
    }

    const isValid = otpRecord.otpHash === hashOtp(email, purpose, otp);

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, error: 'OTP is invalid or has expired' });
    }

    let user: any;

    if (purpose === 'signup') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        await otpRecord.deleteOne();
        return res.status(400).json({ success: false, error: 'An account with this email already exists' });
      }

      user = await User.create({
        name: otpRecord.pendingName,
        email,
        password: otpRecord.pendingPasswordHash,
        role: otpRecord.pendingRole,
        emailVerified: true,
        authProvider: 'local',
      });
    } else {
      user = await User.findOne({ email });
      if (!user) {
        await otpRecord.deleteOne();
        return res.status(404).json({ success: false, error: 'No account found for this email' });
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
