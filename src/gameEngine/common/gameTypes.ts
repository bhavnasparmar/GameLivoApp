// ─── Common Game Types ────────────────────────────────────────────────────────

export type GameEngineStatus = 'idle' | 'running' | 'paused' | 'ended';

export interface GameEngineState {
  status: GameEngineStatus;
  turnNumber: number;
  currentPlayerId: string;
}

export interface MoveResult {
  isValid: boolean;
  reason?: string;
  nextPlayerId?: string;
  isGameOver?: boolean;
  winnerId?: string;
}

export interface BaseGameEngine<State, Move> {
  getInitialState(playerIds: string[]): State;
  applyMove(state: State, move: Move, playerId: string): { newState: State; result: MoveResult };
  isValidMove(state: State, move: Move, playerId: string): boolean;
  isGameOver(state: State): boolean;
  getWinner(state: State): string | null;
}
