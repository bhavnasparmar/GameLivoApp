import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Storage Service ──────────────────────────────────────────────────────────

export const storageService = {
  set: async <T>(key: string, value: T): Promise<void> => {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
  },

  get: async <T>(key: string): Promise<T | null> => {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  },

  remove: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },

  clear: async (): Promise<void> => {
    await AsyncStorage.clear();
  },

  multiGet: async <T>(keys: string[]): Promise<Record<string, T | null>> => {
    const pairs = await AsyncStorage.multiGet(keys);
    const result: Record<string, T | null> = {};
    pairs.forEach(([key, value]) => {
      result[key] = value ? JSON.parse(value) : null;
    });
    return result;
  },
};
