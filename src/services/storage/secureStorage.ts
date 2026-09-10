// ─── Secure Storage Service ───────────────────────────────────────────────────
// Uses react-native-keychain for sensitive data (tokens, passwords)
// Requires: yarn add react-native-keychain

import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE = 'com.gamelivo.app';

export const secureStorage = {
  set: async (key: string, value: string): Promise<void> => {
    await Keychain.setGenericPassword(key, value, {
      service: `${KEYCHAIN_SERVICE}.${key}`,
    });
  },

  get: async (key: string): Promise<string | null> => {
    const result = await Keychain.getGenericPassword({
      service: `${KEYCHAIN_SERVICE}.${key}`,
    });
    if (!result) return null;
    return result.password;
  },

  remove: async (key: string): Promise<void> => {
    await Keychain.resetGenericPassword({
      service: `${KEYCHAIN_SERVICE}.${key}`,
    });
  },
};
