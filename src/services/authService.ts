import api from './api';
import {
  User,
  LoginCredentials,
  SignupCredentials,
  SendOtpPayload,
  VerifyOtpPayload,
  GoogleAuthPayload,
} from '../types';
import { userService } from './userService';
import { buildApiUrl } from '../config/env';

const getRequiredData = <T>(value: T | null | undefined, message: string): T => {
  if (value == null) {
    throw new Error(message);
  }

  return value;
};

const persistAuth = (token: string, user: User) => {
  localStorage.removeItem('evento_token');
  localStorage.setItem('evento_user', JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem('evento_token');
  localStorage.removeItem('evento_user');
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
    try {
      const response = await api.post(buildApiUrl('/auth/login'), credentials);
      const user = withImageCacheBust(getRequiredData(response?.data?.user, 'Login response is missing user data'));
      const token = getRequiredData(response?.data?.token, 'Login response is missing token');
      persistAuth(token, user);
      return user;
    } catch (error) {
      console.error('[auth:login]', error);
      throw error;
    }
  },

  register: async (credentials: SignupCredentials) => {
    try {
      const response = await api.post(buildApiUrl('/auth/register'), credentials);
      const user = withImageCacheBust(getRequiredData(response?.data?.user, 'Registration response is missing user data'));
      const token = getRequiredData(response?.data?.token, 'Registration response is missing token');
      persistAuth(token, user);
      return user;
    } catch (error) {
      console.error('[auth:register]', error);
      throw error;
    }
  },

  sendOtp: async (payload: SendOtpPayload) => {
    try {
      const response = await api.post(buildApiUrl('/auth/send-otp'), payload);
      return getRequiredData(response?.data, 'OTP response is missing');
    } catch (error) {
      console.error('[auth:send-otp]', error);
      throw error;
    }
  },

  verifyOtp: async (payload: VerifyOtpPayload) => {
    try {
      const response = await api.post(buildApiUrl('/auth/verify-otp'), payload);
      const user = withImageCacheBust(getRequiredData(response?.data?.user, 'OTP verification response is missing user data'));
      const token = getRequiredData(response?.data?.token, 'OTP verification response is missing token');
      persistAuth(token, user);
      return user;
    } catch (error) {
      console.error('[auth:verify-otp]', error);
      throw error;
    }
  },

  googleAuth: async (payload: GoogleAuthPayload) => {
    try {
      const response = await api.post(buildApiUrl('/auth/google'), payload);
      const user = withImageCacheBust(getRequiredData(response?.data?.user, 'Google auth response is missing user data'));
      const token = getRequiredData(response?.data?.token, 'Google auth response is missing token');
      persistAuth(token, user);
      return user;
    } catch (error) {
      console.error('[auth:google]', error);
      throw error;
    }
  },

  logout: () => {
    clearAuth();
  },

  logoutRemote: async () => {
    try {
      await api.post(buildApiUrl('/auth/logout'));
    } catch (error) {
      console.error('[auth:logout]', error);
    } finally {
      clearAuth();
    }
  },

  getMe: async () => {
    try {
      const response = await api.get(buildApiUrl('/auth/me'));
      return withImageCacheBust(getRequiredData(response?.data?.data, 'Profile response is missing user data'));
    } catch (error) {
      console.error('[auth:get-me]', error);
      throw error;
    }
  },

  updateProfile: async (data: Partial<User> | FormData) => {
    try {
      const response = await api.put(buildApiUrl('/users/profile'), data);
      const updatedUser = withImageCacheBust(getRequiredData(response?.data?.data, 'Profile update response is missing user data'));
      localStorage.setItem('evento_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      console.error('[auth:update-profile]', error);
      throw error;
    }
  },
};
