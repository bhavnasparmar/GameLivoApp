import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LobbyState, Lobby } from '../../types/lobby';
import { Player } from '../../types/player';

const initialState: LobbyState = {
  currentLobby: null,
  publicLobbies: [],
  isLoading: false,
  error: null,
};

const lobbySlice = createSlice({
  name: 'lobby',
  initialState,
  reducers: {
    setCurrentLobby: (state, action: PayloadAction<Lobby>) => {
      state.currentLobby = action.payload;
    },
    clearCurrentLobby: state => {
      state.currentLobby = null;
    },
    updateLobbyPlayers: (state, action: PayloadAction<Player[]>) => {
      if (state.currentLobby) {
        state.currentLobby.players = action.payload;
      }
    },
    updateLobbyStatus: (state, action: PayloadAction<Lobby['status']>) => {
      if (state.currentLobby) {
        state.currentLobby.status = action.payload;
      }
    },
    setPublicLobbies: (state, action: PayloadAction<Lobby[]>) => {
      state.publicLobbies = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setCurrentLobby, clearCurrentLobby, updateLobbyPlayers, updateLobbyStatus, setPublicLobbies, setLoading, setError } = lobbySlice.actions;
export default lobbySlice.reducer;
