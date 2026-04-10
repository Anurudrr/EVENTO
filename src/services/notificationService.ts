import api from './api';
import { NotificationItem } from '../types';
import { normalizeNotification } from './normalizers';

export const notificationService = {
  getNotifications: async (limit = 20) => {
    try {
      const response = await api.get('/notifications', { params: { limit } });
      return {
        unreadCount: Number(response?.data?.unreadCount ?? 0),
        notifications: (response?.data?.data || []).map(normalizeNotification) as NotificationItem[],
      };
    } catch (error) {
      console.error('[notification:list]', error);
      throw error;
    }
  },

  markRead: async (id: string) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return normalizeNotification(response?.data?.data);
    } catch (error) {
      console.error('[notification:mark-read]', error);
      throw error;
    }
  },

  markAllRead: async () => {
    try {
      await api.put('/notifications/read-all');
    } catch (error) {
      console.error('[notification:mark-all-read]', error);
      throw error;
    }
  },
};
