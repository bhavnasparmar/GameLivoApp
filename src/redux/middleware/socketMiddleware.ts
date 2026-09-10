import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../store';

// ─── Socket Middleware ────────────────────────────────────────────────────────
// Intercepts Redux actions that should trigger socket emissions.
// This keeps socket logic out of components and thunks.

export const socketMiddleware: Middleware<Record<string, never>, RootState> =
  _store => next => action => {
    // Example: intercept GAME_MOVE action and emit over socket
    // if (action.type === 'match/sendMove') {
    //   socketService.emit(SOCKET_EVENTS.GAME_MOVE, action.payload);
    // }

    return next(action);
  };
