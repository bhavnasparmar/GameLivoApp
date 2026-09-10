import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { MatchState, Match, MatchResult } from '../../types/match';

const initialState: MatchState = {
  currentMatch: null,
  matchHistory: [],
  isLoading: false,
  error: null,
};

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    setCurrentMatch: (state, action: PayloadAction<Match>) => {
      state.currentMatch = action.payload;
    },
    updateMatchState: (state, action: PayloadAction<Partial<Match>>) => {
      if (state.currentMatch) {
        state.currentMatch = { ...state.currentMatch, ...action.payload };
      }
    },
    setCurrentPlayer: (state, action: PayloadAction<string>) => {
      if (state.currentMatch) {
        state.currentMatch.currentPlayerId = action.payload;
      }
    },
    setMatchResult: (state, action: PayloadAction<MatchResult>) => {
      if (state.currentMatch) {
        state.currentMatch.result = action.payload;
        state.currentMatch.status = 'completed';
      }
    },
    clearCurrentMatch: state => {
      state.currentMatch = null;
    },
    setMatchHistory: (state, action: PayloadAction<Match[]>) => {
      state.matchHistory = action.payload;
    },
  },
});

export const { setCurrentMatch, updateMatchState, setCurrentPlayer, setMatchResult, clearCurrentMatch, setMatchHistory } = matchSlice.actions;
export default matchSlice.reducer;
