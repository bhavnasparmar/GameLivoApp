// ─── Multiplayer Types ────────────────────────────────────────────────────────
// Shared types used by MultiplayerService and game screens.

import { GameId } from './game';

// ─── Room ─────────────────────────────────────────────────────────────────────

export type RoomStatus =
  | 'waiting'
  | 'ready'
  | 'starting'
  | 'in_progress'
  | 'finished'
  | 'abandoned';

export interface RoomPlayer {
  userId: string;
  username: string;
  avatar?: string;
  isReady: boolean;
  isHost: boolean;
  isConnected: boolean;
  /** Seat / colour index for board games */
  seatIndex: number;
}

export interface GameRoom {
  roomId: string;
  gameId: GameId;
  hostId: string;
  players: RoomPlayer[];
  maxPlayers: number;
  status: RoomStatus;
  isPrivate: boolean;
  inviteCode?: string;
  createdAt: number;
}

// ─── Turn Management ──────────────────────────────────────────────────────────

export interface TurnState {
  currentPlayerId: string;
  turnIndex: number;
  /** Remaining seconds for this turn */
  timeRemaining: number;
  /** Maximum seconds allowed per turn */
  timeLimit: number;
}

// ─── Game Action ──────────────────────────────────────────────────────────────

export interface GameAction {
  type: string;
  payload: unknown;
  playerId: string;
  timestamp: number;
  /** Sequence number for ordering */
  seq: number;
}

// ─── Match Result ─────────────────────────────────────────────────────────────

export interface PlayerResult {
  userId: string;
  rank: number;
  score: number;
  coinsEarned: number;
  isWinner: boolean;
}

export interface MatchResult {
  roomId: string;
  gameId: GameId;
  players: PlayerResult[];
  duration: number;
  completedAt: number;
  /** Server-validated; never trust client result for coins/leaderboard */
  isServerValidated: boolean;
}

// ─── Reconnection ─────────────────────────────────────────────────────────────

export interface ReconnectionState {
  roomId: string;
  gameId: GameId;
  /** Full game state snapshot from the server */
  gameState: unknown;
  turnState: TurnState;
}

// ─── Multiplayer Service Events ───────────────────────────────────────────────

export type MultiplayerEventMap = {
  'player:joined': RoomPlayer;
  'player:left': { userId: string };
  'player:ready': { userId: string; isReady: boolean };
  'room:status': RoomStatus;
  'game:state': unknown;
  'game:action': GameAction;
  'game:result': MatchResult;
  'turn:update': TurnState;
  'reconnect:snapshot': ReconnectionState;
  'error': { code: string; message: string };
};
