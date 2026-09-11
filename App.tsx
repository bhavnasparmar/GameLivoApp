/**
 * GameLivo — Multi-Game Platform
 * App.tsx — Root entry point
 *
 * Architecture:
 *   Redux Provider → ThemeProvider → NavigationContainer → RootNavigator
 *   Toast & Modal providers mounted globally so any service call works
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider, useDispatch } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';

import { store, AppDispatch } from './src/redux/store';
import { ThemeProvider, useTheme } from './src/theme/index';
import RootNavigator from './src/navigation/RootNavigator';

// ─── Inner App (access to theme + dispatch) ────────────────────────────────

const AppInner: React.FC = () => {
  const { isDark } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Initialize socket when app loads (after login, socket connects)
    // socketManager.initialize(dispatch);
    // return () => socketManager.teardown();
  }, [dispatch]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      {/* GlobalToast and ModalProvider go here after they are implemented */}
    </>
  );
};

// ─── Root App ──────────────────────────────────────────────────────────────

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppInner />
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
