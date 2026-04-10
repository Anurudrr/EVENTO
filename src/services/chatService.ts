import api from './api';
import { ChatMessage } from '../types';
import { normalizeChatMessage } from './normalizers';

export const chatService = {
  getBookingMessages: async (bookingId: string) => {
    try {
      const response = await api.get(`/chats/bookings/${bookingId}/messages`);
      return (response?.data?.data || []).map(normalizeChatMessage) as ChatMessage[];
    } catch (error) {
      console.error('[chat:get-booking-messages]', error);
      throw error;
    }
  },

  sendBookingMessage: async (bookingId: string, text: string) => {
    try {
      const response = await api.post(`/chats/bookings/${bookingId}/messages`, { text });
      return normalizeChatMessage(response?.data?.data);
    } catch (error) {
      console.error('[chat:send-booking-message]', error);
      throw error;
    }
  },
};
