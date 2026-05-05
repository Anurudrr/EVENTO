import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  User,
  LoginCredentials,
  SendOtpPayload,
  SendOtpResponse,
  VerifyOtpPayload,
  GoogleAuthPayload,
} from '../types';
import { authService } from '../services/authService';
import { AUTH_EXPIRED_EVENT, getStoredUser, setStoredUser } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  sendOtp: (payload: SendOtpPayload) => Promise<SendOtpResponse>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<User>;
  googleAuth: (payload: GoogleAuthPayload) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User> | FormData) => Promise<User>;
  syncUser: (user: User) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
let authBootstrapPromise: Promise<User | null> | null = null;

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
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authStateVersionRef = useRef(0);

  const markAuthStateChanged = () => {
    authStateVersionRef.current += 1;
  };

  const isLoading = isBootstrapping || isAuthenticating;

  const syncUser = (nextUser: User) => {
    setUser(nextUser);
    setStoredUser(nextUser);
  };

  useEffect(() => {
    const storedUser = getStoredUser();

    if (storedUser) {
      setUser(storedUser);
    }

    let cancelled = false;

    const handleAuthExpired = () => {
      if (!cancelled) {
        markAuthStateChanged();
        setUser(null);
        setError('Your session has expired. Please log in again.');
      }
    };

    const bootstrapVersion = authStateVersionRef.current;
    const hasBootstrapBeenSuperseded = () => (
      authStateVersionRef.current !== bootstrapVersion
    );

    const initAuth = async () => {
      if (!authBootstrapPromise) {
        authBootstrapPromise = authService.getMe()
          .catch((err: any) => {
            const status = Number(err?.response?.status || 0);

            if (status === 401 || status === 403) {
              if (!hasBootstrapBeenSuperseded()) {
                authService.clearAuth();
              }

              return null;
            }

            if (storedUser) {
              return storedUser;
            }

            throw err;
          })
          .finally(() => {
            authBootstrapPromise = null;
          });
      }

      try {
        const response = await authBootstrapPromise;
        if (!cancelled && !hasBootstrapBeenSuperseded()) {
          setUser(response || null);
          setError(null);
        }
      } catch (err: any) {
        console.error('[auth:init]', err);
        if (!cancelled && !hasBootstrapBeenSuperseded()) {
          setError(extractErrorMessage(err, 'Unable to refresh session'));
        }
      }

      if (!cancelled) {
        setIsBootstrapping(false);
      }
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    void initAuth();

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setError(null);
    setIsAuthenticating(true);
    try {
      const response = await authService.login(credentials);
      markAuthStateChanged();
      syncUser(response);
      return response;
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Login failed'));
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const sendOtp = async (payload: SendOtpPayload) => {
    setError(null);
    setIsAuthenticating(true);
    try {
      return await authService.sendOtp(payload);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Unable to send OTP'));
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const verifyOtp = async (payload: VerifyOtpPayload) => {
    setError(null);
    setIsAuthenticating(true);
    try {
      const response = await authService.verifyOtp(payload);
      markAuthStateChanged();
      syncUser(response);
      return response;
    } catch (err: any) {
      setError(extractErrorMessage(err, 'OTP verification failed'));
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const googleAuth = async (payload: GoogleAuthPayload) => {
    setError(null);
    setIsAuthenticating(true);
    try {
      const response = await authService.googleAuth(payload);
      markAuthStateChanged();
      syncUser(response);
      return response;
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Google login failed'));
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    markAuthStateChanged();
    await authService.logoutRemote();
    setUser(null);
    setError(null);
  };

  const updateProfile = async (data: Partial<User> | FormData) => {
    setError(null);
    setIsAuthenticating(true);
    try {
      const response = await authService.updateProfile(data);
      syncUser(response);
      return response;
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Profile update failed'));
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, sendOtp, verifyOtp, googleAuth, logout, updateProfile, syncUser, isAuthenticated: !!user, isLoading, error }}>
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
