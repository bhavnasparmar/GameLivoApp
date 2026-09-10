// ─── API Endpoints ───────────────────────────────────────────────────────────

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    SEND_OTP: '/auth/otp/send',
    VERIFY_OTP: '/auth/otp/verify',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // User
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    AVATAR: '/user/avatar',
    STATS: '/user/stats',
    ACHIEVEMENTS: '/user/achievements',
    MATCH_HISTORY: '/user/match-history',
  },

  // Games
  GAME: {
    LIST: '/games',
    DETAIL: (gameId: string) => `/games/${gameId}`,
  },

  // Lobby
  LOBBY: {
    CREATE: '/lobby/create',
    JOIN: (code: string) => `/lobby/join/${code}`,
    LEAVE: (lobbyId: string) => `/lobby/${lobbyId}/leave`,
    DETAIL: (lobbyId: string) => `/lobby/${lobbyId}`,
    PUBLIC_LIST: '/lobby/public',
  },

  // Match
  MATCH: {
    DETAIL: (matchId: string) => `/match/${matchId}`,
    HISTORY: '/match/history',
  },

  // Friends
  FRIENDS: {
    LIST: '/friends',
    REQUESTS: '/friends/requests',
    SEND_REQUEST: '/friends/request',
    ACCEPT: (requestId: string) => `/friends/request/${requestId}/accept`,
    DECLINE: (requestId: string) => `/friends/request/${requestId}/decline`,
    REMOVE: (friendId: string) => `/friends/${friendId}`,
    SEARCH: '/friends/search',
  },

  // Leaderboard
  LEADERBOARD: {
    GLOBAL: '/leaderboard/global',
    GAME: (gameId: string) => `/leaderboard/${gameId}`,
    FRIENDS: '/leaderboard/friends',
  },

  // Rewards
  REWARDS: {
    LIST: '/rewards',
    CLAIM: (rewardId: string) => `/rewards/${rewardId}/claim`,
    REFERRAL: '/rewards/referral',
    TRANSACTIONS: '/rewards/transactions',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },

  // Support
  SUPPORT: {
    SUBMIT: '/support/ticket',
    REPORT_PLAYER: '/support/report-player',
  },
} as const;
