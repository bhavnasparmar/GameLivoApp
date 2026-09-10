import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameState, Game, GameMode } from '../../types/game';
import { GAMES } from '../../constants/gameConstants';

const initialState: GameState = {
  selectedGame: null,
  availableGames: GAMES,
  gameMode: 'classic',
  isLoading: false,
  error: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    selectGame: (state, action: PayloadAction<Game>) => {
      state.selectedGame = action.payload;
    },
    clearSelectedGame: state => {
      state.selectedGame = null;
    },
    setGameMode: (state, action: PayloadAction<GameMode>) => {
      state.gameMode = action.payload;
    },
    setAvailableGames: (state, action: PayloadAction<Game[]>) => {
      state.availableGames = action.payload;
    },
  },
});

export const { selectGame, clearSelectedGame, setGameMode, setAvailableGames } = gameSlice.actions;
export default gameSlice.reducer;
