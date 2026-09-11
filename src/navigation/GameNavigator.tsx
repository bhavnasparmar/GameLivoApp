import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameStackParamList } from './types';

import LudoHomeScreen from '../screens/games/ludo/LudoHome';
import ChessHomeScreen from '../screens/games/chess/ChessHome';
import ChessModeScreen from '../screens/games/chess/ChessMode';
import ChessLobbyScreen from '../screens/games/chess/ChessLobby';
import ChessGameScreen from '../screens/games/chess/ChessGame';
import ChessResultScreen from '../screens/games/chess/ChessResult';

const Stack = createNativeStackNavigator<GameStackParamList>();

export const GameNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Chess Screens */}
      <Stack.Screen name="ChessHome" component={ChessHomeScreen} />
      <Stack.Screen name="ChessMode" component={ChessModeScreen} />
      <Stack.Screen name="ChessLobby" component={ChessLobbyScreen} />
      <Stack.Screen name="ChessGame" component={ChessGameScreen} />
      <Stack.Screen name="ChessResult" component={ChessResultScreen} />

      {/* Ludo */}
      <Stack.Screen name="LudoHome" component={LudoHomeScreen} />
    </Stack.Navigator>
  );
};

export default GameNavigator;
