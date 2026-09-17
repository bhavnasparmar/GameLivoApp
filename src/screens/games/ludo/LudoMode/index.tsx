import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { useAppSelector } from '../../../../redux/hooks';
import { LudoDifficulty } from '../../../../gameEngine/ludo/ludoTypes';

const { width } = Dimensions.get('window');

export const PLAYER_COUNT_OPTIONS = [
  { count: 1, label: '1 Player', title: 'Solo vs Bots', icon: '🤖', desc: 'Play with 1-5 Bots', badge: 'PRACTICE' },
  { count: 2, label: '2 Players', title: '1v1 Duel', icon: '⚔️', desc: 'Fast & Intense', badge: 'POPULAR' },
  { count: 3, label: '3 Players', title: '3-Way Trio', icon: '⚡', desc: 'Triangle Battle', badge: 'FAST' },
  { count: 4, label: '4 Players', title: 'Classic 4P', icon: '🎯', desc: 'Official Quad', badge: 'CLASSIC' },
  { count: 5, label: '5 Players', title: 'Squad 5P', icon: '🌟', desc: '5-Way Mayhem', badge: 'MEGA' },
  { count: 6, label: '6 Players', title: 'Hexa 6P', icon: '🔥', desc: 'Full Hexagon Board', badge: 'ROYALE' },
];

export const DIFFICULTY_OPTIONS: Array<{ id: LudoDifficulty; label: string; desc: string; icon: string }> = [
  { id: 'easy', label: 'Casual', desc: 'Relaxed bot moves', icon: '🌱' },
  { id: 'medium', label: 'Balanced', desc: 'Smart captures & tactics', icon: '⚡' },
  { id: 'hard', label: 'Master AI', desc: 'Aggressive knockout strategy', icon: '🧠' },
];

export const TURN_TIME_OPTIONS = [
  { seconds: 10, label: '10s Blitz', tag: 'Fast' },
  { seconds: 15, label: '15s Standard', tag: 'Recommended' },
  { seconds: 30, label: '30s Relaxed', tag: 'Casual' },
];

