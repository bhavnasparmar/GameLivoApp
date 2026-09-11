// ─── Auth Types ─────────────────────────────────────────────────────────────

export interface LoginRequest {
  identifier?: string;
  mobile?: string;
  email?: string;
  username?: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  username?: string;
  mobile?: string;
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
  mobile?: string;
  email?: string;
  identifier?: string;
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
