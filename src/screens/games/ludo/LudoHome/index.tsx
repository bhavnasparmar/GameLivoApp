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

interface ModeTile {
  id: string;
  title: string;
  subtitle: string;
  glyph: string;
  badge: string;
  gradient: [string, string];
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

  const modeTiles: ModeTile[] = [
    {
      id: 'computer',
      title: 'Play with Robot',
      subtitle: '1 to 6 Players · Smart AI Bots',
      glyph: '🤖',
      badge: 'SOLO & BOTS',
      gradient: ['#C0392B', '#781515'],
      borderColor: '#E74C3C',
      onPress: () => handleSelectMode('computer'),
    },
    {
      id: 'random',
      title: 'Quick Match',
      subtitle: 'Fast matchmaking with real players',
      glyph: '⚡',
      badge: '3,480 ONLINE',
      gradient: ['#2980B9', '#154360'],
      borderColor: '#3498DB',
      onPress: () => handleSelectMode('random'),
    },
    {
      id: 'private',
      title: 'Play with Friends',
      subtitle: 'Create Room (1-6P) / Join with PIN',
      glyph: '🔒',
      badge: 'CUSTOM ROOM',
      gradient: ['#27AE60', '#145A32'],
      borderColor: '#2ECC71',
      onPress: () => handleSelectMode('private'),
    },
    {
      id: 'local',
      title: 'Pass & Play',
      subtitle: '2 to 6 Players on one device',
      glyph: '📱',
      badge: 'LOCAL OFFLINE',
      gradient: ['#8E44AD', '#512E5F'],
      borderColor: '#9B59B6',
      onPress: () => handleSelectMode('local'),
    },
  ];

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
            <Text style={styles.appBarTitle}>LUDO CHAMPIONSHIP</Text>
          </View>

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
          colors={['#1E272E', '#2C3E50', '#1A252F']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroBadgeWrap}>
              <LinearGradient colors={['#F39C12', '#D35400']} style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>🏆 1 TO 6 PLAYERS</Text>
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>Master The Board</Text>
            <Text style={styles.heroSubtitle}>
              Roll 6s, knock out rivals, and race your tokens to victory!
            </Text>

            <View style={styles.heroFeaturesRow}>
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>🎲</Text>
                <Text style={styles.featureText}>3D Physics Dice</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>👥</Text>
                <Text style={styles.featureText}>1-6 Players</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureEmoji}>⚡</Text>
                <Text style={styles.featureText}>Smooth Hopping</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Action Button: Quick Rules */}
        <View style={styles.rulesBtnRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.rulesBtn}
            onPress={() => setShowRulesModal(true)}
          >
            <Text style={styles.rulesBtnIcon}>📖</Text>
            <Text style={styles.rulesBtnText}>Official Ludo Rules & Guide</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Tiles */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1A252F' }]}>
          Select Game Mode
        </Text>

        <View style={styles.tilesGrid}>
          {modeTiles.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              activeOpacity={0.85}
              style={[styles.modeCard, { borderColor: tile.borderColor }]}
              onPress={tile.onPress}
            >
              <LinearGradient
                colors={tile.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modeCardGradient}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardGlyph}>{tile.glyph}</Text>
                  <View style={styles.cardBadge}>
                    <Text style={styles.cardBadgeText}>{tile.badge}</Text>
                  </View>
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.cardTitle}>{tile.title}</Text>
                  <Text style={styles.cardSubtitle}>{tile.subtitle}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Section */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1A252F', marginTop: 24 }]}>
          Your Ludo Career
        </Text>

        <View style={styles.statsCard}>
          <LinearGradient
            colors={['#1F2937', '#111827']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsGradient}
          >
            <View style={styles.statCol}>
              <Text style={styles.statVal}>{ludoStats.gamesPlayed || 0}</Text>
              <Text style={styles.statLbl}>Matches</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: '#2ECC71' }]}>
                {ludoStats.winRate || (ludoStats.gamesPlayed ? Math.round(((ludoStats.wins || 0) / ludoStats.gamesPlayed) * 100) : 0)}%
              </Text>
              <Text style={styles.statLbl}>Win Rate</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={[styles.statVal, { color: '#F1C40F' }]}>
                {ludoStats.rank || 1500}
              </Text>
              <Text style={styles.statLbl}>Ludo Rating</Text>
            </View>
          </LinearGradient>
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
  heroBanner: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 16,
  },
  heroContent: {
    width: '100%',
  },
  heroBadgeWrap: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#BDC3C7',
    lineHeight: 18,
    marginBottom: 14,
  },
  heroFeaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  featureText: {
    fontSize: 11,
    color: '#ECF0F1',
    fontWeight: '700',
  },
  rulesBtnRow: {
    marginBottom: 18,
  },
  rulesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderRadius: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  rulesBtnIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  rulesBtnText: {
    color: '#E74C3C',
    fontWeight: '800',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modeCard: {
    width: (width - 44) / 2,
    height: 140,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modeCardGradient: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardGlyph: {
    fontSize: 28,
  },
  cardBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cardBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  cardBottom: {},
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
  },
  statsCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statsGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLbl: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
