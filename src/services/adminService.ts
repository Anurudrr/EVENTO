import api from './api';
import { AdminOverview, Booking, PaymentRecord } from '../types';
import { normalizeAdminOverview, normalizeBooking, normalizePayment } from './normalizers';

export const adminService = {
  getOverview: async () => {
    try {
      const response = await api.get('/admin/overview');
      return normalizeAdminOverview(response?.data?.data) as AdminOverview;
    } catch (error) {
      console.error('[admin:get-overview]', error);
      throw error;
    }
  },

  deleteService: async (serviceId: string) => {
    try {
      await api.delete(`/admin/services/${serviceId}`);
    } catch (error) {
      console.error('[admin:delete-service]', error);
      throw error;
    }
  },

  approvePayment: async (paymentId: string) => {
    try {
      const payload = (await api.put(`/admin/payments/${paymentId}/approve`))?.data?.data;
      return {
        payment: payload?.payment ? normalizePayment(payload.payment) : undefined,
        booking: payload?.booking ? normalizeBooking(payload.booking) : undefined,
      } as {
        payment?: PaymentRecord;
        booking?: Booking;
      };
    } catch (error) {
      console.error('[admin:approve-payment]', error);
      throw error;
    }
  },

  rejectPayment: async (paymentId: string, reason?: string) => {
    try {
      const payload = (await api.put(`/admin/payments/${paymentId}/reject`, { reason }))?.data?.data;
      return {
        payment: payload?.payment ? normalizePayment(payload.payment) : undefined,
        booking: payload?.booking ? normalizeBooking(payload.booking) : undefined,
      } as {
        payment?: PaymentRecord;
        booking?: Booking;
      };
    } catch (error) {
      console.error('[admin:reject-payment]', error);
      throw error;
    }
  },
};
