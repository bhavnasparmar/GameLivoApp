import { useAppSelector } from '../redux/hooks';
import { selectCurrentLobby, selectLobbyPlayers, selectLobbyStatus } from '../redux/selectors/lobbySelectors';

// ─── useLobby Hook ────────────────────────────────────────────────────────────

export const useLobby = () => {
  const currentLobby = useAppSelector(selectCurrentLobby);
  const players = useAppSelector(selectLobbyPlayers);
  const status = useAppSelector(selectLobbyStatus);

  return { currentLobby, players, status };
};
