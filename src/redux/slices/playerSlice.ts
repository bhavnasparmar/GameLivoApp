import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlayerState, Player } from '../../types/player';

const initialState: PlayerState = {
  players: [],
  currentPlayerId: null,
  isLoading: false,
  error: null,
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setPlayers: (state, action: PayloadAction<Player[]>) => {
      state.players = action.payload;
    },
    addPlayer: (state, action: PayloadAction<Player>) => {
      const exists = state.players.find(p => p.id === action.payload.id);
      if (!exists) state.players.push(action.payload);
    },
    removePlayer: (state, action: PayloadAction<string>) => {
      state.players = state.players.filter(p => p.id !== action.payload);
    },
    updatePlayer: (state, action: PayloadAction<Partial<Player> & { id: string }>) => {
      const idx = state.players.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) {
        state.players[idx] = { ...state.players[idx], ...action.payload };
      }
    },
    setCurrentPlayerId: (state, action: PayloadAction<string | null>) => {
      state.currentPlayerId = action.payload;
    },
    clearPlayers: state => {
      state.players = [];
      state.currentPlayerId = null;
    },
  },
});

export const { setPlayers, addPlayer, removePlayer, updatePlayer, setCurrentPlayerId, clearPlayers } = playerSlice.actions;
export default playerSlice.reducer;
