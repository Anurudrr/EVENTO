import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  getCloudinaryConfig,
  getCorsOrigins,
  hasRazorpayCredentials,
  isDirectRegistrationEnabled,
} from '../../../server/utils/env.ts';

const ORIGINAL_ENV = { ...process.env };

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (typeof value === 'undefined') {
      delete process.env[key];
      continue;
    }

    process.env[key] = value;
  }
};

afterEach(() => {
  restoreEnv();
});

describe('env utils', () => {
  it('parses ALLOW_DIRECT_REGISTER as a boolean flag', () => {
    process.env.ALLOW_DIRECT_REGISTER = 'true';
    assert.equal(isDirectRegistrationEnabled(), true);

    process.env.ALLOW_DIRECT_REGISTER = 'off';
    assert.equal(isDirectRegistrationEnabled(), false);

    process.env.ALLOW_DIRECT_REGISTER = 'unexpected';
    assert.equal(isDirectRegistrationEnabled(), false);
  });

  it('splits comma-separated CORS origins', () => {
    process.env.CORS_ORIGIN = 'https://a.example, https://b.example ';
    assert.deepEqual(getCorsOrigins(), ['https://a.example', 'https://b.example']);

    delete process.env.CORS_ORIGIN;
    assert.equal(getCorsOrigins(), true);
  });

  it('treats placeholder Razorpay values as unconfigured', () => {
    process.env.RAZORPAY_KEY_ID = 'your_razorpay_key_id';
    process.env.RAZORPAY_KEY_SECRET = 'your_razorpay_key_secret';
    assert.equal(hasRazorpayCredentials(), false);

    process.env.RAZORPAY_KEY_ID = 'rzp_live_abc';
    process.env.RAZORPAY_KEY_SECRET = 'secret_123';
    assert.equal(hasRazorpayCredentials(), true);
  });

  it('rejects non-numeric Cloudinary API keys', () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo-cloud';
    process.env.CLOUDINARY_API_KEY = 'not-numeric';
    process.env.CLOUDINARY_API_SECRET = 'secret';

    assert.throws(() => getCloudinaryConfig(), /expected a numeric Cloudinary API key/);
  });
});
