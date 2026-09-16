import { Vibration, Platform } from 'react-native';

// ─── Safe Vibration Service ───────────────────────────────────────────────────

export type VibrationPattern = 'tap' | 'success' | 'error' | 'dice_roll';

const patterns: Record<VibrationPattern, number | number[]> = {
  tap: 40,
  success: [0, 80, 50, 80],
  error: [0, 150, 80, 150],
  dice_roll: [0, 40, 30, 40, 30, 40],
};

let _vibrationEnabled = true;

export const vibrationService = {
  setEnabled: (enabled: boolean): void => {
    _vibrationEnabled = enabled;
  },

  isEnabled: (): boolean => _vibrationEnabled,

  vibrate: (pattern: VibrationPattern = 'tap'): void => {
    if (!_vibrationEnabled) return;
    try {
      const p = patterns[pattern] || 40;
      if (Array.isArray(p)) {
        Vibration.vibrate(p);
      } else {
        Vibration.vibrate(p);
      }
    } catch (e) {
      // Graceful fallback if device/emulator doesn't support vibration
    }
  },

  vibrateSuccess: (): void => {
    vibrationService.vibrate('success');
  },

  vibrateError: (): void => {
    vibrationService.vibrate('error');
  },

  vibrateTap: (): void => {
    vibrationService.vibrate('tap');
  },

  vibrateDiceRoll: (): void => {
    vibrationService.vibrate('dice_roll');
  },

  cancel: (): void => {
    try {
      Vibration.cancel();
    } catch (e) {
      // Safe fallback
    }
  },
};
