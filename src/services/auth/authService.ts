import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../api/apiEndpoints';
import { storageService } from '../storage/storageService';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { AuthTokens, LoginRequest, RegisterRequest, OTPRequest, ResetPasswordRequest } from '../../types/auth';
import { User } from '../../types/user';

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  login: async (payload: LoginRequest): Promise<{ tokens: AuthTokens; user: User }> => {
    const data = await apiClient.post<{ tokens: AuthTokens; user: User }>(
      API_ENDPOINTS.AUTH.LOGIN,
      payload,
    );
    await authService._persistTokens(data.tokens);
    return data;
  },

  register: async (payload: RegisterRequest): Promise<{ message: string }> => {
    return apiClient.post(API_ENDPOINTS.AUTH.REGISTER, payload);
  },

  verifyOTP: async (payload: OTPRequest): Promise<{ tokens: AuthTokens; user: User }> => {
    const data = await apiClient.post<{ tokens: AuthTokens; user: User }>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      payload,
    );
    await authService._persistTokens(data.tokens);
    return data;
  },

  sendOTP: async (mobile: string, type: string): Promise<{ message: string }> => {
    return apiClient.post(API_ENDPOINTS.AUTH.SEND_OTP, { mobile, type });
  },

  forgotPassword: async (mobile: string): Promise<{ message: string }> => {
    return apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { mobile });
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<{ message: string }> => {
    return apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      await storageService.remove(STORAGE_KEYS.ACCESS_TOKEN);
      await storageService.remove(STORAGE_KEYS.REFRESH_TOKEN);
      await storageService.remove(STORAGE_KEYS.USER_ID);
    }
  },

  _persistTokens: async (tokens: AuthTokens): Promise<void> => {
    await storageService.set(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    await storageService.set(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  },
};
