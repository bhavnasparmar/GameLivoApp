import { RootState } from '../store';

export const selectCurrentLobby = (state: RootState) => state.lobby.currentLobby;
export const selectLobbyPlayers = (state: RootState) => state.lobby.currentLobby?.players ?? [];
export const selectLobbyStatus = (state: RootState) => state.lobby.currentLobby?.status;
export const selectPublicLobbies = (state: RootState) => state.lobby.publicLobbies;
export const selectLobbyCode = (state: RootState) => state.lobby.currentLobby?.code;
export const selectIsLobbyHost = (userId: string) => (state: RootState) =>
  state.lobby.currentLobby?.hostId === userId;
