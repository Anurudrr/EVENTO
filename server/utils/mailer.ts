import nodemailer from 'nodemailer';
import { getEmailTransportConfig } from './env.ts';

type OtpEmailPayload = {
  email: string;
  otp: string;
  purpose: 'signup' | 'login';
  name?: string;
};

let transporterPromise: Promise<nodemailer.Transporter> | null = null;
let transporterVerified = false;

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const config = getEmailTransportConfig();

      if (!config) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('SMTP configuration is required to send OTP emails in production.');
        }

        return nodemailer.createTransport({ jsonTransport: true });
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
      console.error('[mailer] SMTP transporter verification failed.', error);
      throw error;
    }
  }

  return transporter;
};

export const sendOtpEmail = async ({ email, otp, purpose, name }: OtpEmailPayload) => {
  const config = getEmailTransportConfig();
  const transporter = await getTransporter();
  const subject = purpose === 'signup' ? 'Verify your EVENTO account' : 'Your EVENTO login code';
  const actionLabel = purpose === 'signup' ? 'complete your signup' : 'finish signing in';

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
    response: info.response,
  });
};
