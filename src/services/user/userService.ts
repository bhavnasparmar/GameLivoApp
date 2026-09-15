import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../api/apiEndpoints';
import { UserProfile } from '../../types/user';

// Normalize backend user → frontend UserProfile shape
const normalizeProfile = (raw: any): UserProfile => {
  const user = raw?.user || raw?.data?.user || raw?.data || raw;
  const gamesPlayed = typeof user?.gameStats?.played === 'number' 
    ? user.gameStats.played 
    : (typeof user?.totalGamesPlayed === 'number' ? user.totalGamesPlayed : 0);
  const gamesWon = typeof user?.gameStats?.won === 'number'
    ? user.gameStats.won
    : (typeof user?.totalWins === 'number' ? user.totalWins : 0);
  const gamesLost = typeof user?.gameStats?.lost === 'number'
    ? user.gameStats.lost
    : (typeof user?.totalLosses === 'number' ? user.totalLosses : 0);
  const winRate = gamesPlayed > 0 
    ? Math.round((gamesWon / gamesPlayed) * 100) 
    : (typeof user?.winRate === 'number' ? user.winRate : 0);

  return {
    id: user?.id || user?._id || '',
    name: user?.name || user?.username || '',
    username: user?.username || '',
    mobile: user?.phone || user?.mobile || '',
    email: user?.email || '',
    avatar: user?.avatar || '',
    level: typeof user?.level === 'number' ? user.level : 1,
    xp: typeof user?.xp === 'number' ? user.xp : 0,
    coins: typeof user?.coins === 'number' ? user.coins : 1000,
    rank: typeof user?.rank === 'number' ? user.rank : 1,
    totalGamesPlayed: gamesPlayed,
    totalWins: gamesWon,
    totalLosses: gamesLost,
    winRate,
    referralCode: user?.referralCode || '',
    isOnline: user?.isOnline ?? true,
    lastSeen: user?.lastActive || user?.lastSeen || new Date().toISOString(),
    createdAt: user?.createdAt || new Date().toISOString(),
    bio: user?.bio || '',
    achievements: Array.isArray(user?.achievements) ? user.achievements : [],
    gameStats: Array.isArray(user?.gameStats) ? user.gameStats : [],
  };
};

export const userService = {
  getProfile: async (): Promise<UserProfile> => {
    const data = await apiClient.get<any>(API_ENDPOINTS.USER.PROFILE);
    return normalizeProfile(data);
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const raw = await apiClient.put<any>(API_ENDPOINTS.USER.UPDATE_PROFILE, data);
    return normalizeProfile(raw);
  },
};

export default userService;
