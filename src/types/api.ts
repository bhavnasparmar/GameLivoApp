// ─── Backend API Types ────────────────────────────────────────────────────────
// Typed shapes for every GameLivo backend response.

import { GameId } from './game';

// ─── Game Catalog ─────────────────────────────────────────────────────────────

export type SupportedPlatform = 'ios' | 'android' | 'web';
export type GameApiStatus = 'active' | 'maintenance' | 'disabled' | 'coming_soon';

export interface GameAssetDescriptor {
  key: string;
  url: string;
  size: number;
  checksum: string;
  required: boolean;
}

export interface GameApiResponse {
  gameId: GameId;
  name: string;
  /** SemVer string e.g. "1.2.0" */
  version: string;
  /** Minimum app version required */
  minimumAppVersion: string;
  supportedPlatforms: SupportedPlatform[];
  /** Human-readable size e.g. "4.2 MB" */
  downloadSize: string;
  assets: GameAssetDescriptor[];
  status: GameApiStatus;
  maintenanceMode: boolean;
  releaseNotes: string;
}

export interface GamesListResponse {
  games: GameApiResponse[];
  /** Unix timestamp */
  fetchedAt: number;
}

// ─── Play / Download Events ───────────────────────────────────────────────────

export interface DownloadEventPayload {
  gameId: GameId;
  /** 'started' | 'completed' | 'failed' */
  event: 'started' | 'completed' | 'failed';
  platform: SupportedPlatform;
  errorReason?: string;
}

export interface PlayEventPayload {
  gameId: GameId;
  mode: string;
  sessionId?: string;
}

// ─── Version Check ────────────────────────────────────────────────────────────

export interface GameVersionResponse {
  gameId: GameId;
  latestVersion: string;
  minimumAppVersion: string;
  updateRequired: boolean;
  releaseNotes: string;
}

// ─── Generic API Envelope ─────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
