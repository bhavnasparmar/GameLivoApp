import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppNotification {
  id: string;
  type: 'game_invite' | 'friend_request' | 'reward' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  list: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
}

const initialState: NotificationState = {
  list: [],
  unreadCount: 0,
  isLoading: false,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<AppNotification[]>) => {
      state.list = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
    addNotification: (state, action: PayloadAction<AppNotification>) => {
      state.list.unshift(action.payload);
      if (!action.payload.isRead) state.unreadCount += 1;
    },
    markRead: (state, action: PayloadAction<string>) => {
      const n = state.list.find(n => n.id === action.payload);
      if (n && !n.isRead) {
        n.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead: state => {
      state.list.forEach(n => (n.isRead = true));
      state.unreadCount = 0;
    },
  },
});

export const { setNotifications, addNotification, markRead, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
