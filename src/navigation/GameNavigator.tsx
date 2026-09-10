import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameStackParamList } from './types';

const Stack = createNativeStackNavigator<GameStackParamList>();

const GameNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* All game screens registered here:
      Ludo:
      <Stack.Screen name="LudoHome" component={LudoHomeScreen} />
      <Stack.Screen name="LudoMode" component={LudoModeScreen} />
      <Stack.Screen name="LudoLobby" component={LudoLobbyScreen} />
      <Stack.Screen name="LudoGame" component={LudoGameScreen} />
      <Stack.Screen name="LudoResult" component={LudoResultScreen} />
      Chess/Uno/SnakeLadder/ChidiyaUdd/Esto follow same pattern...
      */}
    </Stack.Navigator>
  );
};

export default GameNavigator;
