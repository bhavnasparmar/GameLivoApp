import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { ROUTES } from './routes';
import BottomTabBar from '../components/navigation/BottomTabBar';

import GameHubScreen from '../screens/home/GameHub';
import FriendsListScreen from '../screens/friends/FriendsList';
import RewardsScreen from '../screens/rewards/Rewards';
import ProfileScreen from '../screens/profile/Profile';
import SettingsScreen from '../screens/settings/Settings';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={ROUTES.GAME_HUB as keyof MainTabParamList}
    >
      <Tab.Screen
        name={ROUTES.GAME_HUB as 'GameHub'}
        component={GameHubScreen}
        options={{ title: 'Hub' }}
      />
      <Tab.Screen
        name={ROUTES.FRIENDS as 'Friends'}
        component={FriendsListScreen}
        options={{ title: 'Friends' }}
      />
      <Tab.Screen
        name={ROUTES.REWARDS as 'Rewards'}
        component={RewardsScreen}
        options={{ title: 'Rewards' }}
      />
      <Tab.Screen
        name={ROUTES.PROFILE as 'Profile'}
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Tab.Screen
        name={ROUTES.SETTINGS as 'Settings'}
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
