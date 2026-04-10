import api from './api';
import { Service, ServiceFilters } from '../types';
import { normalizeService } from './normalizers';

const describeFormData = (formData: FormData) => {
  const payload: Record<string, unknown> = {};

  formData.forEach((value, key) => {
    const nextValue = typeof File !== 'undefined' && value instanceof File
      ? { name: value.name, size: value.size, type: value.type }
      : value;

    const currentValue = payload[key];
    if (currentValue === undefined) {
      payload[key] = nextValue;
      return;
    }

    payload[key] = Array.isArray(currentValue)
      ? [...currentValue, nextValue]
      : [currentValue, nextValue];
  });

  return payload;
};

export const serviceService = {
  getServices: async (filters: ServiceFilters = {}) => {
    try {
      const response = await api.get('/services', {
        params: {
          search: filters.search || undefined,
          category: filters.category && filters.category !== 'All' ? filters.category : undefined,
          sort: filters.sort === 'newest'
            ? '-createdAt'
            : filters.sort === 'price-low'
              ? 'price'
              : filters.sort === 'price-high'
                ? '-price'
                : filters.sort === 'rating'
                  ? '-rating'
                  : undefined,
          organizer: filters.organizer,
          location: filters.location || undefined,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          minRating: filters.minRating,
          page: filters.page,
          limit: filters.limit,
        },
      });

      return (response?.data?.data || []).map(normalizeService);
    } catch (error) {
      console.error('[service:get-services]', error);
      throw error;
    }
  },

  getService: async (id: string) => {
    try {
      const response = await api.get(`/services/${id}`);
      if (!response?.data?.data) {
        throw new Error('Service response is missing data');
      }

      return normalizeService(response.data.data);
    } catch (error) {
      console.error('[service:get-service]', error);
      throw error;
    }
  },

  createService: async (serviceData: FormData) => {
    try {
      const response = await api.post('/services', serviceData);
      if (!response?.data?.data) {
        throw new Error('Create service response is missing data');
      }

      return normalizeService(response.data.data);
    } catch (error) {
      console.error('[service:create]', error);
      throw error;
    }
  },

  updateService: async (id: string, serviceData: FormData) => {
    try {
      console.log('[service:update:request]', {
        id,
        payload: describeFormData(serviceData),
      });

      const response = await api.put(`/services/${id}`, serviceData);
      if (!response?.data?.data) {
        throw new Error('Update service response is missing data');
      }

      console.log('[service:update:response]', {
        id,
        status: response.status,
        service: response.data.data,
      });

      return normalizeService(response.data.data);
    } catch (error) {
      console.error('[service:update]', error);
      throw error;
    }
  },

  updateAvailability: async (id: string, availability: Service['availability']) => {
    try {
      const response = await api.put(`/services/${id}/availability`, { availability });
      if (!response?.data?.data) {
        throw new Error('Availability update response is missing data');
      }

      return normalizeService(response.data.data);
    } catch (error) {
      console.error('[service:update-availability]', error);
      throw error;
    }
  },

  deleteService: async (id: string) => {
    try {
      const response = await api.delete(`/services/${id}`);
      return response?.data;
    } catch (error) {
      console.error('[service:delete]', error);
      throw error;
    }
  },

  getOrganizerServices: async (organizerId: string) => {
    const services = await serviceService.getServices({ organizer: organizerId });
    return services;
  },
};