export const LudoModeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const userCoins = userProfile?.coins || 2500;

  const initialMode = route.params?.initialMode || 'computer';

  // Selected Configurations
  const [selectedPlayerCount, setSelectedPlayerCount] = useState<number>(4);
  const [selectedDifficulty, setSelectedDifficulty] = useState<LudoDifficulty>('medium');
  const [selectedTurnTime, setSelectedTurnTime] = useState<number>(15);

  const handleStartGame = () => {
    if (initialMode === 'computer' || selectedPlayerCount === 1) {
      // Direct vs Bots
      navigation.navigate(ROUTES.LUDO_GAME, {
        mode: 'computer',
        playerCount: selectedPlayerCount,
        difficulty: selectedDifficulty,
        timeSeconds: selectedTurnTime,
      });
    } else if (initialMode === 'local') {
      // Pass & Play on single device
      navigation.navigate(ROUTES.LUDO_GAME, {
        mode: 'local',
        playerCount: selectedPlayerCount,
        timeSeconds: selectedTurnTime,
      });
    } else {
      // Online Lobby
      navigation.navigate(ROUTES.LUDO_LOBBY, {
        mode: 'private',
        playerCount: selectedPlayerCount,
        timeSeconds: selectedTurnTime,
        isHost: true,
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#08120D' : '#F2F8F4' }]}>
      <StatusBar barStyle="light-content" />

      {/* Top App Bar */}
      <LinearGradient
        colors={['#E74C3C', '#C0392B', '#922B21']}
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 8, 26) }]}
      >
        <View style={styles.appBarRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.appBarTitle}>GAME SETUP</Text>
            <Text style={styles.appBarSubtitle}>
              {initialMode === 'computer'
                ? 'Vs AI Bots'
                : initialMode === 'local'
                ? 'Pass & Play'
                : 'Custom Table'}
            </Text>
          </View>

          <View style={styles.coinPill}>
            <Text style={styles.coinDot}>🪙</Text>
            <Text style={styles.coinText}>{userCoins.toLocaleString()}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Player Count Selection (1, 2, 3, 4, 5, 6 Players) */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1A252F' }]}>
          1. Number of Players
        </Text>

        <View style={styles.playerCountGrid}>
          {PLAYER_COUNT_OPTIONS.map((opt) => {
            const isSelected = selectedPlayerCount === opt.count;
            return (
              <TouchableOpacity
                key={opt.count}
                activeOpacity={0.8}
                style={[
                  styles.countCard,
                  isSelected && styles.selectedCountCard,
                ]}
                onPress={() => setSelectedPlayerCount(opt.count)}
              >
                <LinearGradient
                  colors={
                    isSelected
                      ? ['#E74C3C', '#922B21']
                      : ['#1E272E', '#17202A']
                  }
                  style={styles.countCardGradient}
                >
                  <View style={styles.countHeader}>
                    <Text style={styles.countIcon}>{opt.icon}</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{opt.badge}</Text>
                    </View>
                  </View>

                  <Text style={styles.countTitle}>{opt.title}</Text>
                  <Text style={styles.countDesc}>{opt.desc}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. AI Difficulty (For vs Computer / Bot games) */}
        {(initialMode === 'computer' || selectedPlayerCount === 1) && (
          <>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1A252F', marginTop: 18 }]}>
              2. Robot Difficulty
            </Text>

            <View style={styles.diffRow}>
              {DIFFICULTY_OPTIONS.map((diff) => {
                const isSelected = selectedDifficulty === diff.id;
                return (
                  <TouchableOpacity
                    key={diff.id}
                    activeOpacity={0.8}
                    style={[
                      styles.diffCard,
                      isSelected && styles.selectedDiffCard,
                    ]}
                    onPress={() => setSelectedDifficulty(diff.id)}
                  >
                    <Text style={styles.diffIcon}>{diff.icon}</Text>
                    <Text style={[styles.diffTitle, isSelected && { color: '#E74C3C' }]}>
                      {diff.label}
                    </Text>
                    <Text style={styles.diffDesc}>{diff.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* 3. Turn Timer */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1A252F', marginTop: 18 }]}>
          {(initialMode === 'computer' || selectedPlayerCount === 1) ? '3.' : '2.'} Turn Timer Limit
        </Text>

        <View style={styles.timerRow}>
          {TURN_TIME_OPTIONS.map((opt) => {
            const isSelected = selectedTurnTime === opt.seconds;
            return (
              <TouchableOpacity
                key={opt.seconds}
                activeOpacity={0.8}
                style={[
                  styles.timerPill,
                  isSelected && styles.selectedTimerPill,
                ]}
                onPress={() => setSelectedTurnTime(opt.seconds)}
              >
                <Text style={[styles.timerLabel, isSelected && { color: '#FFFFFF' }]}>
                  ⏱️ {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Bottom Start Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.startBtn}
          onPress={handleStartGame}
        >
          <LinearGradient
            colors={['#E74C3C', '#C0392B', '#922B21']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.startGradient}
          >
            <Text style={styles.startBtnText}>
              START {selectedPlayerCount}P MATCH 🚀
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  appBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  titleWrap: {
    alignItems: 'center',
  },
  appBarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  appBarSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '700',
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  coinDot: {
    fontSize: 14,
    marginRight: 4,
  },
  coinText: {
    color: '#F1C40F',
    fontWeight: '800',
    fontSize: 13,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  playerCountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  countCard: {
    width: (width - 44) / 2,
    height: 110,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  selectedCountCard: {
    borderColor: '#FFFFFF',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  countCardGradient: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  countHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countIcon: {
    fontSize: 22,
  },
  countBadge: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  countTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  countDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '600',
  },
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  diffCard: {
    flex: 1,
    marginHorizontal: 3,
    backgroundColor: '#1E272E',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedDiffCard: {
    borderColor: '#E74C3C',
    backgroundColor: '#2C3E50',
  },
  diffIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  diffTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  diffDesc: {
    color: '#9CA3AF',
    fontSize: 8,
    textAlign: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timerPill: {
    flex: 1,
    marginHorizontal: 3,
    backgroundColor: '#1E272E',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedTimerPill: {
    backgroundColor: '#E74C3C',
    borderColor: '#FFFFFF',
  },
  timerLabel: {
    color: '#BDC3C7',
    fontSize: 11,
    fontWeight: '800',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(8, 18, 13, 0.95)',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  startBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  startGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});

export default LudoModeScreen;
