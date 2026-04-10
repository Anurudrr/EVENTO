const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const apiOriginFromEnv = typeof import.meta.env.VITE_API_URL === 'string'
  ? trimTrailingSlash(import.meta.env.VITE_API_URL.trim())
  : '';

const inferredApiOrigin = typeof window !== 'undefined' ? trimTrailingSlash(window.location.origin) : '';

export const API_ORIGIN = apiOriginFromEnv || inferredApiOrigin;
export const API_BASE_URL = `${API_ORIGIN}/api`;
export const buildApiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
export const GOOGLE_CLIENT_ID = typeof import.meta.env.VITE_GOOGLE_CLIENT_ID === 'string'
  ? import.meta.env.VITE_GOOGLE_CLIENT_ID.trim()
  : '';
export const RAZORPAY_KEY_ID = typeof import.meta.env.VITE_RAZORPAY_KEY === 'string'
  ? import.meta.env.VITE_RAZORPAY_KEY.trim()
  : '';

export const logMissingEnv = (key: string) => {
  console.error(`[env] Missing required client env: ${key}`);
};
