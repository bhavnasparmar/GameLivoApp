// ─── Game Service ─────────────────────────────────────────────────────────────
// Typed API calls for the game catalog backend.

import apiClient from '../api/apiClient';
import { Game, GameId } from '../../types/game';
import {
  GamesListResponse,
  GameApiResponse,
  GameVersionResponse,
  DownloadEventPayload,
  PlayEventPayload,
} from '../../types/api';
import { GAMES } from '../../constants/gameConstants';

// ─── API Path Helpers ─────────────────────────────────────────────────────────

const GAME_API = {
  LIST:          '/games',
  DETAIL:        (id: GameId) => `/games/${id}`,
  VERSION:       (id: GameId) => `/games/${id}/version`,
  ASSETS:        (id: GameId) => `/games/${id}/assets`,
  DOWNLOAD_EVT:  (id: GameId) => `/games/${id}/download-event`,
  PLAY_EVT:      (id: GameId) => `/games/${id}/play-event`,
  UPDATE:        (id: GameId) => `/games/${id}/update`,
};

// ─── Adapter: API → local Game shape ─────────────────────────────────────────

function toGame(api: GameApiResponse): Game {
  return {
    id: api.gameId,
    name: api.name,
    description: api.releaseNotes ?? '',
    icon: api.gameId + '_icon',
    banner: api.gameId + '_banner',
    minPlayers: 2,
    maxPlayers: 4,
    estimatedDuration: '15–30 min',
    modes: ['classic', 'quick', 'private'],
    isActive: api.status === 'active',
    isFeatured: false,
    category: 'board',
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const gameService = {
  /**
   * GET /games — returns all available games.
   * Falls back to local GAMES constant on network failure.
   */
  async getGames(): Promise<Game[]> {
    try {
      const response = await apiClient.get<GamesListResponse>(GAME_API.LIST);
      if (response?.games?.length) {
        return response.games.map(toGame);
      }
      return GAMES;
    } catch {
      return GAMES;
    }
  },

  /**
   * GET /games/:gameId — single game detail.
   */
  async getGame(gameId: GameId): Promise<Game | null> {
    try {
      const response = await apiClient.get<GameApiResponse>(GAME_API.DETAIL(gameId));
      return response ? toGame(response) : null;
    } catch {
      return GAMES.find(g => g.id === gameId) ?? null;
    }
  },

  /**
   * GET /games/:gameId/version — check for updates.
   */
  async getGameVersion(gameId: GameId): Promise<GameVersionResponse | null> {
    try {
      return await apiClient.get<GameVersionResponse>(GAME_API.VERSION(gameId));
    } catch {
      return null;
    }
  },

  /**
   * POST /games/:gameId/download-event
   * App Store compliant — tracks asset download analytics only.
   * Does NOT download game code.
   */
  async postDownloadEvent(gameId: GameId, event: DownloadEventPayload['event']): Promise<void> {
    try {
      const payload: DownloadEventPayload = {
        gameId,
        event,
        platform: 'android', // TODO: use Platform.OS
      };
      await apiClient.post(GAME_API.DOWNLOAD_EVT(gameId), payload);
    } catch {
      // Analytics failures must never affect gameplay
    }
  },

  /**
   * POST /games/:gameId/play-event
   * Server validates that game was actually played.
   */
  async postPlayEvent(gameId: GameId, mode: string, sessionId?: string): Promise<void> {
    try {
      const payload: PlayEventPayload = { gameId, mode, sessionId };
      await apiClient.post(GAME_API.PLAY_EVT(gameId), payload);
    } catch {
      // Non-critical; retry handled server-side
    }
  },
};
