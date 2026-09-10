// ─── Sound Service ────────────────────────────────────────────────────────────
// Wraps react-native-sound or expo-av

export type SoundKey = 'dice_roll' | 'token_move' | 'game_win' | 'game_lose' | 'button_tap' | 'card_flip' | 'notification' | 'timer_tick' | 'chat_message';

const soundPaths: Record<SoundKey, string> = {
  dice_roll: 'dice_roll.mp3',
  token_move: 'token_move.mp3',
  game_win: 'game_win.mp3',
  game_lose: 'game_lose.mp3',
  button_tap: 'button_tap.mp3',
  card_flip: 'card_flip.mp3',
  notification: 'notification.mp3',
  timer_tick: 'timer_tick.mp3',
  chat_message: 'chat_message.mp3',
};

let _soundEnabled = true;

export const soundService = {
  setEnabled: (enabled: boolean): void => {
    _soundEnabled = enabled;
  },

  isEnabled: (): boolean => _soundEnabled,

  play: (key: SoundKey): void => {
    if (!_soundEnabled) return;
    // TODO: implement with react-native-sound
    console.log('[Sound] Play:', soundPaths[key]);
  },

  stop: (key: SoundKey): void => {
    // TODO: implement stop
    console.log('[Sound] Stop:', soundPaths[key]);
  },
};
