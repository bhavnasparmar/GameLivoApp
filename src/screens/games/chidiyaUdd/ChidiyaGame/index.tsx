import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { MultiplayerService } from '../../../../core/multiplayer/MultiplayerService';
import { GameAnalytics } from '../../../../core/analytics/GameAnalytics';

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteParams = { roomId?: string; mode?: string };

const SAMPLE_ITEMS = [
  { name: 'Chidiya',   canFly: true,  emoji: '🐦' },
  { name: 'Kauwa',     canFly: true,  emoji: '🐦‍⬛' },
  { name: 'Hathi',     canFly: false, emoji: '🐘' },
  { name: 'Titli',     canFly: true,  emoji: '🦋' },
  { name: 'Sher',      canFly: false, emoji: '🦁' },
  { name: 'Macchar',   canFly: true,  emoji: '🦟' },
  { name: 'Gaay',      canFly: false, emoji: '🐄' },
  { name: 'Parinda',   canFly: true,  emoji: '🦅' },
  { name: 'Kuttha',    canFly: false, emoji: '🐕' },
  { name: 'Takhi',     canFly: false, emoji: '🏋️' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

const ChidiyaGameScreen: React.FC = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const [currentItem, setCurrentItem]   = useState(SAMPLE_ITEMS[0]);
  const [isEliminated, setIsEliminated] = useState(false);
  const [activePlayers, setActivePlayers] = useState(4);
  const [roundNum, setRoundNum]          = useState(1);
  const [score, setScore]                = useState(0);
  const [timeLeft, setTimeLeft]          = useState(3);
  const [phase, setPhase]                = useState<'announce' | 'react' | 'result'>('announce');
  const [feedbackMsg, setFeedbackMsg]    = useState('');
  const [tapped, setTapped]              = useState(false);

  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Round loop ────────────────────────────────────────────────────────────

  useEffect(() => {
    startAnnounce();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [roundNum]);

  const startAnnounce = () => {
    const item = SAMPLE_ITEMS[Math.floor(Math.random() * SAMPLE_ITEMS.length)];
    setCurrentItem(item);
    setPhase('announce');
    setTapped(false);
    setFeedbackMsg('');
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    setTimeout(() => startReact(item), 1800);
  };

  const startReact = (item: typeof SAMPLE_ITEMS[0]) => {
    setPhase('react');
    setTimeLeft(3);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Time's up — evaluate
          evaluateResult(item, false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTap = () => {
    if (phase !== 'react' || tapped) return;
    clearInterval(timerRef.current!);
    setTapped(true);
    evaluateResult(currentItem, true);
  };

  const evaluateResult = (item: typeof SAMPLE_ITEMS[0], didTap: boolean) => {
    setPhase('result');
    const correct = didTap === item.canFly;

    if (correct) {
      setScore(s => s + 10);
      setFeedbackMsg(didTap ? '✅ Correct! It flies!' : '✅ Correct! It doesn\'t fly!');
    } else {
      setIsEliminated(true);
      setFeedbackMsg(didTap ? '❌ Wrong! It doesn\'t fly!' : '❌ Wrong! It flies!');
      showResult(false);
      return;
    }

    setTimeout(() => {
      setRoundNum(r => r + 1);
      if (roundNum >= 8) showResult(true);
    }, 1200);
  };

  const showResult = (won: boolean) => {
    GameAnalytics.trackGameCompleted('chidiyaUdd', { won, duration: roundNum * 5000 });
    setTimeout(() => {
      try {
        navigation.replace(ROUTES.CHIDIYA_RESULT, { won, score });
      } catch {
        navigation.replace('ChidiyaResult', { won, score });
      }
    }, 1500);
  };

  // ─── Pulse animation on react phase ───────────────────────────────────────

  useEffect(() => {
    if (phase === 'react') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0,  duration: 400, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [phase]);

  const bg = isDark ? '#1A1408' : '#FFF8E7';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Top bar */}
      <LinearGradient
        colors={['#F2B705', '#D49A00']}
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.topBarContent}>
          <Text style={styles.topBarTitle}>Round {roundNum}</Text>
          <View style={styles.scorePill}>
            <Text style={styles.scoreText}>Score: {score}</Text>
          </View>
          <Text style={styles.playersLeft}>👥 {activePlayers} left</Text>
        </View>
      </LinearGradient>

      {/* Main play area */}
      <View style={styles.playArea}>
        <Animated.View style={[styles.itemCard, { opacity: fadeAnim }]}>
          <Text style={styles.itemEmoji}>{currentItem.emoji}</Text>
          <Text style={[styles.itemName, { color: isDark ? '#F2B705' : '#2B1C04' }]}>
            {currentItem.name} Udd
          </Text>
          <Text style={[styles.itemHint, { color: isDark ? '#888' : '#666' }]}>
            {phase === 'announce' ? 'Get ready…' :
             phase === 'react'   ? `Tap in ${timeLeft}s if it flies!` :
             feedbackMsg}
          </Text>
        </Animated.View>

        {/* Timer bar */}
        {phase === 'react' && (
          <View style={styles.timerBarBg}>
            <Animated.View
              style={[
                styles.timerBarFill,
                { width: `${(timeLeft / 3) * 100}%` as any },
              ]}
            />
          </View>
        )}

        {/* Tap button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleTap}
          disabled={phase !== 'react' || isEliminated}
          style={styles.tapBtnWrapper}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <LinearGradient
              colors={phase === 'react' ? ['#F2B705', '#D49A00'] : ['#333', '#222']}
              style={styles.tapBtn}
            >
              <Text style={styles.tapBtnGlyph}>🐦</Text>
              <Text style={[styles.tapBtnText, phase !== 'react' && { color: '#555' }]}>
                {phase === 'react' ? 'TAP!' : phase === 'announce' ? 'Wait…' : '…'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        {isEliminated && (
          <Text style={styles.eliminatedText}>You're out! Watching others…</Text>
        )}
      </View>
    </View>
  );
};

export default ChidiyaGameScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 18, paddingBottom: 14 },
  topBarContent: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: { fontSize: 15, fontWeight: '800', color: '#2B1C04' },
  scorePill: {
    backgroundColor: 'rgba(43,28,4,0.15)',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 14,
  },
  scoreText: { fontSize: 13, fontWeight: '800', color: '#2B1C04' },
  playersLeft: { fontSize: 13, fontWeight: '700', color: '#2B1C04' },

  playArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  itemCard: {
    alignItems: 'center', marginBottom: 32,
    padding: 24,
  },
  itemEmoji: { fontSize: 80, marginBottom: 12 },
  itemName: { fontSize: 28, fontWeight: '900', letterSpacing: 0.5 },
  itemHint: { fontSize: 14, marginTop: 6, fontWeight: '500', textAlign: 'center' },

  timerBarBg: {
    width: '80%', height: 6,
    backgroundColor: 'rgba(242,183,5,0.2)',
    borderRadius: 3, marginBottom: 32, overflow: 'hidden',
  },
  timerBarFill: {
    height: 6, backgroundColor: '#F2B705', borderRadius: 3,
  },

  tapBtnWrapper: { marginTop: 8 },
  tapBtn: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#F2B705', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  tapBtnGlyph: { fontSize: 40 },
  tapBtnText: { fontSize: 18, fontWeight: '900', color: '#2B1C04', marginTop: 4 },

  eliminatedText: {
    marginTop: 20, fontSize: 13, color: '#E6483A', fontWeight: '600',
  },
});
