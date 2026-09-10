import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '../../theme/index';

interface SettingsState {
  theme: ThemeMode;
  language: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsEnabled: boolean;
  gameInvitesEnabled: boolean;
  friendRequestsEnabled: boolean;
}

const initialState: SettingsState = {
  theme: 'system',
  language: 'en',
  soundEnabled: true,
  vibrationEnabled: true,
  notificationsEnabled: true,
  gameInvitesEnabled: true,
  friendRequestsEnabled: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    toggleSound: state => {
      state.soundEnabled = !state.soundEnabled;
    },
    toggleVibration: state => {
      state.vibrationEnabled = !state.vibrationEnabled;
    },
    toggleNotifications: state => {
      state.notificationsEnabled = !state.notificationsEnabled;
    },
    toggleGameInvites: state => {
      state.gameInvitesEnabled = !state.gameInvitesEnabled;
    },
    toggleFriendRequests: state => {
      state.friendRequestsEnabled = !state.friendRequestsEnabled;
    },
    restoreSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const { setTheme, setLanguage, toggleSound, toggleVibration, toggleNotifications, toggleGameInvites, toggleFriendRequests, restoreSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
