import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('evento_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser set the multipart boundary for FormData requests.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const fallbackMessage = error?.code === 'ERR_NETWORK'
      ? 'Unable to reach the server. Check VITE_API_URL and backend deployment.'
      : error?.response?.data?.error
        || error?.response?.data?.message
        || error?.message
        || 'Request failed';

    console.error('[api:error]', {
      url: error?.config?.url,
      method: error?.config?.method,
      baseURL: error?.config?.baseURL,
      message: fallbackMessage,
      status: error?.response?.status,
      data: error?.response?.data,
    });

    const normalizedError = Object.assign(new Error(fallbackMessage), error, {
      message: fallbackMessage,
    });

    return Promise.reject(normalizedError);
  }
);

export default api;
