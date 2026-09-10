// ─── Chidiya Udd Engine ───────────────────────────────────────────────────────
// Chidiya Udd is a reaction-based game where a caller names an item.
// Players must tap quickly if it can fly (chidiya udd = bird flies).
// Wrong tap = penalty.

export interface ChidiyaPlayer {
  id: string;
  score: number;
  penalties: number;
}

export interface ChidiyaItem {
  id: string;
  name: string;
  canFly: boolean;
}

export interface ChidiyaTapEvent {
  playerId: string;
  itemId: string;
  tappedAt: number; // timestamp ms
}

export interface ChidiyaGameState {
  players: ChidiyaPlayer[];
  currentItem: ChidiyaItem | null;
  itemRevealedAt: number | null;
  tapEvents: ChidiyaTapEvent[];
  round: number;
  maxRounds: number;
  winnerId: string | null;
}

export const CHIDIYA_ITEMS: ChidiyaItem[] = [
  { id: '1', name: 'Chidiya (Bird)', canFly: true },
  { id: '2', name: 'Butterfly', canFly: true },
  { id: '3', name: 'Crow', canFly: true },
  { id: '4', name: 'Dog', canFly: false },
  { id: '5', name: 'Fish', canFly: false },
  { id: '6', name: 'Airplane', canFly: true },
  { id: '7', name: 'Elephant', canFly: false },
  { id: '8', name: 'Dragonfly', canFly: true },
  { id: '9', name: 'Snake', canFly: false },
  { id: '10', name: 'Superman', canFly: true },
];

export const chidiyaEngine = {
  getInitialState: (playerIds: string[], maxRounds = 10): ChidiyaGameState => ({
    players: playerIds.map(id => ({ id, score: 0, penalties: 0 })),
    currentItem: null,
    itemRevealedAt: null,
    tapEvents: [],
    round: 0,
    maxRounds,
    winnerId: null,
  }),

  getRandomItem: (): ChidiyaItem =>
    CHIDIYA_ITEMS[Math.floor(Math.random() * CHIDIYA_ITEMS.length)],

  processTap: (state: ChidiyaGameState, tap: ChidiyaTapEvent): ChidiyaGameState => {
    const newState = JSON.parse(JSON.stringify(state)) as ChidiyaGameState;
    const player = newState.players.find(p => p.id === tap.playerId)!;
    const item = newState.currentItem;

    if (!item) return newState;

    const reactionTime = tap.tappedAt - (newState.itemRevealedAt ?? tap.tappedAt);
    const isCorrectTap = item.canFly;

    if (isCorrectTap) {
      // Score based on speed (max 100 points, faster = more)
      const speedBonus = Math.max(0, 100 - Math.floor(reactionTime / 10));
      player.score += speedBonus;
    } else {
      player.penalties += 1;
      player.score = Math.max(0, player.score - 20);
    }

    newState.tapEvents.push(tap);
    return newState;
  },

  isGameOver: (state: ChidiyaGameState): boolean =>
    state.round >= state.maxRounds,

  getWinner: (state: ChidiyaGameState): string | null => {
    if (!chidiyaEngine.isGameOver(state)) return null;
    const winner = [...state.players].sort((a, b) => b.score - a.score)[0];
    return winner?.id ?? null;
  },
};
