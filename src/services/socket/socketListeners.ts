import { socketService } from './socketService';
import { SOCKET_EVENTS } from './socketEvents';
import { AppDispatch } from '../../redux/store';
import { GameStatePayload, ChatMessagePayload, FriendStatusPayload } from './socketTypes';
// Import slice actions as needed:
// import { updateGameState } from '../../redux/slices/matchSlice';
// import { receiveMessage } from '../../redux/slices/chatSlice';
// import { updateFriendStatus } from '../../redux/slices/friendSlice';

// ─── Socket Listeners ─────────────────────────────────────────────────────────
// Called once after socket connects — registers all global event handlers
// and dispatches Redux actions.

export const registerSocketListeners = (dispatch: AppDispatch): void => {
  // ── Game listeners ─────────────────────────────────────────────────────
  socketService.on<GameStatePayload>(SOCKET_EVENTS.GAME_STATE, payload => {
    console.log('[Socket] Game state update:', payload.matchId);
    // dispatch(updateGameState(payload));
  });

  socketService.on<{ matchId: string }>(SOCKET_EVENTS.GAME_END, payload => {
    console.log('[Socket] Game ended:', payload.matchId);
    // dispatch(endMatch(payload));
  });

  socketService.on<{ playerId: string }>(SOCKET_EVENTS.GAME_TURN, payload => {
    console.log('[Socket] Turn changed to:', payload.playerId);
    // dispatch(setCurrentPlayer(payload.playerId));
  });

  // ── Chat listeners ─────────────────────────────────────────────────────
  socketService.on<ChatMessagePayload>(SOCKET_EVENTS.CHAT_MESSAGE, payload => {
    console.log('[Socket] Chat message from:', payload.senderId);
    // dispatch(receiveMessage(payload));
  });

  // ── Friend listeners ───────────────────────────────────────────────────
  socketService.on<FriendStatusPayload>(SOCKET_EVENTS.FRIEND_ONLINE, payload => {
    console.log('[Socket] Friend online:', payload.userId);
    // dispatch(updateFriendStatus({ userId: payload.userId, isOnline: true }));
  });

  socketService.on<FriendStatusPayload>(SOCKET_EVENTS.FRIEND_OFFLINE, payload => {
    console.log('[Socket] Friend offline:', payload.userId);
    // dispatch(updateFriendStatus({ userId: payload.userId, isOnline: false }));
  });
};

export const unregisterSocketListeners = (): void => {
  socketService.off(SOCKET_EVENTS.GAME_STATE);
  socketService.off(SOCKET_EVENTS.GAME_END);
  socketService.off(SOCKET_EVENTS.GAME_TURN);
  socketService.off(SOCKET_EVENTS.CHAT_MESSAGE);
  socketService.off(SOCKET_EVENTS.FRIEND_ONLINE);
  socketService.off(SOCKET_EVENTS.FRIEND_OFFLINE);
};
