// ─── User Types ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  username: string;
  mobile: string;
  email?: string;
  avatar?: string;
  level: number;
  xp: number;
  coins: number;
  rank: number;
  totalGamesPlayed: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  referralCode: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
}

export interface UserProfile extends User {
  bio?: string;
  achievements: Achievement[];
  gameStats: GameStat[];
  socialLinks?: SocialLinks;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface GameStat {
  gameId: string;
  gameName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  highScore: number;
  rank: number;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
}

export interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}
