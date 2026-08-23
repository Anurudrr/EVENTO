import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import User from '../models/User.ts';
import { getJwtCookieName, getJwtSecret } from '../utils/env.ts';
import { readCookie } from '../utils/cookies.ts';

interface AuthRequest extends Request {
  user?: any;
}

const resolveTokenFromRequest = (req: AuthRequest) => {
  let token = '';

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1] || '';
  }

  if (!token) {
    token = readCookie(req.headers.cookie, getJwtCookieName());
  }

  return token;
};

const resolveUserFromToken = async (token: string) => {
  const decoded: any = jwt.verify(token, getJwtSecret());
  return User.findById(decoded.id);
};

// Protect routes
export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = resolveTokenFromRequest(req);

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    req.user = await resolveUserFromToken(token);

    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User no longer exists' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

export const protectOptional = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = resolveTokenFromRequest(req);

  if (!token) {
    next();
    return;
  }

  try {
    req.user = await resolveUserFromToken(token);
  } catch (error) {
    req.user = undefined;
  }

  next();
};

// Grant access to specific roles
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

export const requireOrganizer = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !['organizer', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Organizer access required',
    });
  }

  next();
};
