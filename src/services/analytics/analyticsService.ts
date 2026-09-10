// ─── Analytics Service ────────────────────────────────────────────────────────
// Wraps Firebase Analytics or Mixpanel

export type AnalyticsEvent =
  | 'login'
  | 'register'
  | 'logout'
  | 'game_started'
  | 'game_ended'
  | 'lobby_created'
  | 'lobby_joined'
  | 'friend_added'
  | 'reward_claimed'
  | 'referral_used';

export const analyticsService = {
  logEvent: (event: AnalyticsEvent, params?: Record<string, unknown>): void => {
    // TODO: implement with @react-native-firebase/analytics
    console.log('[Analytics] Event:', event, params);
  },

  setUserId: (userId: string): void => {
    // TODO: FirebaseAnalytics.setUserId(userId)
    console.log('[Analytics] Set user ID:', userId);
  },

  setUserProperty: (key: string, value: string): void => {
    // TODO: FirebaseAnalytics.setUserProperty(key, value)
    console.log('[Analytics] Set property:', key, value);
  },

  logScreen: (screenName: string): void => {
    // TODO: FirebaseAnalytics.logScreenView({ screen_name: screenName })
    console.log('[Analytics] Screen:', screenName);
  },
};
