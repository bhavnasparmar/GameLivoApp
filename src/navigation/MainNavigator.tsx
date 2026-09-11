import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import GameNavigator from './GameNavigator';
import NotificationsScreen from '../screens/notifications/Notifications';
import EditProfileScreen from '../screens/profile/EditProfile';
import PrivacySecurityScreen from '../screens/settings/PrivacySecurity';
import PermissionsScreen from '../screens/settings/Permissions';
import DataSafetyScreen from '../screens/settings/DataSafety';
import TermsScreen from '../screens/settings/Terms';
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicy';

export type MainStackParamList = {
  Tabs: undefined;
  Game: undefined;
  Notifications: undefined;
  EditProfile: { profile?: any };
  PrivacySecurity: undefined;
  Permissions: undefined;
  DataSafety: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
  Chat: undefined;
  Support: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={BottomTabNavigator} />
      <Stack.Screen
        name="Game"
        component={GameNavigator}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PrivacySecurity"
        component={PrivacySecurityScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Permissions"
        component={PermissionsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="DataSafety"
        component={DataSafetyScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
