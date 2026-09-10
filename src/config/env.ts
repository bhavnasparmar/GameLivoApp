// ─── GameLivo Environment Configuration ─────────────────────────────────────
// Centralized configuration file that selects URLs and settings based on ENV

export type Environment = 'development' | 'staging' | 'production';

export interface AppConfig {
  apiBaseUrl: string;
  socketUrl: string;
  env: Environment;
  isDev: boolean;
  isStaging: boolean;
  isProd: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error' | 'none';
}

// ─── Environment-Specific URL & Feature Definitions ───────────────────────────

const ENVIRONMENTS: Record<Environment, AppConfig> = {
  development: {
    env: 'development',
    apiBaseUrl: 'https://flagship-legislate-patchwork.ngrok-free.dev/api/v1', // Android emulator localhost (use 10.0.2.2 for Android or localhost for iOS)
    socketUrl: 'https://flagship-legislate-patchwork.ngrok-free.dev',
    isDev: true,
    isStaging: false,
    isProd: false,
    logLevel: 'debug',
  },
  staging: {
    env: 'staging',
    apiBaseUrl: 'https://staging-api.gamelivo.com/api/v1',
    socketUrl: 'https://staging-api.gamelivo.com',
    isDev: false,
    isStaging: true,
    isProd: false,
    logLevel: 'info',
  },
  production: {
    env: 'production',
    apiBaseUrl: 'https://api.gamelivo.com/api/v1',
    socketUrl: 'https://api.gamelivo.com',
    isDev: false,
    isStaging: false,
    isProd: true,
    logLevel: 'error',
  },
};

// ─── Extract Environment Variables ───────────────────────────────────────────

function getEnvValue(key: 'ENV' | 'API_BASE_URL' | 'SOCKET_URL'): string | undefined {
  // 1. Try react-native-config
  try {
    const RNCConfig = require('react-native-config').default || require('react-native-config');
    if (RNCConfig && RNCConfig[key]) {
      return RNCConfig[key];
    }
  } catch {
    // Ignore fallback
  }

  // 2. Try @env module
  try {
    const envModule = require('@env');
    if (envModule && envModule[key]) {
      return envModule[key];
    }
  } catch {
    // Ignore fallback
  }

  // 3. Try process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }

  return undefined;
}

// ─── Active Configuration Resolution ─────────────────────────────────────────

const rawEnv = (getEnvValue('ENV') || 'development').trim().toLowerCase() as Environment;
const activeEnv: Environment = (['development', 'staging', 'production'].includes(rawEnv)
  ? rawEnv
  : 'development') as Environment;

const baseConfig = ENVIRONMENTS[activeEnv] || ENVIRONMENTS.development;

const customApiBaseUrl = getEnvValue('API_BASE_URL');
const customSocketUrl = getEnvValue('SOCKET_URL');

export const Config: AppConfig = {
  ...baseConfig,
  ...(customApiBaseUrl ? { apiBaseUrl: customApiBaseUrl } : {}),
  ...(customSocketUrl ? { socketUrl: customSocketUrl } : {}),
};

export default Config;
