import api from './api';

export const contactService = {
  submitMessage: async (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    try {
      const response = await api.post('/contact', payload);
      return response?.data;
    } catch (error) {
      console.error('[contact:submit]', error);
      throw error;
    }
  },
};
