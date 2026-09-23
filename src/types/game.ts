// ─── Game Types ─────────────────────────────────────────────────────────────

/** All game IDs — Phase 1 games + future planned games */
export type GameId =
  // Phase 1
  | 'ludo'
  | 'chess'
  | 'uno'
  | 'chidiyaUdd'
  // Phase 1 (engines exist)
  | 'snakeLadder'
  // Future
  | 'carrom'
  | 'chorChithya'
  | 'rajaMantriChorSipahi'
  | 'tambola'
  | 'fingerCricket'
  // Legacy
  | 'esto';

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

export type GameCategory = 'board' | 'card' | 'strategy' | 'casual' | 'indian' | 'quick';

/**
 * Hub display category for the tab filter strip.
 * Maps to one or more GameCategory values.
 */
export type GameHubCategory = 'popular' | 'indian' | 'board' | 'card';

export interface GameState {
  selectedGame: Game | null;
  availableGames: Game[];
  gameMode: GameMode;
  isLoading: boolean;
  error: string | null;
}
