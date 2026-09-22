import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
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

export const LudoHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const userCoins = userProfile?.coins || 2500;
  const ludoStats = userProfile?.gameStats?.find((g) => g.gameId === 'ludo') || {
    gamesPlayed: 28,
    wins: 19,
    rank: 1520,
    winRate: 68,
  };

  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  const handleSelectMode = (mode: string) => {
    if (mode === 'computer') {
      navigation.navigate(ROUTES.LUDO_MODE, { initialMode: 'computer' });
    } else if (mode === 'local') {
      navigation.navigate(ROUTES.LUDO_MODE, { initialMode: 'local' });
    } else if (mode === 'random') {
      navigation.navigate(ROUTES.LUDO_LOBBY, { isHost: false, mode: 'random' });
    } else if (mode === 'private') {
      navigation.navigate(ROUTES.LUDO_LOBBY, { isHost: true, mode: 'private' });
    }
  };

  const modeTiles: ModeOption[] = [
    {
      id: 'computer',
      title: 'Play with Robot',
      subtitle: '1 to 6 Players · Smart AI Bots',
      glyph: '🤖',
      playersCount: 'Instant Play',
      gradient: isDark ? ['#381F1F', '#201010'] : ['#FDE8E8', '#F7D0D0'],
      borderColor: '#E74C3C',
      onPress: () => handleSelectMode('computer'),
    },
    {
      id: 'local',
      title: 'Pass & Play',
      subtitle: '2 to 6 Players on 1 device',
      glyph: '👥',
      playersCount: 'Offline Mode',
      gradient: isDark ? ['#362038', '#201022'] : ['#F9EBFB', '#F1D1F5'],
      borderColor: '#9B59B6',
      onPress: () => handleSelectMode('local'),
    },
    {
      id: 'random',
      title: 'Quick Match',
      subtitle: 'Random online opponent',
      glyph: '⚡',
      playersCount: '3,480 online',
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
        colors={isDark ? ['#421212', '#2B0B0B', '#1A0606'] : ['#E74C3C', '#C0392B', '#922B21']}
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
          <Text style={styles.appBarTitle}>Ludo Championship</Text>
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
          colors={isDark ? ['#35201A', '#22120C', '#140A06'] : ['#2C3E50', '#1A252F', '#111822']}
          style={styles.heroCard}
        >
          <View style={styles.heroEmblem}>
            <Text style={styles.heroGlyph}>🎲</Text>
          </View>
          <View style={styles.heroContent}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>3,480 Players Online</Text>
            </View>
            <Text style={styles.heroTitle}>Master The Board</Text>
            <Text style={styles.heroSub}>1 to 6 Players · 3D Physics Dice · Classic & Hexa</Text>
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
          onPress={() => setShowRulesModal(true)}
        >
          <LinearGradient
            colors={isDark ? ['rgba(231,76,60,0.15)', 'transparent'] : ['rgba(231,76,60,0.08)', 'transparent']}
            style={styles.rulesGradient}
          >
            <View style={styles.rulesLeft}>
              <Text style={styles.rulesIcon}>📖</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rulesTitle, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>
                  Official Ludo Rules & Guide
                </Text>
                <Text style={[styles.rulesSub, { color: isDark ? '#A9B7C6' : '#636E72' }]}>
                  Opening tokens, bonus rolls, star safe squares, 3-sixes penalty
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
            YOUR LUDO STATS
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: isDark ? '#FFF' : '#1A2318' }]}>
                {ludoStats.rank || 1520}
              </Text>
              <Text style={styles.statLabel}>Ludo Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: isDark ? '#5CF27A' : '#1F9D55' }]}>
                {ludoStats.winRate || (ludoStats.gamesPlayed ? Math.round(((ludoStats.wins || 0) / ludoStats.gamesPlayed) * 100) : 0)}%
              </Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: isDark ? '#F0C64A' : '#D4A017' }]}>
                {ludoStats.gamesPlayed || 0}
              </Text>
              <Text style={styles.statLabel}>Matches</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Rules Modal */}
      <Modal
        visible={showRulesModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRulesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#E74C3C', '#C0392B']}
              style={styles.modalHeader}
            >
              <Text style={styles.modalTitle}>📜 Official Ludo Rules</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowRulesModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleHeading}>1. Opening Tokens 🎲</Text>
                <Text style={styles.ruleText}>
                  A token can only be moved from the Home Yard to the starting square when a 6 is rolled.
                </Text>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleHeading}>2. Bonus Turns ⭐</Text>
                <Text style={styles.ruleText}>
                  You earn an extra dice roll whenever:
                  {'\n'}• You roll a 6
                  {'\n'}• You capture an opponent's token
                  {'\n'}• You get a token into Home center
                </Text>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleHeading}>3. Three 6s Penalty ❌</Text>
                <Text style={styles.ruleText}>
                  Rolling 3 consecutive sixes cancels your turn immediately and passes the turn to the next player.
                </Text>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleHeading}>4. Safe Squares ★</Text>
                <Text style={styles.ruleText}>
                  Tokens resting on Star squares (★) and starting squares cannot be captured by opponent tokens.
                </Text>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleHeading}>5. 1 to 6 Player Support 👥</Text>
                <Text style={styles.ruleText}>
                  Enjoy 1v1 duels, 3-4 player classic boards, or 5-6 player hexagonal mega boards with friends or bots!
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#1E272E',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E74C3C',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  modalBody: {
    padding: 16,
  },
  ruleItem: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
  },
  ruleHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F1C40F',
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 12,
    color: '#D5D8DC',
    lineHeight: 18,
  },
});

export default LudoHomeScreen;
