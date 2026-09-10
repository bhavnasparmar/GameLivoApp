import { Vibration } from 'react-native';

// ─── Vibration Service ────────────────────────────────────────────────────────

type VibrationPattern = 'tap' | 'success' | 'error' | 'dice_roll';

const patterns: Record<VibrationPattern, number | number[]> = {
  tap: 50,
  success: [0, 80, 60, 80],
  error: [0, 200, 100, 200],
  dice_roll: [0, 50, 30, 50, 30, 50],
};

let _vibrationEnabled = true;

export const vibrationService = {
  setEnabled: (enabled: boolean): void => {
    _vibrationEnabled = enabled;
  },

  isEnabled: (): boolean => _vibrationEnabled,

  vibrate: (pattern: VibrationPattern = 'tap'): void => {
    if (!_vibrationEnabled) return;
    const p = patterns[pattern];
    if (Array.isArray(p)) {
      Vibration.vibrate(p);
    } else {
      Vibration.vibrate(p);
    }
  },

  cancel: (): void => {
    Vibration.cancel();
  },
};
