// ─── MultiplayerService ───────────────────────────────────────────────────────
// High-level multiplayer abstraction over the existing socketService.
// Games call this — never use socketService directly for game logic.

import { socketService } from '../../services/socket/socketService';
import { SOCKET_EVENTS } from '../../services/socket/socketEvents';
import { GameId } from '../../types/game';
import {
  GameRoom,
  GameAction,
  MatchResult,
  TurnState,
  RoomStatus,
  MultiplayerEventMap,
  ReconnectionState,
} from '../../types/multiplayer';

// ─── Event Listener Registry ─────────────────────────────────────────────────

type ListenerMap = {
  [K in keyof MultiplayerEventMap]?: Array<(data: MultiplayerEventMap[K]) => void>;
};

// ─── Service ─────────────────────────────────────────────────────────────────

class MultiplayerServiceClass {
  private listeners: ListenerMap = {};
  private currentRoomId: string | null = null;
  private currentGameId: GameId | null = null;

  // ─── Room Management ───────────────────────────────────────────────────────

  async createRoom(gameId: GameId, options?: { isPrivate?: boolean; maxPlayers?: number }): Promise<GameRoom> {
    this.currentGameId = gameId;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('createRoom timeout')), 10_000);

      socketService.on<GameRoom>('room:created', (room) => {
        clearTimeout(timeout);
        this.currentRoomId = room.roomId;
        resolve(room);
      });

      socketService.emit('room:create', {
        gameId,
        isPrivate: options?.isPrivate ?? false,
        maxPlayers: options?.maxPlayers,
      });
    });
  }

  async joinRoom(roomId: string): Promise<GameRoom> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('joinRoom timeout')), 10_000);

      socketService.on<GameRoom>('room:joined', (room) => {
        clearTimeout(timeout);
        this.currentRoomId = room.roomId;
        this.currentGameId = room.gameId;
        resolve(room);
      });

      socketService.on<{ code: string; message: string }>('error', (err) => {
        clearTimeout(timeout);
        reject(new Error(err.message));
      });

      socketService.emit('room:join', { roomId });
    });
  }

  leaveRoom(roomId?: string): void {
    const id = roomId ?? this.currentRoomId;
    if (id) {
      socketService.emit('room:leave', { roomId: id });
    }
    this.currentRoomId = null;
    this.currentGameId = null;
  }

  invitePlayer(userId: string): void {
    if (!this.currentRoomId) return;
    socketService.emit('room:invite', { roomId: this.currentRoomId, userId });
  }

  setReady(isReady: boolean): void {
    if (!this.currentRoomId) return;
    socketService.emit('player:ready', { roomId: this.currentRoomId, isReady });
  }

  // ─── Game Actions ──────────────────────────────────────────────────────────

  /**
   * Send a game action to the server.
   * Server validates and broadcasts to all players.
   * NEVER trust client results for coins/leaderboard.
   */
  sendGameAction(action: Omit<GameAction, 'timestamp' | 'seq'>): void {
    if (!this.currentRoomId) {
      console.warn('[MultiplayerService] sendGameAction called without a room');
      return;
    }
    socketService.emit(SOCKET_EVENTS.GAME_ACTION ?? 'game:action', {
      ...action,
      roomId: this.currentRoomId,
      timestamp: Date.now(),
    });
  }

  // ─── Event Subscriptions ───────────────────────────────────────────────────

  on<K extends keyof MultiplayerEventMap>(
    event: K,
    handler: (data: MultiplayerEventMap[K]) => void,
  ): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];

      // Bind to socket once per event type
      socketService.on(event, (data: any) => {
        this.listeners[event]?.forEach(h => h(data));
      });
    }

    (this.listeners[event] as any[]).push(handler);

    // Return unsubscribe function
    return () => {
      (this.listeners as any)[event] = ((this.listeners as any)[event] as any[])
        .filter((h: any) => h !== handler);
    };
  }

  onGameStateUpdate(handler: (state: unknown) => void): () => void {
    return this.on('game:state', handler);
  }

  onPlayerJoined(handler: (player: MultiplayerEventMap['player:joined']) => void): () => void {
    return this.on('player:joined', handler);
  }

  onPlayerLeft(handler: (data: MultiplayerEventMap['player:left']) => void): () => void {
    return this.on('player:left', handler);
  }

  onTurnUpdate(handler: (turn: TurnState) => void): () => void {
    return this.on('turn:update', handler);
  }

  onMatchResult(handler: (result: MatchResult) => void): () => void {
    return this.on('game:result', handler);
  }

  onReconnect(handler: (snapshot: ReconnectionState) => void): () => void {
    return this.on('reconnect:snapshot', handler);
  }

  onRoomStatus(handler: (status: RoomStatus) => void): () => void {
    return this.on('room:status', handler);
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Remove ALL multiplayer listeners and leave the room.
   * Call this in game cleanup / useEffect return.
   */
  cleanup(): void {
    const events = Object.keys(this.listeners) as Array<keyof MultiplayerEventMap>;
    events.forEach(event => {
      socketService.off(event);
    });
    this.listeners = {};

    if (this.currentRoomId) {
      this.leaveRoom();
    }
  }

  get roomId(): string | null {
    return this.currentRoomId;
  }

  get gameId(): GameId | null {
    return this.currentGameId;
  }
}

// Singleton
export const MultiplayerService = new MultiplayerServiceClass();
