import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectIsLoggedIn, selectAuthLoading, selectAuthError } from '../redux/selectors/authSelectors';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction, clearError, stopLoading } from '../redux/slices/authSlice';
import { fetchProfileSuccess, clearProfile } from '../redux/slices/userSlice';
import { authService } from '../services/auth/authService';
import { LoginRequest, RegisterRequest } from '../types/auth';

import { resetToAuth } from '../navigation/navigationRef';
import { storageService } from '../services/storage/storageService';
import { STORAGE_KEYS } from '../constants/storageKeys';
import apiClient from '../services/api/apiClient';
import { API_ENDPOINTS } from '../services/api/apiEndpoints';
import { User } from '../types/user';

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
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const token = await storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) return false;

      const userRes = await apiClient.get<User>(API_ENDPOINTS.USER.PROFILE);
      if (userRes) {
        dispatch(fetchProfileSuccess(userRes as any));
        dispatch(
          loginSuccess({
            tokens: { accessToken: token, refreshToken: '', expiresAt: 0 },
            userId: (userRes as any).id || 'user',
          }),
        );
        return true;
      }
      return false;
    } catch {
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

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await authService.logout();
    dispatch(logoutAction());
    dispatch(clearProfile());
    resetToAuth();
  }, [dispatch]);

  return { isLoggedIn, isLoading, error, login, register, verifyRegistrationOtp, forgotPassword, logout, resetError, checkAuth };
};
