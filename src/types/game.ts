// ─── Game Types ─────────────────────────────────────────────────────────────

export type GameId = 'ludo' | 'chess' | 'uno' | 'snakeLadder' | 'chidiyaUdd' | 'esto';

export type GameMode = 'classic' | 'quick' | 'tournament' | 'private' | 'practice';

export type GameStatus = 'idle' | 'waiting' | 'starting' | 'in_progress' | 'paused' | 'finished';

export type GameDifficulty = 'easy' | 'medium' | 'hard';

export interface Game {
  id: GameId;
  name: string;
  description: string;
  icon: string;
  banner: string;
  minPlayers: number;
  maxPlayers: number;
  estimatedDuration: string; // e.g. "15-30 min"
  modes: GameMode[];
  isActive: boolean;
  isFeatured: boolean;
  category: GameCategory;
}

export type GameCategory = 'board' | 'card' | 'strategy' | 'casual';

export interface GameState {
  selectedGame: Game | null;
  availableGames: Game[];
  gameMode: GameMode;
  isLoading: boolean;
  error: string | null;
}
