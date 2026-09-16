// ─── Navigation Param Lists ───────────────────────────────────────────────────

import { GameId } from '../types/game';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyOTP: {
    mobile?: string;
    email?: string;
    type: 'register' | 'login' | 'forgot_password';
  };
  ForgotPassword: undefined;
  ResetPassword: { mobile: string; otp: string };
};

export type MainTabParamList = {
  GameHub: undefined;
  Friends: undefined;
  Profile: undefined;
  Rewards: undefined;
  Settings: undefined;
};

export type GameStackParamList = {
  // Ludo
  LudoHome: undefined;
  LudoMode: undefined;
  LudoLobby: { lobbyId?: string; isHost: boolean };
  LudoGame: { matchId: string };
  LudoResult: { matchId: string };

  // Chess
  ChessHome: undefined;
  ChessMode: { initialMode?: 'computer' | 'local' | 'rules' } | undefined;
  ChessLobby: { lobbyId?: string; isHost?: boolean; mode?: 'private' | 'random' } | undefined;
  ChessGame: { matchId?: string; mode?: string; difficulty?: string; timeSeconds?: number; autoFlip?: boolean; whitePlayer?: string; blackPlayer?: string };
  ChessResult: { matchId?: string; gameState?: any; mode?: string; difficulty?: string };

  // Uno
  UnoHome: undefined;
  UnoMode: { initialMode?: 'computer' | 'rules' } | undefined;
  UnoLobby: { lobbyId?: string; isHost?: boolean; mode?: 'private' | 'random' } | undefined;
  UnoGame: { matchId?: string; mode?: any; difficulty?: any; playerCount?: 2 | 4; timeSeconds?: number; player1Name?: string; player2Name?: string };
  UnoResult: { matchId?: string; gameState?: any; winnerId?: string; mode?: any; difficulty?: any };

  // Snake & Ladder
  SnakeLadderHome: undefined;
  SnakeLadderMode: undefined;
  SnakeLadderLobby: { lobbyId?: string; isHost: boolean };
  SnakeLadderGame: { matchId: string };
  SnakeLadderResult: { matchId: string };

  // Chidiya Udd
  ChidiyaHome: undefined;
  ChidiyaLobby: { lobbyId?: string; isHost: boolean };
  ChidiyaGame: { matchId: string };
  ChidiyaResult: { matchId: string };

  // Esto
  EstoHome: undefined;
  EstoLobby: { lobbyId?: string; isHost: boolean };
  EstoGame: { matchId: string };
  EstoResult: { matchId: string };
};

export type ProfileStackParamList = {
  Profile: { userId?: string };
  EditProfile: undefined;
  MatchHistory: undefined;
  Achievements: undefined;
  Leaderboard: { gameId?: GameId };
};

export type FriendsStackParamList = {
  FriendsList: undefined;
  FriendRequests: undefined;
  FindFriends: undefined;
  FriendProfile: { userId: string };
};

export type RewardsStackParamList = {
  Rewards: undefined;
  Coins: undefined;
  Referral: undefined;
  Transactions: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
  PrivacySecurity: undefined;
  Permissions: undefined;
  DataSafety: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
};

export type SupportStackParamList = {
  HelpSupport: undefined;
  ContactUs: undefined;
  ReportProblem: undefined;
  ReportPlayer: { userId: string; matchId?: string };
};

export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { roomId: string; participantName: string };
};

export type NotificationsStackParamList = {
  Notifications: undefined;
};
