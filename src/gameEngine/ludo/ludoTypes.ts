import { BaseGameEngine } from '../common/gameTypes';

// ─── Ludo Player Colors (Supports up to 6 players) ───────────────────────────
export type LudoPlayerColor = 'red' | 'green' | 'yellow' | 'blue' | 'orange' | 'purple';

export type TokenStatus = 'home' | 'active' | 'finished';

export type LudoGameMode = 'computer' | 'quick_match' | 'private' | 'local';
export type LudoDifficulty = 'easy' | 'medium' | 'hard';
export type LudoBoardType = '4player' | '5player' | '6player';

export interface LudoToken {
  id: string; // e.g. 'red_0', 'red_1'
  color: LudoPlayerColor;
  tokenIndex: number; // 0, 1, 2, 3
  position: number; // -1 = home base yard, 0-51 / 0-71 = main track, 52-56 / 72-76 = home stretch, 57 / 77 = center home finished
  stepCount: number; // 0 = at start position, up to 56 / 76, 57 / 77 = finished
  status: TokenStatus;
}

export interface LudoPlayer {
  id: string;
  name: string;
  avatar: string;
  color: LudoPlayerColor;
  seatIndex: number;
  isBot: boolean;
  isHost?: boolean;
  tokens: LudoToken[];
  isFinished: boolean;
  rank?: number; // 1 = 1st place, 2 = 2nd place, etc.
  consecutiveSixes: number;
  rating?: number;
}

export interface LudoGameState {
  matchId: string;
  mode: LudoGameMode;
  boardType: LudoBoardType;
  playerCount: number;
  players: LudoPlayer[];
  currentPlayerId: string;
  currentDiceValue: number | null;
  diceRolled: boolean;
  canRoll: boolean;
  consecutiveSixes: number;
  finishedPlayers: string[]; // List of player IDs in order of finishing
  turnNumber: number;
  turnTimeSeconds: number;
  isGameOver: boolean;
  winnerId?: string;
  lastActionText?: string;
  lastActionType?: 'roll' | 'move' | 'capture' | 'home' | 'bonus' | 'penalty_three_sixes';
  stake?: number;
  prizePool?: number;
}

export interface LudoMove {
  tokenId: string;
  fromPosition: number;
  toPosition: number;
  fromStepCount: number;
  toStepCount: number;
  isOpening?: boolean;
  isFinished?: boolean;
  capturedTokenId?: string;
  extraTurnAwarded?: boolean;
}

export type LudoEngine = BaseGameEngine<LudoGameState, LudoMove>;
