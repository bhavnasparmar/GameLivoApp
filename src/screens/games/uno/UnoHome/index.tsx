import React from 'react';
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

const { width } = Dimensions.get('window');
const TILE_WIDTH = (width - 36 - 12) / 2;

interface ModeOption {
  id: string;
  title: string;
  subtitle: string;
  glyph: string;
  playersCount: string;
  gradient: string[];
  borderColor: string;
  onPress: () => void;
}

export const UnoHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const userCoins = userProfile?.coins || 1500;
  const unoStats = userProfile?.gameStats?.find((g) => g.gameId === 'uno') || {
    gamesPlayed: 34,
    wins: 22,
    rank: 1480,
    winRate: 65,
  };

  const handleSelectMode = (mode: string) => {
    if (mode === 'computer') {
      navigation.navigate(ROUTES.UNO_MODE, { initialMode: 'computer' });
    } else if (mode === 'local') {
      navigation.navigate(ROUTES.UNO_MODE, { initialMode: 'local' });
    } else if (mode === 'rules') {
      navigation.navigate(ROUTES.UNO_MODE, { initialMode: 'rules' });
    } else if (mode === 'random') {
      navigation.navigate(ROUTES.UNO_LOBBY, { isHost: false, mode: 'random' });
    } else if (mode === 'private') {
      navigation.navigate(ROUTES.UNO_LOBBY, { isHost: true, mode: 'private' });
    }
  };

  const modeTiles: ModeOption[] = [
    {
      id: 'computer',
      title: 'VS Robot',
      subtitle: '1v1 & 4P Table · AI Bots',
      glyph: '🤖',
      playersCount: 'Instant Play',
      gradient: isDark ? ['#381F1F', '#201010'] : ['#FDE8E8', '#F7D0D0'],
      borderColor: '#E74C3C',
      onPress: () => handleSelectMode('computer'),
    },
    {
      id: 'local',
      title: 'Pass & Play',
      subtitle: '2 to 4 Players on 1 device',
      glyph: '👥',
      playersCount: 'Offline Mode',
      gradient: isDark ? ['#362E20', '#221C12'] : ['#FFF8E7', '#FCEEC8'],
      borderColor: '#D4A017',
      onPress: () => handleSelectMode('local'),
    },
    {
      id: 'random',
      title: 'Quick Match',
      subtitle: 'Random online opponent',
      glyph: '⚡',
      playersCount: '2,110 online',
      gradient: isDark ? ['#1F2B3E', '#111824'] : ['#E6F0FA', '#D0E2F7'],
      borderColor: '#2668D9',
      onPress: () => handleSelectMode('random'),
    },
    {
      id: 'private',
      title: 'Play with Friends',
      subtitle: 'Create / Join with code',
      glyph: '🔒',
      playersCount: 'Custom Room',
      gradient: isDark ? ['#1F3624', '#102014'] : ['#E8F8F0', '#D0F2E0'],
      borderColor: '#2ECC71',
      onPress: () => handleSelectMode('private'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0F0B0B' : '#FBF6F6' }]}>
      <StatusBar barStyle="light-content" />

      {/* Top App Bar */}
      <LinearGradient
        colors={isDark ? ['#421212', '#2B0B0B', '#1A0606'] : ['#C0392B', '#922B21', '#641E16']}
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 10, 28) }]}
      >
        <View style={styles.appBarRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>UNO Championship</Text>
          <View style={styles.coinPill}>
            <Text style={styles.coinDot}>🪙</Text>
            <Text style={styles.coinText}>{userCoins.toLocaleString()}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={isDark ? ['#451B1B', '#291010', '#180A0A'] : ['#D32F2F', '#B71C1C', '#8E1A1A']}
          style={styles.heroCard}
        >
          <View style={styles.heroEmblem}>
            <Text style={styles.heroGlyph}>🂡</Text>
          </View>
          <View style={styles.heroContent}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>2,110 Players Online</Text>
            </View>
            <Text style={styles.heroTitle}>Uno Master Classic</Text>
            <Text style={styles.heroSub}>Speed 3-Card Rules · Action Cards & Wilds</Text>
          </View>
        </LinearGradient>

        {/* Mode Selection Grid */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FF7675' : '#C0392B' }]}>
          SELECT GAME MODE
        </Text>

        <View style={styles.grid}>
          {modeTiles.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              activeOpacity={0.82}
              style={[
                styles.modeTile,
                {
                  borderColor: tile.borderColor,
                },
              ]}
              onPress={tile.onPress}
            >
              <LinearGradient colors={tile.gradient} style={styles.tileGradient}>
                <View style={styles.tileHeader}>
                  <Text style={styles.tileGlyph}>{tile.glyph}</Text>
                  <Text style={[styles.tileBadge, { color: tile.borderColor }]}>
                    {tile.playersCount}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.tileTitle,
                    { color: isDark ? '#FFFFFF' : '#1A2318' },
                  ]}
                >
                  {tile.title}
                </Text>
                <Text
                  style={[
                    styles.tileSubtitle,
                    { color: isDark ? '#A9B7C6' : '#636E72' },
                  ]}
                >
                  {tile.subtitle}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Interactive Rules & Guide Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.rulesLinkCard,
            {
              backgroundColor: isDark ? '#1C1212' : '#FFFFFF',
              borderColor: isDark ? 'rgba(231,76,60,0.35)' : '#FADBD8',
            },
          ]}
          onPress={() => handleSelectMode('rules')}
        >
          <LinearGradient
            colors={isDark ? ['rgba(231,76,60,0.15)', 'transparent'] : ['rgba(231,76,60,0.08)', 'transparent']}
            style={styles.rulesGradient}
          >
            <View style={styles.rulesLeft}>
              <Text style={styles.rulesIcon}>📖</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rulesTitle, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>
                  How to Play UNO
                </Text>
                <Text style={[styles.rulesSub, { color: isDark ? '#A9B7C6' : '#636E72' }]}>
                  Skip, Reverse, +2, Wild cards, and Uno shout penalties
                </Text>
              </View>
            </View>
            <Text style={styles.rulesChevron}>›</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Player Stats Snapshot */}
        <View
          style={[
            styles.statsCard,
            {
              backgroundColor: isDark ? '#160E0E' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5E6E6',
            },
          ]}
        >
          <Text style={[styles.statsHeader, { color: isDark ? '#FF7675' : '#C0392B' }]}>
            YOUR UNO STATS
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#1A2318' }]}>
                {unoStats.rank || 1480}
              </Text>
              <Text style={styles.statLabel}>Skill Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: isDark ? '#5CF27A' : '#1F9D55' }]}>
                {unoStats.winRate || (unoStats.gamesPlayed ? Math.round(((unoStats.wins || 0) / unoStats.gamesPlayed) * 100) : 0)}%
              </Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: isDark ? '#F0C64A' : '#D4A017' }]}>
                {unoStats.gamesPlayed || 0}
              </Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  appBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
  },
  coinDot: {
    fontSize: 13,
  },
  coinText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F0C64A',
  },
  content: {
    padding: 16,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(231,76,60,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  heroEmblem: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderWidth: 1.5,
    borderColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroGlyph: {
    fontSize: 34,
    color: '#FF7675',
  },
  heroContent: {
    flex: 1,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(31, 157, 85, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5CF27A',
  },
  liveText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#5CF27A',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 12,
    color: '#FFCDD2',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  modeTile: {
    width: TILE_WIDTH,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  tileGradient: {
    padding: 16,
    minHeight: 124,
    justifyContent: 'space-between',
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tileGlyph: {
    fontSize: 28,
  },
  tileBadge: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 10,
  },
  tileSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  rulesLinkCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  rulesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rulesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rulesIcon: {
    fontSize: 26,
  },
  rulesTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  rulesSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  rulesChevron: {
    fontSize: 24,
    fontWeight: '600',
    color: '#E74C3C',
    marginLeft: 8,
  },
  statsCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  statsHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 14,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 11,
    color: '#95A5A6',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

export default UnoHomeScreen;
