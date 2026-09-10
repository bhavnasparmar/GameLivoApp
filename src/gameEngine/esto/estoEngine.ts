// ─── Esto Engine ──────────────────────────────────────────────────────────────
// Esto is a multi-player strategy game.
// This engine provides the base structure; full rules to be defined by the game team.

export interface EstoPlayer {
  id: string;
  score: number;
  moves: number;
}

export interface EstoMove {
  type: string;
  data: Record<string, unknown>;
}

export interface EstoGameState {
  players: EstoPlayer[];
  currentPlayerId: string;
  round: number;
  maxRounds: number;
  board: Record<string, unknown>;
  winnerId: string | null;
  turnNumber: number;
}

export const estoEngine = {
  getInitialState: (playerIds: string[]): EstoGameState => ({
    players: playerIds.map(id => ({ id, score: 0, moves: 0 })),
    currentPlayerId: playerIds[0],
    round: 1,
    maxRounds: 10,
    board: {},
    winnerId: null,
    turnNumber: 1,
  }),

  applyMove: (state: EstoGameState, _move: EstoMove, _playerId: string): EstoGameState => {
    // TODO: Implement Esto-specific move logic
    return JSON.parse(JSON.stringify(state));
  },

  isGameOver: (state: EstoGameState): boolean =>
    state.round >= state.maxRounds || !!state.winnerId,

  getWinner: (state: EstoGameState): string | null => {
    if (state.winnerId) return state.winnerId;
    const winner = [...state.players].sort((a, b) => b.score - a.score)[0];
    return winner?.id ?? null;
  },
};
