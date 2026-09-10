// ─── App Constants ───────────────────────────────────────────────────────────

export const APP_NAME = 'GameLivo';
export const APP_VERSION = '1.0.0';
export const APP_BUILD = '1';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
} as const;

export const TIMEOUTS = {
  API_REQUEST: 30_000, // 30s
  SOCKET_CONNECT: 10_000, // 10s
  SOCKET_RECONNECT_DELAY: 3_000, // 3s
  TOAST_DURATION: 3_000, // 3s
  ANIMATION_FAST: 200,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
} as const;

export const MAX_RETRIES = 3;

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'gu'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_SECONDS = 300; // 5 minutes

export const REFERRAL_REWARD_COINS = 50;
export const WELCOME_BONUS_COINS = 100;
