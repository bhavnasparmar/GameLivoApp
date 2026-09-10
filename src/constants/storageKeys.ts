// ─── AsyncStorage / SecureStorage Keys ──────────────────────────────────────

export const STORAGE_KEYS = {
  // Auth
  ACCESS_TOKEN: '@gamelivo/accessToken',
  REFRESH_TOKEN: '@gamelivo/refreshToken',
  USER_ID: '@gamelivo/userId',

  // User preferences
  THEME_MODE: '@gamelivo/themeMode',
  LANGUAGE: '@gamelivo/language',

  // Settings
  SOUND_ENABLED: '@gamelivo/soundEnabled',
  VIBRATION_ENABLED: '@gamelivo/vibrationEnabled',
  NOTIFICATIONS_ENABLED: '@gamelivo/notificationsEnabled',

  // Onboarding
  IS_ONBOARDING_DONE: '@gamelivo/isOnboardingDone',

  // Cache
  GAME_LIST_CACHE: '@gamelivo/gameListCache',
  LEADERBOARD_CACHE: '@gamelivo/leaderboardCache',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
