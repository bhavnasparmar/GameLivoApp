// ─── Auth Types ─────────────────────────────────────────────────────────────

export interface LoginRequest {
  mobile: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  mobile: string;
  email?: string;
  password: string;
  referralCode?: string;
}

export interface OTPRequest {
  mobile: string;
  otp: string;
  type: OTPType;
}

export type OTPType = 'login' | 'register' | 'forgot_password';

export interface ForgotPasswordRequest {
  mobile: string;
}

export interface ResetPasswordRequest {
  mobile: string;
  otp: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthState {
  isLoggedIn: boolean;
  isLoading: boolean;
  tokens: AuthTokens | null;
  userId: string | null;
  error: string | null;
}
