import type { Response } from 'express';
import generateToken from './generateToken.ts';
import { getJwtCookieName, getJwtExpire } from './env.ts';

const parseDurationToMs = (value: string) => {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^(\d+)(ms|s|m|h|d)?$/);

  if (!match) {
    return 30 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2] || 'ms';
  const multiplier = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }[unit];

  return amount * multiplier;
};

export const readCookie = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) {
    return '';
  }

  const cookie = cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) {
    return '';
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
};

export const setAuthCookie = (res: Response, userId: string, role: string) => {
  const token = generateToken(userId, role);
  const cookieName = getJwtCookieName();
  const maxAge = parseDurationToMs(getJwtExpire());

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV?.trim() === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  });

  return token;
};

export const clearAuthCookie = (res: Response) => {
  res.clearCookie(getJwtCookieName(), {
    httpOnly: true,
    secure: process.env.NODE_ENV?.trim() === 'production',
    sameSite: 'lax',
    path: '/',
  });
};
