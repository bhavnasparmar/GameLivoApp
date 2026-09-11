import { RootState } from '../store';

export const selectSelectedGame = (state: RootState) => state.game.selectedGame;
export const selectAvailableGames = (state: RootState) => state.game.availableGames;
export const selectGameMode = (state: RootState) => state.game.gameMode;
export const selectFeaturedGames = (state: RootState) => state.game.availableGames.filter((g: any) => g.isFeatured);
export const selectGameById = (gameId: string) => (state: RootState) =>
  state.game.availableGames.find((g: any) => g.id === gameId);
