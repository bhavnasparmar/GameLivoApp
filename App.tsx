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
import { navigationRef } from './src/navigation/navigationRef';
import { bootstrapGameRegistry } from './src/core/registry/index';
import { GameDownloadManager } from './src/core/download/GameDownloadManager';
import { initGamesAssetState } from './src/redux/slices/downloadSlice';
import { GameAssetState } from './src/types/gameModule';
import { GameId } from './src/types/game';

// Bootstrap the registry immediately (sync) so it's ready before any screen renders
bootstrapGameRegistry();

// ─── Inner App (access to theme + dispatch) ────────────────────────────────

const AppInner: React.FC = () => {
  const { isDark } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // Mark Phase 1 bundled games as READY (they're shipped with the app)
    const BUNDLED_GAMES: GameId[] = ['ludo', 'chess', 'uno', 'chidiyaUdd'];
    const initialStates = BUNDLED_GAMES.reduce((acc, id) => {
      acc[id] = GameAssetState.READY;
      return acc;
    }, {} as Record<GameId, GameAssetState>);
    dispatch(initGamesAssetState(initialStates));

    // Also persist to AsyncStorage for future launches
    BUNDLED_GAMES.forEach(id => GameDownloadManager.markBundledAsReady(id));
  }, [dispatch]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <NavigationContainer ref={navigationRef}>
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
