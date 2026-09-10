// ─── Player Types ─────────────────────────────────────────────────────────

export type PlayerColor = 'red' | 'green' | 'blue' | 'yellow';

export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'disconnected' | 'finished';

export interface Player {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  color?: PlayerColor;
  status: PlayerStatus;
  isHost: boolean;
  isBot: boolean;
  score: number;
  rank?: number;
  isCurrentTurn: boolean;
}

export interface PlayerState {
  players: Player[];
  currentPlayerId: string | null;
  isLoading: boolean;
  error: string | null;
}
