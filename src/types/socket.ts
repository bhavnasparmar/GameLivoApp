// ─── Socket Types ─────────────────────────────────────────────────────────

export type SocketStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'error';

export interface SocketError {
  code: string;
  message: string;
}

// Generic socket event payload
export interface SocketPayload<T = unknown> {
  event: string;
  data: T;
  timestamp: number;
}

// Lobby socket payloads
export interface LobbyJoinPayload {
  lobbyId: string;
  userId: string;
}

export interface LobbyUpdatePayload {
  lobbyId: string;
  players: string[];
  status: string;
}

// Game socket payloads
export interface GameMovePayload {
  matchId: string;
  playerId: string;
  move: Record<string, unknown>;
}

export interface GameStatePayload {
  matchId: string;
  state: Record<string, unknown>;
  currentPlayerId: string;
  turnNumber: number;
}

// Chat socket payloads
export interface ChatMessagePayload {
  roomId: string;
  senderId: string;
  message: string;
  timestamp: number;
}

// Friend socket payloads
export interface FriendStatusPayload {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}
