import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { ROUTES } from './routes';
import { useAppSelector } from '../redux/hooks';
import { selectIsLoggedIn } from '../redux/selectors/authSelectors';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

// import SplashScreen from '../screens/splash';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* <Stack.Screen name={ROUTES.SPLASH} component={SplashScreen} /> */}
      {isLoggedIn ? (
        <Stack.Screen name={ROUTES.MAIN as 'Main'} component={MainNavigator} />
      ) : (
        <Stack.Screen name={ROUTES.AUTH as 'Auth'} component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
