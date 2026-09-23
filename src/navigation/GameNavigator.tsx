import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameStackParamList } from './types';

// ─── Ludo ────────────────────────────────────────────────────────────────────
import LudoHomeScreen   from '../screens/games/ludo/LudoHome';
import LudoModeScreen   from '../screens/games/ludo/LudoMode';
import LudoLobbyScreen  from '../screens/games/ludo/LudoLobby';
import LudoGameScreen   from '../screens/games/ludo/LudoGame';
import LudoResultScreen from '../screens/games/ludo/LudoResult';

// ─── Chess ────────────────────────────────────────────────────────────────────
import ChessHomeScreen   from '../screens/games/chess/ChessHome';
import ChessModeScreen   from '../screens/games/chess/ChessMode';
import ChessLobbyScreen  from '../screens/games/chess/ChessLobby';
import ChessGameScreen   from '../screens/games/chess/ChessGame';
import ChessResultScreen from '../screens/games/chess/ChessResult';

// ─── UNO ──────────────────────────────────────────────────────────────────────
import UnoHomeScreen   from '../screens/games/uno/UnoHome';
import UnoModeScreen   from '../screens/games/uno/UnoMode';
import UnoLobbyScreen  from '../screens/games/uno/UnoLobby';
import UnoGameScreen   from '../screens/games/uno/UnoGame';
import UnoResultScreen from '../screens/games/uno/UnoResult';

// ─── Chidiya Udd ──────────────────────────────────────────────────────────────
import ChidiyaHomeScreen   from '../screens/games/chidiyaUdd/ChidiyaHome';
import ChidiyaLobbyScreen  from '../screens/games/chidiyaUdd/ChidiyaLobby';
import ChidiyaGameScreen   from '../screens/games/chidiyaUdd/ChidiyaGame';
import ChidiyaResultScreen from '../screens/games/chidiyaUdd/ChidiyaResult';

const Stack = createNativeStackNavigator<GameStackParamList>();

/**
 * GameNavigator — houses all in-game screens.
 * Adding a new game = import its screens + add Stack.Screen entries.
 * The Game Hub never needs to be touched.
 */
export const GameNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* ── Ludo ──────────────────────────────────────────────────────────── */}
      <Stack.Screen name="LudoHome"   component={LudoHomeScreen} />
      <Stack.Screen name="LudoMode"   component={LudoModeScreen} />
      <Stack.Screen name="LudoLobby"  component={LudoLobbyScreen} />
      <Stack.Screen name="LudoGame"   component={LudoGameScreen} />
      <Stack.Screen name="LudoResult" component={LudoResultScreen} />

      {/* ── Chess ─────────────────────────────────────────────────────────── */}
      <Stack.Screen name="ChessHome"   component={ChessHomeScreen} />
      <Stack.Screen name="ChessMode"   component={ChessModeScreen} />
      <Stack.Screen name="ChessLobby"  component={ChessLobbyScreen} />
      <Stack.Screen name="ChessGame"   component={ChessGameScreen} />
      <Stack.Screen name="ChessResult" component={ChessResultScreen} />

      {/* ── UNO ───────────────────────────────────────────────────────────── */}
      <Stack.Screen name="UnoHome"   component={UnoHomeScreen} />
      <Stack.Screen name="UnoMode"   component={UnoModeScreen} />
      <Stack.Screen name="UnoLobby"  component={UnoLobbyScreen} />
      <Stack.Screen name="UnoGame"   component={UnoGameScreen} />
      <Stack.Screen name="UnoResult" component={UnoResultScreen} />

      {/* ── Chidiya Udd ───────────────────────────────────────────────────── */}
      <Stack.Screen name="ChidiyaHome"   component={ChidiyaHomeScreen} />
      <Stack.Screen name="ChidiyaLobby"  component={ChidiyaLobbyScreen} />
      <Stack.Screen name="ChidiyaGame"   component={ChidiyaGameScreen} />
      <Stack.Screen name="ChidiyaResult" component={ChidiyaResultScreen} />
    </Stack.Navigator>
  );
};

export default GameNavigator;
