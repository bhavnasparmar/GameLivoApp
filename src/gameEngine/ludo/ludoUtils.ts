import { LudoGameState } from './ludoTypes';
import { LudoRules } from './ludoRules';

// ─── Ludo Utils ───────────────────────────────────────────────────────────────

export const LudoUtils = {
  getMovableTokenIds: (state: LudoGameState, playerId: string): string[] => {
    const player = state.players.find(p => p.id === playerId);
    if (!player || state.currentDiceValue === null) return [];
    return player.tokens
      .filter(t => LudoRules.canMoveToken(t, state.currentDiceValue!))
      .map(t => t.id);
  },

  getPlayerRanks: (state: LudoGameState): Record<string, number> => {
    const ranks: Record<string, number> = {};
    state.finishedPlayers.forEach((id, idx) => {
      ranks[id] = idx + 1;
    });
    state.players
      .filter(p => !p.isFinished)
      .forEach((p, idx) => {
        ranks[p.id] = state.finishedPlayers.length + idx + 1;
      });
    return ranks;
  },

  getTokenProgress: (tokenPosition: number): number => {
    if (tokenPosition < 0) return 0;
    return Math.round((tokenPosition / 57) * 100);
  },
};
