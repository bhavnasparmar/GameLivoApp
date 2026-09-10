// ─── Snake & Ladder Types ────────────────────────────────────────────────────

export interface SnakeLadderPlayer {
  id: string;
  position: number; // 0 = start, 100 = win
  color: string;
}

export interface SnakeLadderMove {
  diceValue: number;
}

export interface SnakeLadderGameState {
  players: SnakeLadderPlayer[];
  currentPlayerId: string;
  diceValue: number | null;
  snakes: Record<number, number>; // head -> tail
  ladders: Record<number, number>; // bottom -> top
  winnerId: string | null;
  turnNumber: number;
}
