import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../api/apiEndpoints';
import { Game } from '../../types/game';
import { GAMES } from '../../constants/gameConstants';

export const gameService = {
  getGames: async (): Promise<Game[]> => {
    try {
      const games = await apiClient.get<Game[]>(API_ENDPOINTS.GAME.LIST);
      return games && games.length > 0 ? games : GAMES;
    } catch {
      // Fallback to local game constants if offline or endpoint not yet configured
      return GAMES;
    }
  },

  getGameDetails: async (gameId: string): Promise<Game> => {
    return apiClient.get<Game>(API_ENDPOINTS.GAME.DETAIL(gameId));
  },
};

export default gameService;
