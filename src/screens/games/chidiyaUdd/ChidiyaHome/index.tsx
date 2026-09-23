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
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { useAppSelector } from '../../../../redux/hooks';
import { GameAnalytics } from '../../../../core/analytics/GameAnalytics';

const { width } = Dimensions.get('window');

// ─── How To Play ──────────────────────────────────────────────────────────────

const HOW_TO_PLAY = [
  { step: '1', text: 'The host calls out an object — it can fly or not!' },
  { step: '2', text: 'If the object CAN fly, tap your finger quickly.' },
  { step: '3', text: 'If it CANNOT fly, do NOT tap.' },
  { step: '4', text: 'Wrong tap = out! Last player standing wins.' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

const ChidiyaHomeScreen: React.FC = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const userProfile = useAppSelector(s => s.user.profile);
  const userCoins   = userProfile?.coins || 2500;
  const stats       = (userProfile?.gameStats as any[])?.find((g: any) => g.gameId === 'chidiyaUdd') || {
    gamesPlayed: 12,
    wins: 8,
    winRate: 67,
  };

  const [joining, setJoining] = useState(false);

  const handleQuickPlay = async () => {
    setJoining(true);
    GameAnalytics.trackGameStarted('chidiyaUdd', 'quick');
    try {
      navigation.navigate(ROUTES.CHIDIYA_LOBBY, { isHost: false, mode: 'quick' });
    } catch {
      navigation.navigate('ChidiyaLobby', { isHost: false, mode: 'quick' });
    } finally {
      setJoining(false);
    }
  };

  const handleCreateRoom = () => {
    GameAnalytics.trackGameStarted('chidiyaUdd', 'private');
    try {
      navigation.navigate(ROUTES.CHIDIYA_LOBBY, { isHost: true, mode: 'private' });
    } catch {
      navigation.navigate('ChidiyaLobby', { isHost: true, mode: 'private' });
    }
  };

  const bg = isDark ? '#1A1408' : '#FFF8E7';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#F2B705', '#D49A00', '#A67200']}
        style={[styles.header, { paddingTop: Math.max(insets.top + 12, 32) }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerGlyph}>🐦</Text>
          <Text style={styles.headerTitle}>Chidiya Udd</Text>
          <Text style={styles.headerSub}>Fast-paced Indian Reaction Game</Text>
        </View>

        <View style={styles.coinPill}>
          <View style={styles.coinDot} />
          <Text style={styles.coinText}>{userCoins.toLocaleString()}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Played', value: stats.gamesPlayed },
            { label: 'Won',    value: stats.wins },
            { label: 'Win %',  value: `${stats.winRate}%` },
          ].map(s => (
            <LinearGradient key={s.label} colors={['#1A1408', '#0E0B04']} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </LinearGradient>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: isDark ? '#F1EFE8' : '#2B1C04' }]}>
          Choose Mode
        </Text>

        {/* Quick Play */}
        <TouchableOpacity activeOpacity={0.88} onPress={handleQuickPlay} disabled={joining}>
          <LinearGradient colors={['#F2B705', '#D49A00']} style={styles.modeCard}>
            <View>
              <Text style={styles.modeGlyph}>⚡</Text>
              <Text style={styles.modeTitle}>Quick Match</Text>
              <Text style={styles.modeSub}>Join a room instantly · 2–8 players</Text>
            </View>
            <Text style={styles.modeArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Private Room */}
        <TouchableOpacity activeOpacity={0.88} onPress={handleCreateRoom} style={{ marginTop: 12 }}>
          <LinearGradient colors={['#222', '#111']} style={[styles.modeCard, styles.modeCardDark]}>
            <View>
              <Text style={styles.modeGlyph}>🔒</Text>
              <Text style={[styles.modeTitle, { color: '#F2B705' }]}>Private Room</Text>
              <Text style={[styles.modeSub, { color: '#888' }]}>Create and invite friends</Text>
            </View>
            <Text style={[styles.modeArrow, { color: '#F2B705' }]}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* How to Play */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#F1EFE8' : '#2B1C04', marginTop: 24 }]}>
          How to Play
        </Text>
        <LinearGradient
          colors={isDark ? ['#1F1908', '#120F04'] : ['#FFF3CC', '#FFE680']}
          style={styles.howToCard}
        >
          {HOW_TO_PLAY.map(item => (
            <View key={item.step} style={styles.howToRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{item.step}</Text>
              </View>
              <Text style={[styles.stepText, { color: isDark ? '#DDD' : '#3A2705' }]}>
                {item.text}
              </Text>
            </View>
          ))}
        </LinearGradient>
      </ScrollView>
    </View>
  );
};

export default ChidiyaHomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 18, paddingBottom: 24,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    alignItems: 'center',
    shadowColor: '#F2B705', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  backBtn: { position: 'absolute', left: 16, top: 48, padding: 8 },
  backBtnText: { fontSize: 22, color: '#2B1C04', fontWeight: '800' },
  headerCenter: { alignItems: 'center' },
  headerGlyph: { fontSize: 52, marginBottom: 4 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#2B1C04', letterSpacing: 0.4 },
  headerSub: { fontSize: 12, color: 'rgba(43,28,4,0.7)', marginTop: 2 },
  coinPill: {
    position: 'absolute', right: 16, top: 52,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(43,28,4,0.15)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 16, gap: 5,
  },
  coinDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2B1C04' },
  coinText: { color: '#2B1C04', fontSize: 12, fontWeight: '800' },
  body: { padding: 18 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  statValue: { fontSize: 20, fontWeight: '900', color: '#F2B705' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 10 },
  modeCard: {
    borderRadius: 18, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#F2B705', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  modeCardDark: { borderWidth: 1, borderColor: 'rgba(242,183,5,0.2)' },
  modeGlyph: { fontSize: 28, marginBottom: 4 },
  modeTitle: { fontSize: 17, fontWeight: '800', color: '#2B1C04' },
  modeSub: { fontSize: 11.5, color: 'rgba(43,28,4,0.7)', marginTop: 2 },
  modeArrow: { fontSize: 24, color: '#2B1C04', fontWeight: '800' },
  howToCard: {
    borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: 'rgba(242,183,5,0.2)',
  },
  howToRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#F2B705', alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { fontSize: 12, fontWeight: '900', color: '#2B1C04' },
  stepText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: '500' },
});
