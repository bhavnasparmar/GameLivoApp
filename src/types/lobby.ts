import { GameId, GameMode } from './game';
import { Player } from './player';

// ─── Lobby Types ─────────────────────────────────────────────────────────────

export type LobbyStatus = 'waiting' | 'full' | 'starting' | 'in_game' | 'closed';

export interface LobbySettings {
  maxPlayers: number;
  isPrivate: boolean;
  password?: string;
  entryFee: number;
  prizePool: number;
  timeLimit?: number; // seconds per turn
  gameMode: GameMode;
}

export interface Lobby {
  id: string;
  gameId: GameId;
  code: string; // 6-char invite code
  hostId: string;
  players: Player[];
  settings: LobbySettings;
  status: LobbyStatus;
  createdAt: string;
}

export interface LobbyState {
  currentLobby: Lobby | null;
  publicLobbies: Lobby[];
  isLoading: boolean;
  error: string | null;
}
