import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../api/apiEndpoints';
import { storageService } from '../storage/storageService';
import { STORAGE_KEYS } from '../../constants/storageKeys';
import { AuthTokens, LoginRequest, RegisterRequest, OTPRequest, ResetPasswordRequest } from '../../types/auth';
import { User } from '../../types/user';

// ─── Normalize backend user → frontend User shape ─────────────────────────────
// Backend uses username/phone, frontend types expect name/mobile etc.
const normalizeUser = (raw: any): User => ({
  id: raw?.id || '',
  name: raw?.name || raw?.username || '',
  username: raw?.username || '',
  mobile: raw?.phone || raw?.mobile || '',
  email: raw?.email || '',
  avatar: raw?.avatar || '',
  level: raw?.level || 1,
  xp: raw?.xp || 0,
  coins: raw?.coins || 0,
  rank: raw?.rank || 0,
  totalGamesPlayed: raw?.gameStats?.played || 0,
  totalWins: raw?.gameStats?.won || 0,
  totalLosses: raw?.gameStats?.lost || 0,
  winRate: raw?.gameStats?.played > 0 ? Math.round((raw.gameStats.won / raw.gameStats.played) * 100) : 0,
  referralCode: raw?.referralCode || '',
  isOnline: raw?.isOnline || false,
  lastSeen: raw?.lastActive || raw?.lastSeen || new Date().toISOString(),
  createdAt: raw?.createdAt || new Date().toISOString(),
});

const normalizeTokens = (data: any): AuthTokens | null => {
  if (!data) return null;
  const rawTokens = data.tokens || (data.data && data.data.tokens) || data;
  const accessToken =
    rawTokens.accessToken ||
    rawTokens.token ||
    data.accessToken ||
    data.token ||
    (data.data && (data.data.accessToken || data.data.token));
  const refreshToken =
    rawTokens.refreshToken ||
    data.refreshToken ||
    (data.data && data.data.refreshToken) ||
    '';

  if (accessToken) {
    return {
      accessToken,
      refreshToken,
      expiresAt: rawTokens.expiresAt || (data.expiresAt) || (Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }
  return null;
};

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {
  login: async (payload: LoginRequest): Promise<{ tokens: AuthTokens; user: User; message?: string }> => {
    const data = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.LOGIN,
      payload,
    );
    const tokens = normalizeTokens(data);
    const rawUser = data?.user || (data?.data && data.data.user);
    const user = rawUser ? normalizeUser(rawUser) : null;
    if (tokens) {
      await authService._persistTokens(tokens);
    }
    if (user) {
      await storageService.set(STORAGE_KEYS.USER_PROFILE, user);
      if (user.id) {
        await storageService.set(STORAGE_KEYS.USER_ID, user.id);
      }
    }
    return { tokens: tokens!, user: user as User, message: data?.message };
  },

  register: async (payload: RegisterRequest): Promise<{ message: string; contact: string; contactType: 'phone' | 'email'; devOtp?: string }> => {
    const data = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.REGISTER,
      payload,
    );
    // Register no longer returns tokens — user must verify OTP first
    return {
      message: data?.message || 'OTP sent. Please verify to continue.',
      contact: data?.contact || '',
      contactType: data?.contactType || 'email',
      devOtp: data?.devOtp,
    };
  },

  verifyRegistrationOtp: async (contact: string, otp: string): Promise<{ tokens: AuthTokens; user: User; message?: string }> => {
    const data = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.VERIFY_REGISTRATION_OTP,
      { contact, otp },
    );
    const tokens = normalizeTokens(data);
    const rawUser = data?.user || (data?.data && data.data.user);
    const user = rawUser ? normalizeUser(rawUser) : null;
    if (tokens) {
      await authService._persistTokens(tokens);
    }
    if (user) {
      await storageService.set(STORAGE_KEYS.USER_PROFILE, user);
      if (user.id) {
        await storageService.set(STORAGE_KEYS.USER_ID, user.id);
      }
    }
    return { tokens: tokens!, user: user as User, message: data?.message };
  },

  verifyOTP: async (payload: OTPRequest): Promise<{ tokens: AuthTokens; user: User; message?: string }> => {
    const data = await apiClient.post<any>(
      API_ENDPOINTS.AUTH.VERIFY_OTP,
      payload,
    );
    const tokens = normalizeTokens(data);
    const rawUser = data?.user || (data?.data && data.data.user);
    const user = rawUser ? normalizeUser(rawUser) : null;
    if (tokens) {
      await authService._persistTokens(tokens);
    }
    if (user) {
      await storageService.set(STORAGE_KEYS.USER_PROFILE, user);
      if (user.id) {
        await storageService.set(STORAGE_KEYS.USER_ID, user.id);
      }
    }
    return { tokens: tokens!, user: user as User, message: data?.message };
  },

  sendOTP: async (mobile: string, type: string): Promise<{ message: string }> => {
    return apiClient.post(API_ENDPOINTS.AUTH.SEND_OTP, { mobile, type });
  },

  forgotPassword: async (identifier: string): Promise<{ message: string }> => {
    const isEmail = identifier.includes('@');
    const isMobile = /^\+?[0-9]{7,15}$/.test(identifier);
    return apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
      identifier,
      email: isEmail ? identifier : undefined,
      mobile: isMobile ? identifier : undefined,
    });
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<{ message: string }> => {
    return apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Ignore network errors on logout
    } finally {
      await storageService.remove(STORAGE_KEYS.ACCESS_TOKEN);
      await storageService.remove(STORAGE_KEYS.REFRESH_TOKEN);
      await storageService.remove(STORAGE_KEYS.USER_ID);
      await storageService.remove(STORAGE_KEYS.USER_PROFILE);
    }
  },

  _persistTokens: async (tokens: AuthTokens): Promise<void> => {
    await storageService.set(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    if (tokens.refreshToken) {
      await storageService.set(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
    }
  },
};
