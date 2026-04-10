import api from './api';
import { Service, User } from '../types';
import { normalizeService, normalizeUser } from './normalizers';

let wishlistCache: Service[] | null = null;
let wishlistPromise: Promise<Service[]> | null = null;

export const userService = {
  clearWishlistCache: () => {
    wishlistCache = null;
    wishlistPromise = null;
  },

  getWishlist: async () => {
    if (wishlistCache) {
      return wishlistCache;
    }

    if (!wishlistPromise) {
      wishlistPromise = api.get('/users/wishlist').then((response) => {
        wishlistCache = (response?.data?.data || []).map(normalizeService);
        return wishlistCache;
      }).catch((error) => {
        console.error('[user:get-wishlist]', error);
        throw error;
      }).finally(() => {
        wishlistPromise = null;
      });
    }

    return wishlistPromise;
  },

  addToWishlist: async (serviceId: string) => {
    try {
      const response = await api.post(`/users/wishlist/${serviceId}`);
      userService.clearWishlistCache();
      return response?.data?.data;
    } catch (error) {
      console.error('[user:add-wishlist]', error);
      throw error;
    }
  },

  removeFromWishlist: async (serviceId: string) => {
    try {
      const response = await api.delete(`/users/wishlist/${serviceId}`);
      userService.clearWishlistCache();
      return response?.data?.data;
    } catch (error) {
      console.error('[user:remove-wishlist]', error);
      throw error;
    }
  },

  toggleWishlist: async (serviceId: string) => {
    try {
      const response = await api.put(`/users/wishlist/${serviceId}/toggle`);
      userService.clearWishlistCache();
      return response?.data?.data as { saved: boolean; serviceIds: string[] };
    } catch (error) {
      console.error('[user:toggle-wishlist]', error);
      throw error;
    }
  },

  uploadProfileImage: async (file: File) => {
    const formData = new FormData();
    formData.append('profilePic', file);

    try {
      const response = await api.post('/user/upload-pfp', formData);
      return {
        imageUrl: (response?.data?.imageUrl || '') as string,
        user: response?.data?.data ? normalizeUser(response.data.data) as User : undefined,
      };
    } catch (error) {
      console.error('[user:upload-profile]', error);
      throw error;
    }
  },
};
