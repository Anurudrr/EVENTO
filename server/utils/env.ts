const getRequiredEnv = (key: string) => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const getOptionalEnv = (key: string) => process.env[key]?.trim() || '';

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
export const getOtpSecret = () => process.env.OTP_SECRET?.trim() || getJwtSecret();
export const getGoogleClientId = () => getRequiredEnv('GOOGLE_CLIENT_ID');
export const getJwtExpire = () => process.env.JWT_EXPIRE?.trim() || '30d';
export const getJwtCookieName = () => process.env.JWT_COOKIE_NAME?.trim() || 'evento_auth';

export const getEmailTransportConfig = () => {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (!host) {
    return null;
  }

  return {
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: user && pass ? { user, pass } : undefined,
    from: process.env.SMTP_FROM?.trim() || 'EVENTO <no-reply@evento.local>',
  };
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
    folder: process.env.CLOUDINARY_FOLDER?.trim() || 'evento',
  };
};
