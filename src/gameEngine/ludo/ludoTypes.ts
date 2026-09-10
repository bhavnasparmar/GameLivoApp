import { BaseGameEngine } from '../common/gameTypes';

// ─── Ludo Types ───────────────────────────────────────────────────────────────

export type LudoPlayerColor = 'red' | 'green' | 'blue' | 'yellow';

export type TokenStatus = 'home' | 'active' | 'finished';

export interface LudoToken {
  id: string; // e.g. 'red_0', 'red_1'
  color: LudoPlayerColor;
  position: number; // -1 = home, 0-56 = board path, 57 = finished
  status: TokenStatus;
}

export interface LudoPlayer {
  id: string;
  color: LudoPlayerColor;
  tokens: LudoToken[];
  isFinished: boolean;
  rank?: number;
}

export interface LudoGameState {
  players: LudoPlayer[];
  currentPlayerId: string;
  currentDiceValue: number | null;
  diceRolled: boolean;
  consecutiveSixes: number;
  finishedPlayers: string[];
  turnNumber: number;
}

export interface LudoMove {
  tokenId: string;
  fromPosition: number;
  toPosition: number;
}

export type LudoEngine = BaseGameEngine<LudoGameState, LudoMove>;
