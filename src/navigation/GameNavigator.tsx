import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GameStackParamList } from './types';

import LudoHomeScreen from '../screens/games/ludo/LudoHome';

const Stack = createNativeStackNavigator<GameStackParamList>();

const GameNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="LudoHome" component={LudoHomeScreen} />
    </Stack.Navigator>
  );
};

export default GameNavigator;
