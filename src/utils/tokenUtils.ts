import { storageService } from '../services/storage/storageService';
import { STORAGE_KEYS } from '../constants/storageKeys';

/**
 * Base64 URL-safe decoder compatible with all React Native JS engines (Hermes, JSC, V8)
 */
const base64UrlDecode = (str: string): string => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    let buffer = 0;
    let bits = 0;

    // Clean URL-safe base64 string
    let cleanStr = str.replace(/-/g, '+').replace(/_/g, '/');
    while (cleanStr.length % 4 !== 0) {
      cleanStr += '=';
    }

    for (let i = 0; i < cleanStr.length; i++) {
      const char = cleanStr.charAt(i);
      const index = chars.indexOf(char);
      if (index === -1) continue;
      buffer = (buffer << 6) | index;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        output += String.fromCharCode((buffer >> bits) & 0xff);
      }
    }
    return output;
  } catch {
    return '';
  }
};

/**
 * Parse JWT payload without external libraries
 */
export const parseJwt = (token: string): Record<string, any> | null => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const decodedStr = base64UrlDecode(parts[1]);
    if (!decodedStr) return null;
    return JSON.parse(decodedStr);
  } catch {
    return null;
  }
};

/**
 * Check if a JWT token is expired.
 * bufferSeconds: Safety margin before actual expiration (default 30 seconds).
 * Returns false if token is not a standard JWT or has no exp claim (assumes valid until backend rejects).
 */
export const isTokenExpired = (token: string, bufferSeconds = 30): boolean => {
  if (!token || typeof token !== 'string') return true;
  try {
    const decoded = parseJwt(token);
    if (!decoded || typeof decoded.exp !== 'number') {
      // Non-JWT token or token without expiry timestamp — assumed valid
      return false;
    }
    const currentTimeSec = Math.floor(Date.now() / 1000);
    return currentTimeSec >= decoded.exp - bufferSeconds;
  } catch {
    return false;
  }
};

/**
 * Get the stored access token if valid
 */
export const getStoredAccessToken = async (): Promise<string | null> => {
  try {
    const token = await storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
    return token;
  } catch {
    return null;
  }
};
