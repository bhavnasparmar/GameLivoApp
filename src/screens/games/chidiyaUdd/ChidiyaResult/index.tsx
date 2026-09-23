import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';

// ─── Screen ───────────────────────────────────────────────────────────────────

type RouteParams = { won?: boolean; score?: number };

const ChidiyaResultScreen: React.FC = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { isDark } = useTheme();

  const { won = false, score = 0 } = route.params ?? {};

  const handlePlayAgain = () => {
    try {
      navigation.replace(ROUTES.CHIDIYA_HOME);
    } catch {
      navigation.replace('ChidiyaHome');
    }
  };

  const handleGoHome = () => {
    navigation.popToTop();
  };

  const bg = isDark ? '#1A1408' : '#FFF8E7';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={won ? ['#1F9D55', '#0D5230'] : ['#8F1D13', '#4A0E09']}
        style={[styles.resultBanner, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.resultEmoji}>{won ? '🏆' : '😵'}</Text>
        <Text style={styles.resultTitle}>{won ? 'You Won!' : 'Eliminated!'}</Text>
        <Text style={styles.resultSub}>
          {won ? 'Last bird standing! 🐦' : 'Better luck next time'}
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        {/* Score Card */}
        <LinearGradient
          colors={isDark ? ['#1F1908', '#120F04'] : ['#FFF3CC', '#FFF']}
          style={styles.scoreCard}
        >
          <Text style={styles.scoreLabel}>Your Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
          <Text style={[styles.scoreHint, { color: isDark ? '#888' : '#666' }]}>
            {score >= 60 ? '🔥 Excellent reflexes!' :
             score >= 30 ? '👍 Good game!' : '💪 Keep practicing!'}
          </Text>
        </LinearGradient>

        {/* CTA Buttons */}
        <TouchableOpacity activeOpacity={0.88} onPress={handlePlayAgain}>
          <LinearGradient colors={['#F2B705', '#D49A00']} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>▶ Play Again</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGoHome}
          style={[styles.secondaryBtn, { borderColor: isDark ? 'rgba(242,183,5,0.3)' : 'rgba(242,183,5,0.5)' }]}
        >
          <Text style={[styles.secondaryBtnText, { color: isDark ? '#F2B705' : '#A67200' }]}>
            ← Back to Hub
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChidiyaResultScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  resultBanner: {
    alignItems: 'center', paddingBottom: 40,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  resultEmoji: { fontSize: 72, marginBottom: 8 },
  resultTitle: { fontSize: 32, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  resultSub: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  body: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  scoreCard: {
    borderRadius: 20, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(242,183,5,0.2)',
    marginBottom: 8,
  },
  scoreLabel: { fontSize: 12, fontWeight: '700', color: '#F2B705', letterSpacing: 1, marginBottom: 6 },
  scoreValue: { fontSize: 52, fontWeight: '900', color: '#F2B705' },
  scoreHint: { fontSize: 13, marginTop: 6 },
  primaryBtn: {
    borderRadius: 18, paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#F2B705', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  primaryBtnText: { fontSize: 17, fontWeight: '900', color: '#2B1C04' },
  secondaryBtn: {
    borderRadius: 16, paddingVertical: 15,
    alignItems: 'center', borderWidth: 1.5,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '700' },
});
