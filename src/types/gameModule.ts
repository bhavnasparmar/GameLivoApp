// ─── GameModule Interface ─────────────────────────────────────────────────────
// Every game must implement this interface to register with the GameHub.
// The Game Hub never contains game-specific logic — it only calls these methods.

import { GameId, GameCategory } from './game';

// ─── Asset / Download State ───────────────────────────────────────────────────

export enum GameAssetState {
  NOT_INSTALLED = 'NOT_INSTALLED',
  DOWNLOADING = 'DOWNLOADING',
  INSTALLING = 'INSTALLING',
  READY = 'READY',
  UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
  ERROR = 'ERROR',
}

// ─── Asset Descriptor ─────────────────────────────────────────────────────────

export interface GameAsset {
  /** Unique key for this asset (e.g. 'board_image') */
  key: string;
  /** Remote URL for download */
  url: string;
  /** Approximate size in bytes */
  size: number;
  /** SHA-256 checksum for validation */
  checksum?: string;
  /** Whether this asset is required before launching */
  required: boolean;
}

// ─── Game Module Interface ────────────────────────────────────────────────────

export interface GameModule {
  /** Unique stable identifier matching GameId */
  gameId: GameId;
  /** Display name */
  gameName: string;
  /** Emoji or icon identifier */
  icon: string;
  /** Gradient colours for the hub card [from, to] */
  cardGradient: [string, string];
  /** Short description shown on hub card */
  description: string;
  /** Badge text shown on card e.g. "2–4 players" */
  playerTag: string;
  /** Min players required */
  minPlayers: number;
  /** Max players supported */
  maxPlayers: number;
  /** Hub category for filtering */
  category: GameCategory;
  /** Additional categories this game belongs to (for multi-category filtering) */
  additionalCategories?: GameCategory[];
  /** Whether the game works without a network connection */
  offlineSupport: boolean;
  /** Whether the game supports online multiplayer */
  onlineSupport: boolean;
  /** Whether the game supports paid entry fees */
  entryFeeSupport: boolean;
  /** SemVer game version string */
  gameVersion: string;
  /** Minimum app version required to play */
  minimumAppVersion: string;
  /** Remote assets to download (images, sounds, etc.) */
  assets: GameAsset[];
  /** Approximate download size label e.g. "4.2 MB" */
  downloadSizeLabel: string;
  /** Simulated online count label e.g. "3,890 online" */
  onlineCountLabel: string;

  // ─── Lifecycle Methods ──────────────────────────────────────────────────────

  /**
   * Navigate to this game's home/mode selection screen.
   * The module is responsible for its own navigation; the Hub never
   * hardcodes game-specific routes.
   */
  launchGame(navigation: any): void;

  /**
   * Preload lightweight resources (e.g. board thumbnail) before the
   * user taps PLAY so the transition feels instant.
   */
  preload(): Promise<void>;

  /**
   * Release all resources held by this game:
   * - stop timers & animations
   * - remove socket listeners
   * - clear temporary state
   * Called when the user exits the game.
   */
  cleanup(): void;
}

// ─── Download Progress ────────────────────────────────────────────────────────

export interface GameDownloadProgress {
  gameId: GameId;
  state: GameAssetState;
  /** 0–100 */
  progress: number;
  /** Error message if state === ERROR */
  errorMessage?: string;
}
