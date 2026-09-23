import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

// ─── Props & State ────────────────────────────────────────────────────────────

interface GameErrorBoundaryProps {
  children: ReactNode;
  gameName?: string;
  onReset?: () => void;
}

interface GameErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

/**
 * GameErrorBoundary — wraps each game's screen stack.
 * Catches render/lifecycle errors so a crash in one game
 * does NOT take down the entire GameHub or other games.
 */
class GameErrorBoundary extends Component<GameErrorBoundaryProps, GameErrorBoundaryState> {
  constructor(props: GameErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): GameErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message ?? 'An unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Log to analytics / crash reporting
    if (__DEV__) {
      console.error(`[GameErrorBoundary] ${this.props.gameName ?? 'Game'} crashed:`, error, info);
    }
    // TODO: Replace with Sentry / Crashlytics when integrated
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const gameName = this.props.gameName ?? 'this game';

    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1A0A0A', '#0D0505']} style={styles.gradient}>
          <Text style={styles.emoji}>😵</Text>
          <Text style={styles.title}>Oops!</Text>
          <Text style={styles.subtitle}>
            Something went wrong with {gameName}.
          </Text>

          {__DEV__ && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} numberOfLines={4}>
                {this.state.errorMessage}
              </Text>
            </View>
          )}

          <TouchableOpacity activeOpacity={0.85} onPress={this.handleReset} style={styles.retryBtn}>
            <LinearGradient colors={['#E6483A', '#8F1D13']} style={styles.retryBtnGradient}>
              <Text style={styles.retryBtnText}>⟳ Try Again</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.hint}>
            If the problem persists, please restart the app.
          </Text>
        </LinearGradient>
      </View>
    );
  }
}

export default GameErrorBoundary;

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32,
  },
  emoji: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 28, fontWeight: '900', color: '#FFFFFF',
    marginBottom: 8, letterSpacing: 0.4,
  },
  subtitle: {
    fontSize: 15, color: 'rgba(255,255,255,0.7)',
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  errorBox: {
    backgroundColor: 'rgba(230,72,58,0.1)',
    borderWidth: 1, borderColor: 'rgba(230,72,58,0.3)',
    borderRadius: 10, padding: 12, marginBottom: 24, width: '100%',
  },
  errorText: { color: '#E6483A', fontSize: 11, fontFamily: 'monospace' },
  retryBtn: {
    borderRadius: 14, overflow: 'hidden', marginBottom: 16,
    shadowColor: '#E6483A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  retryBtnGradient: {
    paddingVertical: 15, paddingHorizontal: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  retryBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  hint: { fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },
});
