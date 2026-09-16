// ─── Uno Types & Interfaces ────────────────────────────────────────────────────

export type UnoColor = 'red' | 'green' | 'blue' | 'yellow' | 'wild';

export type UnoActiveColor = 'red' | 'green' | 'blue' | 'yellow';

export type UnoCardValue =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'wild'
  | 'wild_draw4';

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: UnoCardValue;
  scoreValue: number;
}

export interface UnoPlayer {
  id: string;
  name: string;
  avatar?: string;
  isBot: boolean;
  hand: UnoCard[];
  hasCalledUno: boolean;
  unoCallTimestamp?: number;
  score: number;
  isHost?: boolean;
}

export type UnoDifficulty = 'easy' | 'medium' | 'hard';
export type UnoGameMode = 'computer' | 'local' | 'random' | 'private';

export interface UnoMove {
  type: 'play_card' | 'draw_card' | 'pass_turn' | 'call_uno' | 'catch_uno';
  cardId?: string;
  chosenColor?: UnoActiveColor; // Required for wild and wild_draw4
  targetPlayerId?: string; // For catch_uno
}

export interface UnoActionLog {
  id: string;
  playerId: string;
  playerName: string;
  actionText: string;
  card?: UnoCard;
  color?: UnoActiveColor;
  timestamp: number;
}

export interface UnoGameState {
  matchId: string;
  mode: UnoGameMode;
  difficulty: UnoDifficulty;
  players: UnoPlayer[];
  deck: UnoCard[];
  discardPile: UnoCard[];
  currentPlayerIndex: number;
  currentPlayerId: string;
  direction: 1 | -1; // 1 = clockwise, -1 = counter-clockwise
  topCard: UnoCard;
  activeColor: UnoActiveColor;
  pendingDrawCount: number; // Stacks +2 or +4 if applicable
  turnNumber: number;
  turnTimeLeft: number;
  isDrawPhase: boolean; // True if current player just drew and can play or pass
  drawnCardId?: string; // ID of card drawn during current turn
  winnerId: string | null;
  roundOver: boolean;
  lastAction?: UnoActionLog;
  unoShoutGracePlayerId?: string; // Player who needs to call UNO before turn ends
}

export interface UnoTimePreset {
  id: string;
  label: string;
  seconds: number;
  tag: string;
}

export interface UnoBotConfig {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  difficulty: UnoDifficulty;
}
