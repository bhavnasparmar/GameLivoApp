import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { ROUTES } from './routes';

// Screen imports — to be implemented
// import GameHubScreen from '../screens/home/GameHub';
// import FriendsNavigator from './FriendsNavigator';
// import ProfileNavigator from './ProfileNavigator';
// import RewardsNavigator from './RewardsNavigator';
// import SettingsNavigator from './SettingsNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#102017',
          borderTopColor: '#294034',
          height: 64,
        },
        tabBarActiveTintColor: '#27AE60',
        tabBarInactiveTintColor: '#7A9485',
      }}
    >
      {/* Uncomment as screens are implemented:
      <Tab.Screen name={ROUTES.GAME_HUB} component={GameHubScreen} />
      <Tab.Screen name={ROUTES.FRIENDS} component={FriendsNavigator} />
      <Tab.Screen name={ROUTES.PROFILE} component={ProfileNavigator} />
      <Tab.Screen name={ROUTES.REWARDS} component={RewardsNavigator} />
      <Tab.Screen name={ROUTES.SETTINGS} component={SettingsNavigator} />
      */}
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
