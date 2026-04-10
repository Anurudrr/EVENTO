import api from './api';
import { Review } from '../types';
import { normalizeReview } from './normalizers';

export const reviewService = {
  createReview: async (serviceId: string, reviewData: { rating: number; comment: string }) => {
    try {
      const response = await api.post(`/reviews/${serviceId}`, reviewData);
      return normalizeReview(response?.data?.data);
    } catch (error) {
      console.error('[review:create]', error);
      throw error;
    }
  },

  getServiceReviews: async (serviceId: string) => {
    try {
      const response = await api.get(`/reviews/${serviceId}`);
      return (response?.data?.data || []).map(normalizeReview);
    } catch (error) {
      console.error('[review:list]', error);
      throw error;
    }
  },

  deleteReview: async (id: string) => {
    try {
      const response = await api.delete(`/reviews/${id}`);
      return response?.data?.data;
    } catch (error) {
      console.error('[review:delete]', error);
      throw error;
    }
  },
};
