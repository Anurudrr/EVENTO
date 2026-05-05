import path from 'path';
import crypto from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import nodemailer from 'nodemailer';
import { getEmailTransportConfig, isProductionEnv } from './env.ts';

type OtpEmailPayload = {
  email: string;
  otp: string;
  purpose: 'signup' | 'login';
  name?: string;
};

let transporterPromise: Promise<nodemailer.Transporter> | null = null;
let transporterVerified = false;
const MOCK_OUTBOX_DIR = path.join(process.cwd(), '.dev-mail', 'otp-outbox');
const OTP_EXPIRY_MINUTES = 5;

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const config = getEmailTransportConfig();

      if (!config) {
        throw new Error('SMTP configuration is required to create an email transporter.');
      }

      return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      });
    })();
  }

  const transporter = await transporterPromise;
  const config = getEmailTransportConfig();

  if (!transporterVerified && config) {
    try {
      await transporter.verify();
      transporterVerified = true;
      console.log('[mailer] SMTP transporter verified successfully.');
    } catch (error) {
      console.error('[mailer] SMTP transporter verification failed.', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  return transporter;
};

const writeMockOtpEmail = async ({ email, otp, purpose, name }: OtpEmailPayload) => {
  const subject = purpose === 'signup' ? 'Verify your EVENTO account' : 'Your EVENTO login code';
  const actionLabel = purpose === 'signup' ? 'complete your signup' : 'finish signing in';
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.json`;
  const filePath = path.join(MOCK_OUTBOX_DIR, fileName);

  await mkdir(MOCK_OUTBOX_DIR, { recursive: true });
  await writeFile(filePath, JSON.stringify({
    createdAt: new Date().toISOString(),
    to: email,
    subject,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    text: `Hi ${name || 'there'}, your EVENTO OTP is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:24px;color:#181311;background:#ffffff;border:1px solid #e7dfd7;">
        <p style="font-size:14px;letter-spacing:2px;text-transform:uppercase;color:#b67b45;margin:0 0 16px;">EVENTO Security</p>
        <h1 style="font-size:28px;margin:0 0 12px;">Use this code to ${actionLabel}</h1>
        <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Hi ${name || 'there'}, enter the code below. It expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:12px;padding:20px 24px;background:#f8f4ef;border:1px solid #eadbc9;color:#181311;text-align:center;">
          ${otp}
        </div>
        <p style="font-size:14px;line-height:1.6;margin:24px 0 0;color:#6d635a;">If you did not request this code, you can ignore this email.</p>
      </div>
    `,
  }, null, 2), 'utf8');

  console.log('[mailer] Mock OTP email written to local outbox.', {
    filePath,
  });

  return {
    messageId: `mock-${fileName}`,
    transport: 'mock' as const,
  };
};

export const sendOtpEmail = async ({ email, otp, purpose, name }: OtpEmailPayload) => {
  const config = getEmailTransportConfig();
  const subject = purpose === 'signup' ? 'Verify your EVENTO account' : 'Your EVENTO login code';
  const actionLabel = purpose === 'signup' ? 'complete your signup' : 'finish signing in';

  if (!config) {
    if (isProductionEnv()) {
      throw new Error('SMTP configuration is required to send OTP emails in production.');
    }

    return writeMockOtpEmail({ email, otp, purpose, name });
  }

  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: config?.from || 'EVENTO <no-reply@evento.local>',
    to: email,
    subject,
    text: `Hi ${name || 'there'}, your EVENTO OTP is ${otp}. It expires in 5 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:540px;margin:0 auto;padding:24px;color:#181311;background:#ffffff;border:1px solid #e7dfd7;">
        <p style="font-size:14px;letter-spacing:2px;text-transform:uppercase;color:#b67b45;margin:0 0 16px;">EVENTO Security</p>
        <h1 style="font-size:28px;margin:0 0 12px;">Use this code to ${actionLabel}</h1>
        <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Hi ${name || 'there'}, enter the code below. It expires in 5 minutes.</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:12px;padding:20px 24px;background:#f8f4ef;border:1px solid #eadbc9;color:#181311;text-align:center;">
          ${otp}
        </div>
        <p style="font-size:14px;line-height:1.6;margin:24px 0 0;color:#6d635a;">If you did not request this code, you can ignore this email.</p>
      </div>
    `,
  });

  console.log('[mailer] OTP email dispatched.', {
    to: email,
    messageId: info.messageId,
    transport: 'smtp',
  });

  return {
    messageId: info.messageId,
    transport: 'smtp' as const,
  };
};
