import api from './api';
import {
  User,
  LoginCredentials,
  SendOtpPayload,
  SendOtpResponse,
  VerifyOtpPayload,
  GoogleAuthPayload,
} from '../types';
import { userService } from './userService';
import { clearStoredAuth, setStoredUser, storeAuthSession } from '../utils/storage';

const getRequiredData = <T>(value: T | null | undefined, message: string): T => {
  if (value == null) {
    throw new Error(message);
  }

  return value;
};

const clearAuth = () => {
  clearStoredAuth();
  userService.clearWishlistCache();
};

const withImageCacheBust = (user: User) => {
  if (!user?.profilePicture) {
    return user;
  }

  return {
    ...user,
    profilePicture: `${user.profilePicture}${user.profilePicture.includes('?') ? '&' : '?'}t=${Date.now()}`,
  };
};

export const authService = {
  clearAuth,

  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials);
    const user = withImageCacheBust(getRequiredData(response?.data?.user, 'Login response is missing user data'));
    storeAuthSession(user);
    return user;
  },

  sendOtp: async (payload: SendOtpPayload) => {
    const response = await api.post('/auth/send-otp', payload);
    return getRequiredData(response?.data, 'OTP response is missing') as SendOtpResponse;
  },

  verifyOtp: async (payload: VerifyOtpPayload) => {
    const response = await api.post('/auth/verify-otp', payload);
    const user = withImageCacheBust(getRequiredData(response?.data?.user, 'OTP verification response is missing user data'));
    storeAuthSession(user);
    return user;
  },

  googleAuth: async (payload: GoogleAuthPayload) => {
    const response = await api.post('/auth/google', payload);
    const user = withImageCacheBust(getRequiredData(response?.data?.user, 'Google auth response is missing user data'));
    storeAuthSession(user);
    return user;
  },

  logout: () => {
    clearAuth();
  },

  logoutRemote: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuth();
    }
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return withImageCacheBust(getRequiredData(response?.data?.data, 'Profile response is missing user data'));
  },

  updateProfile: async (data: Partial<User> | FormData) => {
    const response = await api.put('/users/profile', data);
    const updatedUser = withImageCacheBust(getRequiredData(response?.data?.data, 'Profile update response is missing user data'));
    setStoredUser(updatedUser);
    return updatedUser;
  },
};
