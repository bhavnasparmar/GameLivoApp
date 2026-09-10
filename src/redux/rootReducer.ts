import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import userReducer from './slices/userSlice';
import gameReducer from './slices/gameSlice';
import lobbyReducer from './slices/lobbySlice';
import matchReducer from './slices/matchSlice';
import playerReducer from './slices/playerSlice';
import friendReducer from './slices/friendSlice';
import chatReducer from './slices/chatSlice';
import notificationReducer from './slices/notificationSlice';
import rewardReducer from './slices/rewardSlice';
import leaderboardReducer from './slices/leaderboardSlice';
import settingsReducer from './slices/settingsSlice';
import networkReducer from './slices/networkSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  game: gameReducer,
  lobby: lobbyReducer,
  match: matchReducer,
  player: playerReducer,
  friend: friendReducer,
  chat: chatReducer,
  notification: notificationReducer,
  reward: rewardReducer,
  leaderboard: leaderboardReducer,
  settings: settingsReducer,
  network: networkReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
