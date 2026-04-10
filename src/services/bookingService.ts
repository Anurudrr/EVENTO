import api from './api';
import { Booking, BookingStatus, PaymentReceipt, PaymentRecord, PaymentSession } from '../types';
import { normalizeBooking, normalizePayment, normalizePaymentReceipt } from './normalizers';

const getRequiredData = <T>(value: T | null | undefined, message: string): T => {
  if (value == null) {
    throw new Error(message);
  }

  return value;
};

export const bookingService = {
  createBooking: async (bookingData: {
    serviceId: string;
    date: string;
    time: string;
    contactName: string;
    phone: string;
    eventType: string;
    eventLocation?: string;
    guests: number;
    notes?: string;
  }) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return normalizeBooking(getRequiredData(response?.data?.data, 'Booking response is missing data'));
    } catch (error) {
      console.error('[booking:create]', error);
      throw error;
    }
  },

  getMyBookings: async () => {
    try {
      const response = await api.get('/bookings/user');
      return (response?.data?.data || []).map(normalizeBooking);
    } catch (error) {
      console.error('[booking:get-user]', error);
      throw error;
    }
  },

  getOrganizerBookings: async () => {
    try {
      const response = await api.get('/bookings/organizer');
      return (response?.data?.data || []).map(normalizeBooking);
    } catch (error) {
      console.error('[booking:get-organizer]', error);
      throw error;
    }
  },

  cancelBooking: async (id: string) => {
    try {
      const response = await api.put(`/bookings/${id}/cancel`);
      return normalizeBooking(getRequiredData(response?.data?.data, 'Cancel booking response is missing data'));
    } catch (error) {
      console.error('[booking:cancel]', error);
      throw error;
    }
  },

  markAsPaid: async (id: string, payload: { transactionId?: string; screenshot?: File | null }) => {
    try {
      const formData = new FormData();
      if (payload.transactionId) {
        formData.append('transactionId', payload.transactionId);
      }
      if (payload.screenshot) {
        formData.append('screenshot', payload.screenshot);
      }

      const response = await api.put(`/bookings/${id}/pay`, formData);
      return normalizeBooking(getRequiredData(response?.data?.data, 'Mark as paid response is missing data'));
    } catch (error) {
      console.error('[booking:markAsPaid]', error);
      throw error;
    }
  },

  verifyPayment: async (id: string) => {
    try {
      const response = await api.put(`/bookings/${id}/verify`);
      return normalizeBooking(getRequiredData(response?.data?.data, 'Verify payment response is missing data'));
    } catch (error) {
      console.error('[booking:verifyPayment]', error);
      throw error;
    }
  },

  updateStatus: async (id: string, status: Exclude<BookingStatus, 'pending' | 'cancelled'>) => {
    try {
      const response = await api.put(`/bookings/${id}/status`, { status });
      return normalizeBooking(getRequiredData(response?.data?.data, 'Update booking status response is missing data'));
    } catch (error) {
      console.error('[booking:updateStatus]', error);
      throw error;
    }
  },

  createUpiPaymentSession: async (id: string) => {
    try {
      const payload = getRequiredData(
        (await api.post(`/bookings/${id}/payment/order`))?.data?.data,
        'Create payment session response is missing data',
      );

      return {
        bookingId: payload.bookingId,
        bookingReference: payload.bookingReference,
        orderId: payload.orderId,
        amount: Number(payload.amount ?? 0),
        currency: payload.currency || 'INR',
        upiId: payload.upiId || '',
        upiLink: payload.upiLink || '',
        payeeName: payload.payeeName || 'Evento',
        expiresAt: payload.expiresAt,
        submittedAt: payload.submittedAt,
        status: payload.status || 'pending',
        rejectionReason: payload.rejectionReason || '',
        serviceTitle: payload.serviceTitle || 'EVENTO booking',
        payment: payload.payment ? normalizePayment(payload.payment) : undefined,
      } as PaymentSession;
    } catch (error) {
      console.error('[booking:createUpiPaymentSession]', error);
      throw error;
    }
  },

  submitUpiPayment: async (
    id: string,
    payload: {
      orderId: string;
      utr: string;
    },
  ) => {
    try {
      const response = getRequiredData(
        (await api.post(`/bookings/${id}/payment/submit`, payload))?.data?.data,
        'Submit UPI payment response is missing data',
      );

      return {
        booking: normalizeBooking(getRequiredData(response.booking, 'Submit UPI payment response is missing booking data')),
        payment: normalizePayment(getRequiredData(response.payment, 'Submit UPI payment response is missing payment data')),
      } as {
        booking: Booking;
        payment: PaymentRecord;
      };
    } catch (error) {
      console.error('[booking:submitUpiPayment]', error);
      throw error;
    }
  },

  getUpiPaymentStatus: async (id: string, orderId?: string) => {
    try {
      const response = getRequiredData(
        (await api.get(`/bookings/${id}/payment/status`, { params: orderId ? { orderId } : undefined }))?.data?.data,
        'Payment status response is missing data',
      );

      return {
        booking: normalizeBooking(getRequiredData(response.booking, 'Payment status response is missing booking data')),
        payment: normalizePayment(getRequiredData(response.payment, 'Payment status response is missing payment data')),
      } as {
        booking: Booking;
        payment: PaymentRecord;
      };
    } catch (error) {
      console.error('[booking:getUpiPaymentStatus]', error);
      throw error;
    }
  },

  getPaymentReceipt: async (orderId: string) => {
    try {
      const response = await api.get(`/bookings/payment/receipt/${orderId}`);
      return normalizePaymentReceipt(getRequiredData(response?.data?.data, 'Payment receipt response is missing data')) as PaymentReceipt;
    } catch (error) {
      console.error('[booking:getPaymentReceipt]', error);
      throw error;
    }
  },

  recordPaymentFailure: async (
    id: string,
    payload: {
      code?: string;
      description?: string;
      source?: string;
      step?: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    },
  ) => {
    try {
      const response = await api.post(`/bookings/${id}/payment/failure`, payload);
      return normalizeBooking(getRequiredData(response?.data?.data, 'Payment failure response is missing data'));
    } catch (error) {
      console.error('[booking:recordPaymentFailure]', error);
      throw error;
    }
  },
};
