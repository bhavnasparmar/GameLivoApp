import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { ROUTES } from './routes';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SplashScreen from '../screens/splash';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName={ROUTES.SPLASH as 'Splash'} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.SPLASH as 'Splash'} component={SplashScreen} />
      <Stack.Screen name={ROUTES.AUTH as 'Auth'} component={AuthNavigator} />
      <Stack.Screen name={ROUTES.MAIN as 'Main'} component={MainNavigator} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
