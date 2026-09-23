// ─── Download Slice ───────────────────────────────────────────────────────────
// Redux state for per-game asset download status and progress.
// UI components read from here; GameDownloadManager writes to AsyncStorage
// and dispatches these actions.

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameId } from '../../types/game';
import { GameAssetState } from '../../types/gameModule';

// ─── State ────────────────────────────────────────────────────────────────────

export interface DownloadEntry {
  state: GameAssetState;
  /** 0–100 */
  progress: number;
  errorMessage?: string;
}

export type DownloadState = {
  games: Partial<Record<GameId, DownloadEntry>>;
};

const initialState: DownloadState = {
  games: {},
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const downloadSlice = createSlice({
  name: 'download',
  initialState,
  reducers: {
    setGameAssetState(
      state,
      action: PayloadAction<{ gameId: GameId; assetState: GameAssetState }>,
    ) {
      const { gameId, assetState } = action.payload;
      if (!state.games[gameId]) {
        state.games[gameId] = { state: assetState, progress: 0 };
      } else {
        state.games[gameId]!.state = assetState;
      }
      // Reset progress when not downloading
      if (assetState !== GameAssetState.DOWNLOADING) {
        state.games[gameId]!.progress =
          assetState === GameAssetState.READY ? 100 : 0;
      }
    },

    setGameDownloadProgress(
      state,
      action: PayloadAction<{ gameId: GameId; progress: number }>,
    ) {
      const { gameId, progress } = action.payload;
      if (!state.games[gameId]) {
        state.games[gameId] = { state: GameAssetState.DOWNLOADING, progress };
      } else {
        state.games[gameId]!.progress = progress;
        state.games[gameId]!.state = GameAssetState.DOWNLOADING;
      }
    },

    setGameAssetError(
      state,
      action: PayloadAction<{ gameId: GameId; message: string }>,
    ) {
      const { gameId, message } = action.payload;
      state.games[gameId] = {
        state: GameAssetState.ERROR,
        progress: 0,
        errorMessage: message,
      };
    },

    initGamesAssetState(
      state,
      action: PayloadAction<Partial<Record<GameId, GameAssetState>>>,
    ) {
      Object.entries(action.payload).forEach(([gameId, assetState]) => {
        const gid = gameId as GameId;
        state.games[gid] = {
          state: assetState!,
          progress: assetState === GameAssetState.READY ? 100 : 0,
        };
      });
    },
  },
});

export const {
  setGameAssetState,
  setGameDownloadProgress,
  setGameAssetError,
  initGamesAssetState,
} = downloadSlice.actions;

export default downloadSlice.reducer;
