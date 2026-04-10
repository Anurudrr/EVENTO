import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  LoginCredentials,
  SignupCredentials,
  SendOtpPayload,
  VerifyOtpPayload,
  GoogleAuthPayload,
} from '../types';
import { authService } from '../services/authService';
import { getStoredUser } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: SignupCredentials) => Promise<void>;
  sendOtp: (payload: SendOtpPayload) => Promise<{ success: boolean; message: string; expiresIn: number; otpPreview?: string }>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<void>;
  googleAuth: (payload: GoogleAuthPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User> | FormData) => Promise<void>;
  syncUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const extractErrorMessage = (err: any, fallback: string): string => {
  const candidates = [
    err?.response?.data?.error,
    err?.response?.data?.message,
    err?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }

    if (candidate && typeof candidate === 'object') {
      if (typeof candidate.message === 'string' && candidate.message.trim()) {
        return candidate.message;
      }

      if (typeof candidate.code === 'string' && candidate.code.trim()) {
        return candidate.code;
      }
    }
  }

  return fallback;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncUser = (nextUser: User) => {
    setUser(nextUser);
    localStorage.setItem('evento_user', JSON.stringify(nextUser));
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await authService.getMe();
        setUser(response);
      } catch (err: any) {
        console.error('[auth:init]', err);
        authService.clearAuth();
        setUser(null);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      setUser(response);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: SignupCredentials) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authService.register(credentials);
      setUser(response);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Registration failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtp = async (payload: SendOtpPayload) => {
    setError(null);
    setIsLoading(true);
    try {
      return await authService.sendOtp(payload);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Unable to send OTP'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (payload: VerifyOtpPayload) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authService.verifyOtp(payload);
      setUser(response);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'OTP verification failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const googleAuth = async (payload: GoogleAuthPayload) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authService.googleAuth(payload);
      setUser(response);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Google login failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logoutRemote();
    setUser(null);
    setError(null);
  };

  const updateProfile = async (data: Partial<User> | FormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authService.updateProfile(data);
      syncUser(response);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Profile update failed'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, sendOtp, verifyOtp, googleAuth, logout, updateProfile, syncUser, isAuthenticated: !!user, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
