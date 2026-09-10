// ─── Notification Service ─────────────────────────────────────────────────────
// Wraps @notifee/react-native or react-native-push-notification

export const notificationService = {
  requestPermission: async (): Promise<boolean> => {
    // TODO: implement with @notifee/react-native
    console.log('[Notifications] Request permission');
    return true;
  },

  displayLocal: async (title: string, body: string, data?: Record<string, string>): Promise<void> => {
    // TODO: implement with @notifee/react-native
    console.log('[Notifications] Display local:', { title, body, data });
  },

  setBadgeCount: async (count: number): Promise<void> => {
    // TODO: implement with @notifee/react-native
    console.log('[Notifications] Set badge:', count);
  },

  clearAll: async (): Promise<void> => {
    // TODO: implement with @notifee/react-native
    console.log('[Notifications] Clear all');
  },
};
