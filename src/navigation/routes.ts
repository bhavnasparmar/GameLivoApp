// ─── Route Name Constants ─────────────────────────────────────────────────────
// Use these instead of string literals to avoid typos

export const ROUTES = {
  // Root
  SPLASH: 'Splash',
  AUTH: 'Auth',
  MAIN: 'Main',

  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
  VERIFY_OTP: 'VerifyOTP',
  FORGOT_PASSWORD: 'ForgotPassword',
  RESET_PASSWORD: 'ResetPassword',

  // Main tabs
  GAME_HUB: 'GameHub',
  FRIENDS: 'Friends',
  PROFILE: 'Profile',
  REWARDS: 'Rewards',
  SETTINGS: 'Settings',

  // Ludo
  LUDO_HOME: 'LudoHome',
  LUDO_MODE: 'LudoMode',
  LUDO_LOBBY: 'LudoLobby',
  LUDO_GAME: 'LudoGame',
  LUDO_RESULT: 'LudoResult',

  // Chess
  CHESS_HOME: 'ChessHome',
  CHESS_MODE: 'ChessMode',
  CHESS_LOBBY: 'ChessLobby',
  CHESS_GAME: 'ChessGame',
  CHESS_RESULT: 'ChessResult',

  // Uno
  UNO_HOME: 'UnoHome',
  UNO_MODE: 'UnoMode',
  UNO_LOBBY: 'UnoLobby',
  UNO_GAME: 'UnoGame',
  UNO_RESULT: 'UnoResult',

  // Snake & Ladder
  SNAKE_LADDER_HOME: 'SnakeLadderHome',
  SNAKE_LADDER_MODE: 'SnakeLadderMode',
  SNAKE_LADDER_LOBBY: 'SnakeLadderLobby',
  SNAKE_LADDER_GAME: 'SnakeLadderGame',
  SNAKE_LADDER_RESULT: 'SnakeLadderResult',

  // Chidiya Udd
  CHIDIYA_HOME: 'ChidiyaHome',
  CHIDIYA_MODE: 'ChidiyaMode',
  CHIDIYA_LOBBY: 'ChidiyaLobby',
  CHIDIYA_GAME: 'ChidiyaGame',
  CHIDIYA_RESULT: 'ChidiyaResult',

  // Esto
  ESTO_HOME: 'EstoHome',
  ESTO_LOBBY: 'EstoLobby',
  ESTO_GAME: 'EstoGame',
  ESTO_RESULT: 'EstoResult',

  // Profile
  EDIT_PROFILE: 'EditProfile',
  MATCH_HISTORY: 'MatchHistory',
  ACHIEVEMENTS: 'Achievements',
  LEADERBOARD: 'Leaderboard',

  // Friends
  FRIENDS_LIST: 'FriendsList',
  FRIEND_REQUESTS: 'FriendRequests',
  FIND_FRIENDS: 'FindFriends',
  FRIEND_PROFILE: 'FriendProfile',

  // Rewards
  COINS: 'Coins',
  REFERRAL: 'Referral',
  TRANSACTIONS: 'Transactions',

  // Settings
  PRIVACY_SECURITY: 'PrivacySecurity',
  PERMISSIONS: 'Permissions',
  DATA_SAFETY: 'DataSafety',
  TERMS: 'Terms',
  PRIVACY_POLICY: 'PrivacyPolicy',

  // Support
  HELP_SUPPORT: 'HelpSupport',
  CONTACT_US: 'ContactUs',
  REPORT_PROBLEM: 'ReportProblem',
  REPORT_PLAYER: 'ReportPlayer',

  // Chat
  CHAT_LIST: 'ChatList',
  CHAT_ROOM: 'ChatRoom',

  // Notifications
  NOTIFICATIONS: 'Notifications',
} as const;

export type RouteName = typeof ROUTES[keyof typeof ROUTES];
