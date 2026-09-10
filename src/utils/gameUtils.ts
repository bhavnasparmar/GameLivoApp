import { Player } from '../types/player';
import { GameId } from '../types/game';

// ─── Game Utilities ──────────────────────────────────────────────────────────

export const GameUtils = {
  getNextPlayer: (players: Player[], currentPlayerId: string): Player => {
    const idx = players.findIndex(p => p.id === currentPlayerId);
    const next = (idx + 1) % players.length;
    return players[next];
  },

  isAllPlayersReady: (players: Player[]): boolean =>
    players.length > 0 && players.every(p => p.status === 'ready'),

  getActivePlayers: (players: Player[]): Player[] =>
    players.filter(p => p.status !== 'disconnected' && p.status !== 'finished'),

  getWinner: (players: Player[]): Player | null =>
    players.find(p => p.rank === 1) ?? null,

  getGameDisplayName: (gameId: GameId): string => {
    const names: Record<GameId, string> = {
      ludo: 'Ludo',
      chess: 'Chess',
      uno: 'Uno',
      snakeLadder: 'Snake & Ladder',
      chidiyaUdd: 'Chidiya Udd',
      esto: 'Esto',
    };
    return names[gameId];
  },

  calculateXP: (rank: number, totalPlayers: number): number => {
    const base = 50;
    const multiplier = Math.max(1, totalPlayers - rank + 1);
    return base * multiplier;
  },
};
