const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);

const normalizeOrigin = (value: string) => {
  try {
    return trimTrailingSlash(new URL(value).origin);
  } catch {
    return '';
  }
};

const isLocalOrigin = (value: string) => {
  try {
    const { hostname } = new URL(value);
    return LOCAL_HOSTNAMES.has(hostname.toLowerCase()) || hostname.toLowerCase().endsWith('.localhost');
  } catch {
    return false;
  }
};

const getSafeApiOrigin = () => {
  const configuredOrigin = typeof import.meta.env.VITE_API_URL === 'string'
    ? trimTrailingSlash(import.meta.env.VITE_API_URL.trim())
    : '';

  if (!configuredOrigin || typeof window === 'undefined') {
    return configuredOrigin;
  }

  const browserOrigin = trimTrailingSlash(window.location.origin);
  const browserIsLocal = isLocalOrigin(browserOrigin);
  const configuredIsLocal = isLocalOrigin(configuredOrigin);

  if (!configuredIsLocal) {
    return configuredOrigin;
  }

  if (!browserIsLocal) {
    return '';
  }

  return normalizeOrigin(configuredOrigin) === browserOrigin ? configuredOrigin : '';
};

export const API_ORIGIN = getSafeApiOrigin();
export const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';
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
