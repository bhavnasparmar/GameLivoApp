import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { ROUTES } from './routes';
import LoginScreen from '@/screens/auth/Login';
import RegisterScreen from '@/screens/auth/Register';
import VerifyOTPScreen from '@/screens/auth/VerifyOTP';
import ForgotPasswordScreen from '@/screens/auth/ForgotPassword';
import ResetPasswordScreen from '@/screens/auth/ResetPassword';

// Screen imports — to be implemented
// import LoginScreen from '../screens/auth/Login';
// import RegisterScreen from '../screens/auth/Register';
// import VerifyOTPScreen from '../screens/auth/VerifyOTP';
// import ForgotPasswordScreen from '../screens/auth/ForgotPassword';
// import ResetPasswordScreen from '../screens/auth/ResetPassword';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      initialRouteName={ROUTES.LOGIN as keyof AuthStackParamList}
    >

      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} />
      <Stack.Screen name={ROUTES.VERIFY_OTP} component={VerifyOTPScreen} />
      <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
      <Stack.Screen name={ROUTES.RESET_PASSWORD} component={ResetPasswordScreen} />

    </Stack.Navigator>
  );
};

export default AuthNavigator;
