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

// ─── Shared email helpers ──────────────────────────────────────────────────

const brandHeader = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:0;color:#181311;background:#ffffff;border:1px solid #e7dfd7;">
    <div style="background:#181311;padding:20px 24px;">
      <p style="font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#c6a35b;margin:0;font-weight:700;">EVENTO</p>
    </div>
    <div style="padding:28px 24px 0;">
`;

const brandFooter = `
    </div>
    <div style="padding:20px 24px;border-top:1px solid #e7dfd7;margin-top:24px;">
      <p style="font-size:11px;color:#9d9189;margin:0;line-height:1.6;">
        This is an automated message from EVENTO. Please do not reply directly to this email.
        If you have questions, contact your organizer or buyer via the platform.
      </p>
    </div>
  </div>
`;

const sendTransactionalEmail = async ({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) => {
  const config = getEmailTransportConfig();

  if (!config) {
    if (isProductionEnv()) {
      throw new Error('SMTP configuration is required to send transactional emails in production.');
    }

    // In development, write to mock outbox
    const path = await import('path');
    const { mkdir, writeFile } = await import('fs/promises');
    const crypto = await import('crypto');
    const outboxDir = path.default.join(process.cwd(), '.dev-mail', 'transactional');
    const fileName = `${Date.now()}-${crypto.default.randomBytes(6).toString('hex')}.json`;

    await mkdir(outboxDir, { recursive: true });
    await writeFile(
      path.default.join(outboxDir, fileName),
      JSON.stringify({ to, subject, text, createdAt: new Date().toISOString() }, null, 2),
      'utf8',
    );

    console.log('[mailer] Mock transactional email written.', { to, subject });
    return { messageId: `mock-${fileName}`, transport: 'mock' as const };
  }

  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: config.from || 'EVENTO <no-reply@evento.local>',
    to,
    subject,
    text,
    html,
  });

  console.log('[mailer] Transactional email sent.', { to, subject, messageId: info.messageId });
  return { messageId: info.messageId, transport: 'smtp' as const };
};

// ─── Booking confirmation (buyer) ──────────────────────────────────────────

export const sendBookingConfirmationEmail = async (payload: {
  buyerEmail: string;
  buyerName: string;
  serviceTitle: string;
  bookingReference: string;
  date: string;
  time: string;
  amount: string;
  eventType: string;
}) => {
  const { buyerEmail, buyerName, serviceTitle, bookingReference, date, time, amount, eventType } = payload;

  return sendTransactionalEmail({
    to: buyerEmail,
    subject: `Booking confirmed — ${serviceTitle}`,
    text: `Hi ${buyerName}, your booking for ${serviceTitle} (${bookingReference}) on ${date} at ${time} has been created. Amount: ${amount}. Event type: ${eventType}.`,
    html: `${brandHeader}
      <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c6a35b;margin:0 0 12px;">Booking Created</p>
      <h1 style="font-size:26px;margin:0 0 16px;line-height:1.2;">Your booking is confirmed</h1>
      <p style="font-size:14px;line-height:1.7;margin:0 0 24px;">Hi ${buyerName}, your booking has been created and sent to the organizer. Here are the details:</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Service</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-weight:600;">${serviceTitle}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Reference</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-family:monospace;font-weight:600;">${bookingReference}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Date &amp; Time</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-weight:600;">${date} at ${time}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Event Type</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-weight:600;">${eventType}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Amount Due</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:15px;font-weight:700;color:#181311;">${amount}</td></tr>
      </table>
      <p style="font-size:13px;line-height:1.7;color:#6d635a;">The organizer will review your request. Once confirmed, you can complete payment via your buyer dashboard.</p>
    ${brandFooter}`,
  });
};

// ─── New booking alert (seller) ────────────────────────────────────────────

export const sendNewBookingAlertEmail = async (payload: {
  sellerEmail: string;
  sellerName: string;
  serviceTitle: string;
  buyerName: string;
  bookingReference: string;
  date: string;
  time: string;
  amount: string;
  eventType: string;
  guests: number;
}) => {
  const { sellerEmail, sellerName, serviceTitle, buyerName, bookingReference, date, time, amount, eventType, guests } = payload;

  return sendTransactionalEmail({
    to: sellerEmail,
    subject: `New booking request — ${serviceTitle}`,
    text: `Hi ${sellerName}, ${buyerName} has requested a booking for ${serviceTitle} (${bookingReference}) on ${date} at ${time}. Guests: ${guests}. Amount: ${amount}. Visit your seller dashboard to confirm or reject.`,
    html: `${brandHeader}
      <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c6a35b;margin:0 0 12px;">New Booking Request</p>
      <h1 style="font-size:26px;margin:0 0 16px;line-height:1.2;">You have a new booking request</h1>
      <p style="font-size:14px;line-height:1.7;margin:0 0 24px;">Hi ${sellerName}, <strong>${buyerName}</strong> has requested your service. Review it from your seller dashboard.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Service</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-weight:600;">${serviceTitle}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Reference</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-family:monospace;font-weight:600;">${bookingReference}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Buyer</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-weight:600;">${buyerName}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Date &amp; Time</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-weight:600;">${date} at ${time}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Event Type</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-weight:600;">${eventType}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Guests</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-weight:600;">${guests}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Amount</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:15px;font-weight:700;color:#181311;">${amount}</td></tr>
      </table>
    ${brandFooter}`,
  });
};

// ─── Payment submitted alert (seller) ─────────────────────────────────────

export const sendPaymentSubmittedAlertEmail = async (payload: {
  sellerEmail: string;
  sellerName: string;
  serviceTitle: string;
  buyerName: string;
  bookingReference: string;
  amount: string;
  utr: string;
}) => {
  const { sellerEmail, sellerName, serviceTitle, buyerName, bookingReference, amount, utr } = payload;

  return sendTransactionalEmail({
    to: sellerEmail,
    subject: `Payment submitted for verification — ${serviceTitle}`,
    text: `Hi ${sellerName}, ${buyerName} has submitted payment (UTR: ${utr}) for ${serviceTitle} (${bookingReference}). Amount: ${amount}. Visit your seller dashboard to verify or reject.`,
    html: `${brandHeader}
      <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#c6a35b;margin:0 0 12px;">Payment Submitted</p>
      <h1 style="font-size:26px;margin:0 0 16px;line-height:1.2;">A buyer has submitted payment</h1>
      <p style="font-size:14px;line-height:1.7;margin:0 0 24px;">Hi ${sellerName}, <strong>${buyerName}</strong> has submitted a UPI payment for your service. Please verify it from your seller dashboard.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Service</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-weight:600;">${serviceTitle}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Reference</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-family:monospace;font-weight:600;">${bookingReference}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">UTR / Transaction ID</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-family:monospace;font-weight:600;">${utr}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Amount</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:15px;font-weight:700;color:#181311;">${amount}</td></tr>
      </table>
    ${brandFooter}`,
  });
};

// ─── Payment verified (buyer) ──────────────────────────────────────────────

export const sendPaymentVerifiedEmail = async (payload: {
  buyerEmail: string;
  buyerName: string;
  serviceTitle: string;
  bookingReference: string;
  amount: string;
}) => {
  const { buyerEmail, buyerName, serviceTitle, bookingReference, amount } = payload;

  return sendTransactionalEmail({
    to: buyerEmail,
    subject: `Payment confirmed — ${serviceTitle}`,
    text: `Hi ${buyerName}, your payment of ${amount} for ${serviceTitle} (${bookingReference}) has been verified by the organizer. Your booking is confirmed.`,
    html: `${brandHeader}
      <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#27a85b;margin:0 0 12px;">Payment Confirmed</p>
      <h1 style="font-size:26px;margin:0 0 16px;line-height:1.2;">Your payment has been verified</h1>
      <p style="font-size:14px;line-height:1.7;margin:0 0 24px;">Hi ${buyerName}, great news! The organizer has verified your payment and your booking is now confirmed.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Service</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-weight:600;">${serviceTitle}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Reference</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-family:monospace;font-weight:600;">${bookingReference}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Amount Paid</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:15px;font-weight:700;color:#27a85b;">${amount}</td></tr>
      </table>
      <p style="font-size:13px;line-height:1.7;color:#6d635a;">View your booking details and receipt from your buyer dashboard.</p>
    ${brandFooter}`,
  });
};

// ─── Payment rejected (buyer) ──────────────────────────────────────────────

export const sendPaymentRejectedEmail = async (payload: {
  buyerEmail: string;
  buyerName: string;
  serviceTitle: string;
  bookingReference: string;
  reason: string;
}) => {
  const { buyerEmail, buyerName, serviceTitle, bookingReference, reason } = payload;

  return sendTransactionalEmail({
    to: buyerEmail,
    subject: `Payment not verified — ${serviceTitle}`,
    text: `Hi ${buyerName}, unfortunately the organizer could not verify your payment for ${serviceTitle} (${bookingReference}). Reason: ${reason}. Please retry payment from your buyer dashboard.`,
    html: `${brandHeader}
      <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#d95050;margin:0 0 12px;">Payment Not Verified</p>
      <h1 style="font-size:26px;margin:0 0 16px;line-height:1.2;">Payment could not be verified</h1>
      <p style="font-size:14px;line-height:1.7;margin:0 0 24px;">Hi ${buyerName}, unfortunately the organizer was unable to verify your payment for <strong>${serviceTitle}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Service</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-weight:600;">${serviceTitle}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Reference</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;font-family:monospace;font-weight:600;">${bookingReference}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#9d9189;font-weight:700;">Reason</td><td style="padding:10px 12px;border:1px solid #e7dfd7;font-size:13px;color:#d95050;font-weight:600;">${reason || 'Not specified by organizer'}</td></tr>
      </table>
      <p style="font-size:13px;line-height:1.7;color:#6d635a;">You can retry payment from your buyer dashboard. If you believe this is an error, contact the organizer directly.</p>
    ${brandFooter}`,
  });
};
