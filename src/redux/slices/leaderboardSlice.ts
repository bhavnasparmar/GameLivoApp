import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/user';
import { GameId } from '../../types/game';

interface LeaderboardEntry extends User {
  rank: number;
  score: number;
  gameId?: GameId;
}

interface LeaderboardState {
  global: LeaderboardEntry[];
  byGame: Record<string, LeaderboardEntry[]>;
  friends: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  global: [],
  byGame: {},
  friends: [],
  isLoading: false,
  error: null,
};

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setGlobalLeaderboard: (state, action: PayloadAction<LeaderboardEntry[]>) => {
      state.global = action.payload;
    },
    setGameLeaderboard: (state, action: PayloadAction<{ gameId: string; entries: LeaderboardEntry[] }>) => {
      state.byGame[action.payload.gameId] = action.payload.entries;
    },
    setFriendsLeaderboard: (state, action: PayloadAction<LeaderboardEntry[]>) => {
      state.friends = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setGlobalLeaderboard, setGameLeaderboard, setFriendsLeaderboard, setLoading, setError } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
