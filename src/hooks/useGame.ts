import { useAppSelector } from '../redux/hooks';
import { selectSelectedGame, selectGameMode, selectAvailableGames } from '../redux/selectors/gameSelectors';

// ─── useGame Hook ─────────────────────────────────────────────────────────────

export const useGame = () => {
  const selectedGame = useAppSelector(selectSelectedGame);
  const gameMode = useAppSelector(selectGameMode);
  const availableGames = useAppSelector(selectAvailableGames);

  return { selectedGame, gameMode, availableGames };
};
