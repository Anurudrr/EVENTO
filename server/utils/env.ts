import dotenv from 'dotenv';

dotenv.config();

const getTrimmedEnv = (key: string) => process.env[key]?.trim();

const getRequiredEnv = (key: string) => {
  const value = getTrimmedEnv(key);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const getOptionalEnv = (key: string) => getTrimmedEnv(key) || '';
const getBooleanEnv = (key: string, fallback = false) => {
  const value = getOptionalEnv(key).toLowerCase();

  if (!value) {
    return fallback;
  }

  if (['1', 'true', 'yes', 'on'].includes(value)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(value)) {
    return false;
  }

  return fallback;
};

const getPositiveNumberEnv = (key: string, fallback: number) => {
  const parsedValue = Number(getOptionalEnv(key));

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};

const ensureNotPlaceholder = (key: string, value: string) => {
  const normalized = value.trim().toLowerCase();
  const placeholders = new Set([
    'your_api_key_here',
    'your_api_secret_here',
    'your_cloud_name_here',
    'changeme',
    'placeholder',
    '1234567890',
  ]);

  if (placeholders.has(normalized)) {
    throw new Error(`Invalid ${key}: placeholder value detected. Update your .env with real Cloudinary credentials.`);
  }

  return value;
};

const isPlaceholderValue = (value: string) => {
  const normalized = value.trim().toLowerCase();

  return new Set([
    '',
    'your_jwt_secret_here',
    'your_otp_secret_here',
    'your_google_oauth_client_id',
    'your_razorpay_key_id',
    'your_razorpay_key_secret',
    'changeme',
    'placeholder',
  ]).has(normalized);
};

export const getJwtSecret = () => getRequiredEnv('JWT_SECRET');
export const getMongoUri = () => getRequiredEnv('MONGO_URI');
export const getGoogleClientId = () => getRequiredEnv('GOOGLE_CLIENT_ID');
export const getJwtExpire = () => getOptionalEnv('JWT_EXPIRE') || '30d';
export const getJwtCookieName = () => getOptionalEnv('JWT_COOKIE_NAME') || 'evento_auth';
export const getNodeEnv = () => getOptionalEnv('NODE_ENV') || 'development';
export const isProductionEnv = () => getNodeEnv() === 'production';
export const isDevelopmentEnv = () => getNodeEnv() === 'development';
export const hasEnvValue = (key: string) => Boolean(getOptionalEnv(key));
export const getServerHost = () => getOptionalEnv('HOST') || '0.0.0.0';
export const getServerPort = () => getPositiveNumberEnv('PORT', 3000);
export const getFallbackPort = () => getPositiveNumberEnv('FALLBACK_PORT', 3001);
export const isDirectRegistrationEnabled = () => getBooleanEnv('ALLOW_DIRECT_REGISTER', false);

export const getCorsOrigins = (): true | string[] => {
  const configuredOrigins = getOptionalEnv('CORS_ORIGIN');

  if (!configuredOrigins) {
    return true;
  }

  const origins = configuredOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : true;
};

export const getRateLimitConfig = () => ({
  windowMs: getPositiveNumberEnv('RATE_LIMIT_WINDOW', 15) * 60 * 1000,
  max: getPositiveNumberEnv('RATE_LIMIT_MAX', 100),
});

export const getEmailTransportConfig = () => {
  const host = getOptionalEnv('SMTP_HOST');
  const user = getOptionalEnv('SMTP_USER');
  const pass = getOptionalEnv('SMTP_PASS');

  if (!host) {
    return null;
  }

  return {
    host,
    port: getPositiveNumberEnv('SMTP_PORT', 587),
    secure: getOptionalEnv('SMTP_SECURE').toLowerCase() === 'true',
    auth: user && pass ? { user, pass } : undefined,
    from: getOptionalEnv('SMTP_FROM') || 'EVENTO <no-reply@evento.local>',
  };
};

export const getOtpDeliveryMode = (): 'email' | 'mock' => {
  const configuredMode = getOptionalEnv('OTP_DELIVERY_MODE').toLowerCase();

  if (configuredMode === 'email') {
    return 'email';
  }

  if (configuredMode === 'mock') {
    return 'mock';
  }

  return getEmailTransportConfig() ? 'email' : 'mock';
};

export const hasRazorpayCredentials = () => {
  const keyId = getOptionalEnv('RAZORPAY_KEY_ID');
  const keySecret = getOptionalEnv('RAZORPAY_KEY_SECRET');

  return !isPlaceholderValue(keyId) && !isPlaceholderValue(keySecret);
};

export const getRazorpayConfig = () => {
  const keyId = getRequiredEnv('RAZORPAY_KEY_ID');
  const keySecret = getRequiredEnv('RAZORPAY_KEY_SECRET');

  if (isPlaceholderValue(keyId) || isPlaceholderValue(keySecret)) {
    throw new Error('Razorpay is not configured. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  return {
    keyId,
    keySecret,
  };
};

export const getCloudinaryConfig = () => {
  const cloudName = ensureNotPlaceholder(
    'CLOUDINARY_CLOUD_NAME',
    getRequiredEnv('CLOUDINARY_CLOUD_NAME'),
  );
  const apiKey = ensureNotPlaceholder(
    'CLOUDINARY_API_KEY',
    getRequiredEnv('CLOUDINARY_API_KEY').replace(/\s+/g, ''),
  );
  const apiSecret = ensureNotPlaceholder(
    'CLOUDINARY_API_SECRET',
    getRequiredEnv('CLOUDINARY_API_SECRET'),
  );

  if (!/^\d+$/.test(apiKey)) {
    throw new Error('Invalid CLOUDINARY_API_KEY: expected a numeric Cloudinary API key.');
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    folder: getOptionalEnv('CLOUDINARY_FOLDER') || 'evento',
  };
};
