import crypto from 'crypto';
import Razorpay from 'razorpay';
import { getRazorpayConfig } from './env.ts';

let razorpayClient: Razorpay | null = null;

export const getRazorpayClient = () => {
  if (!razorpayClient) {
    const { keyId, keySecret } = getRazorpayConfig();

    razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayClient;
};

export const verifyRazorpaySignature = (orderId: string, paymentId: string, signature: string) => {
  const { keySecret } = getRazorpayConfig();
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
};
