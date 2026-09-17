import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectIsLoggedIn, selectAuthLoading, selectAuthError } from '../redux/selectors/authSelectors';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction, clearError, stopLoading } from '../redux/slices/authSlice';
import { fetchProfileSuccess, clearProfile } from '../redux/slices/userSlice';
import { authService } from '../services/auth/authService';
import { userService } from '../services/user/userService';
import { LoginRequest, RegisterRequest, OTPRequest } from '../types/auth';

import { resetToAuth } from '../navigation/navigationRef';
import { storageService } from '../services/storage/storageService';
import { STORAGE_KEYS } from '../constants/storageKeys';
import apiClient from '../services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/apiEndpoints';
import { User, UserProfile } from '../types/user';
import { isTokenExpired } from '../utils/tokenUtils';

// ─── useAuth Hook ─────────────────────────────────────────────────────────────

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const resetError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // ── Restore / Check Session on App Start ──────────────────────────────────
  // Keeps the user logged in until their token truly expires or is invalidated
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const token = await storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await storageService.get<string>(STORAGE_KEYS.REFRESH_TOKEN);
      const cachedProfile = await storageService.get<UserProfile>(STORAGE_KEYS.USER_PROFILE);
      const cachedUserId = await storageService.get<string>(STORAGE_KEYS.USER_ID);

      // If neither access token nor refresh token is in storage, user is not logged in
      if (!token && !refreshToken) {
        return false;
      }

      let activeToken = token;
      const expired = token ? isTokenExpired(token) : true;

      // If access token is expired (or missing) but we have a refresh token, try refreshing
      if (expired && refreshToken) {
        try {
          const res = await apiClient.post<any>(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
            refreshToken,
          });
          const data = res?.data || res;
          const newToken =
            data?.accessToken ||
            data?.token ||
            data?.data?.accessToken ||
            data?.data?.token;

          if (newToken) {
            activeToken = newToken;
            await storageService.set(STORAGE_KEYS.ACCESS_TOKEN, newToken);
            const newRefreshToken = data?.refreshToken || data?.data?.refreshToken;
            if (newRefreshToken) {
              await storageService.set(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
            }
          } else {
            // Failed to refresh token
            await authService.logout();
            return false;
          }
        } catch (refreshErr: any) {
          // If server explicitly returned 401/403, refresh token is dead
          if (refreshErr?.response?.status === 401 || refreshErr?.response?.status === 403) {
            await authService.logout();
            return false;
          }
          // On network/connectivity issues, if token was not strictly expired, permit offline session
          if (expired) {
            return false;
          }
        }
      } else if (expired && !refreshToken) {
        // Token is expired and no refresh token available
        await authService.logout();
        return false;
      }

      if (!activeToken) return false;

      // 1. Immediately hydrate Redux store with cached user & token so UI loads without waiting
      const userId = cachedProfile?.id || cachedUserId || 'user';
      if (cachedProfile) {
        dispatch(fetchProfileSuccess(cachedProfile));
      }
      dispatch(
        loginSuccess({
          tokens: {
            accessToken: activeToken,
            refreshToken: refreshToken || '',
            expiresAt: 0,
          },
          userId,
        }),
      );

      // 2. Fetch fresh user profile in background (non-blocking for splash)
      userService
        .getProfile()
        .then(async freshProfile => {
          if (freshProfile && freshProfile.id) {
            dispatch(fetchProfileSuccess(freshProfile));
            await storageService.set(STORAGE_KEYS.USER_PROFILE, freshProfile);
            await storageService.set(STORAGE_KEYS.USER_ID, freshProfile.id);
          }
        })
        .catch(profileErr => {
          // If profile endpoint returns 401, session is invalid on server
          if (profileErr?.response?.status === 401) {
            authService.logout().then(() => {
              dispatch(logoutAction());
              dispatch(clearProfile());
              resetToAuth();
            });
          }
        });

      return true;
    } catch (err) {
      console.warn('Session restoration check failed:', err);
      return false;
    }
  }, [dispatch]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (payload: LoginRequest): Promise<boolean> => {
    dispatch(loginStart());
    try {
      const response = await authService.login(payload);
      if (response?.user) {
        dispatch(fetchProfileSuccess(response.user as any));
      }
      dispatch(
        loginSuccess({
          tokens: response.tokens,
          userId: response.user?.id || 'unknown',
        }),
      );
      return true;
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Login failed. Please check your credentials and try again.';
      dispatch(loginFailure(message));
      return false;
    }
  }, [dispatch]);

  // ── Register ──────────────────────────────────────────────────────────────
  // Register creates the user and sends OTP — does NOT log in.
  // Returns contact info so the app can navigate to OTP screen.
  const register = useCallback(
    async (
      payload: RegisterRequest,
    ): Promise<{ success: boolean; contact?: string; contactType?: 'phone' | 'email'; devOtp?: string; message?: string; error?: string }> => {
      dispatch(loginStart());
      try {
        const response = await authService.register(payload);
        // Always stop loading — user still needs to verify OTP
        dispatch(stopLoading());
        return {
          success: true,
          contact: response.contact,
          contactType: response.contactType,
          devOtp: response.devOtp,
          message: response.message,
        };
      } catch (err: any) {
        let message = 'Registration failed. Please verify your details and try again.';
        if (err?.response?.data) {
          const data = err.response.data;
          if (typeof data.message === 'string' && data.message) {
            message = data.message;
          } else if (typeof data.error === 'string' && data.error) {
            message = data.error;
          } else if (Array.isArray(data.errors) && data.errors.length > 0) {
            const first = data.errors[0];
            message = typeof first === 'string' ? first : first?.msg || first?.message || JSON.stringify(first);
          }
        } else if (err?.message) {
          message = err.message;
        }
        dispatch(loginFailure(message));
        return { success: false, error: message };
      }
    },
    [dispatch],
  );

  // ── Verify Registration OTP ────────────────────────────────────────────────
  // Verifies OTP after registration, marks user as verified, and logs them in.
  const verifyRegistrationOtp = useCallback(
    async (
      contact: string,
      otp: string,
    ): Promise<{ success: boolean; message?: string; error?: string }> => {
      dispatch(loginStart());
      try {
        const response = await authService.verifyRegistrationOtp(contact, otp);
        if (response?.user) {
          dispatch(fetchProfileSuccess(response.user as any));
        }
        if (response?.tokens) {
          dispatch(
            loginSuccess({
              tokens: response.tokens,
              userId: response.user?.id || 'unknown',
            }),
          );
        } else {
          dispatch(stopLoading());
        }
        return { success: true, message: response?.message };
      } catch (err: any) {
        let message = 'OTP verification failed. Please try again.';
        if (err?.response?.data) {
          const data = err.response.data;
          if (typeof data.message === 'string' && data.message) {
            message = data.message;
          } else if (typeof data.error === 'string' && data.error) {
            message = data.error;
          }
        } else if (err?.message) {
          message = err.message;
        }
        dispatch(loginFailure(message));
        return { success: false, error: message };
      }
    },
    [dispatch],
  );

  // ── Forgot Password ────────────────────────────────────────────────────────
  const forgotPassword = useCallback(
    async (
      identifier: string,
    ): Promise<{ success: boolean; message?: string; error?: string }> => {
      dispatch(loginStart());
      try {
        const response = await authService.forgotPassword(identifier);
        dispatch(stopLoading());
        dispatch(clearError());
        return {
          success: true,
          message:
            response?.message ||
            'Password reset link or OTP has been sent successfully.',
        };
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          'Failed to send password reset request. Please check your email or phone number.';
        dispatch(loginFailure(message));
        return { success: false, error: message };
      }
    },
    [dispatch],
  );

  // ── Verify General OTP ─────────────────────────────────────────────────────
  const verifyOTP = useCallback(
    async (
      payload: OTPRequest,
    ): Promise<{ success: boolean; message?: string; error?: string }> => {
      dispatch(loginStart());
      try {
        const response = await authService.verifyOTP(payload);
        if (response?.user) {
          dispatch(fetchProfileSuccess(response.user as any));
        }
        if (response?.tokens) {
          dispatch(
            loginSuccess({
              tokens: response.tokens,
              userId: response.user?.id || 'unknown',
            }),
          );
        } else {
          dispatch(stopLoading());
        }
        return { success: true, message: response?.message };
      } catch (err: any) {
        let message = 'OTP verification failed. Please try again.';
        if (err?.response?.data) {
          const data = err.response.data;
          if (typeof data.message === 'string' && data.message) {
            message = data.message;
          } else if (typeof data.error === 'string' && data.error) {
            message = data.error;
          }
        } else if (err?.message) {
          message = err.message;
        }
        dispatch(loginFailure(message));
        return { success: false, error: message };
      }
    },
    [dispatch],
  );

  // ── Refresh Token ──────────────────────────────────────────────────────────
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const tokens = await authService.refreshToken();
      if (tokens) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout();
    dispatch(logoutAction());
    dispatch(clearProfile());
    resetToAuth();
  }, [dispatch]);

  return {
    isLoggedIn,
    isLoading,
    error,
    login,
    register,
    verifyRegistrationOtp,
    verifyOTP,
    forgotPassword,
    logout,
    refreshToken,
    resetError,
    checkAuth,
  };
};
