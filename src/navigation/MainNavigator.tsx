import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import GameNavigator from './GameNavigator';

type MainStackParamList = {
  Tabs: undefined;
  Game: undefined;
  Notifications: undefined;
  Chat: undefined;
  Support: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={BottomTabNavigator} />
      <Stack.Screen name="Game" component={GameNavigator} options={{ animation: 'slide_from_bottom' }} />
      {/* Notifications, Chat, Support navigators added here */}
    </Stack.Navigator>
  );
};

export default MainNavigator;
