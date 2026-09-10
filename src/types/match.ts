import { GameId, GameMode } from './game';
import { Player } from './player';

// ─── Match Types ─────────────────────────────────────────────────────────────

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'abandoned' | 'draw';

export interface MatchResult {
  winnerId: string | null;
  winnerName: string | null;
  scores: Record<string, number>; // playerId -> score
  ranks: Record<string, number>; // playerId -> rank
  duration: number; // seconds
  coinsEarned: Record<string, number>;
  xpEarned: Record<string, number>;
}

export interface Match {
  id: string;
  gameId: GameId;
  gameMode: GameMode;
  lobbyId: string;
  players: Player[];
  status: MatchStatus;
  currentPlayerId: string | null;
  turnNumber: number;
  startedAt: string;
  endedAt?: string;
  result?: MatchResult;
  // Generic game state — specific type per game engine
  gameState: Record<string, unknown>;
}

export interface MatchState {
  currentMatch: Match | null;
  matchHistory: Match[];
  isLoading: boolean;
  error: string | null;
}
