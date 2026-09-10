import { socketService } from './socketService';
import { registerSocketListeners, unregisterSocketListeners } from './socketListeners';
import { AppDispatch } from '../../redux/store';

// ─── Socket Manager ───────────────────────────────────────────────────────────
// High-level manager — called from App.tsx or auth slice

export const socketManager = {
  initialize: async (dispatch: AppDispatch): Promise<void> => {
    await socketService.connect();
    registerSocketListeners(dispatch);
  },

  teardown: (): void => {
    unregisterSocketListeners();
    socketService.disconnect();
  },
};
