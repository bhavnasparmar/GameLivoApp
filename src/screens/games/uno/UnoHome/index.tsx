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

export const UnoHomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  const userCoins = useAppSelector((state) => state.user.profile?.coins) || 1500;

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

  const modeTiles: ModeTile[] = [
    {
      id: 'computer',
      title: 'Play with Robot',
      subtitle: '1v1 & 4P Table · Easy to Hard AI',
      glyph: '🤖',
      badge: 'INSTANT PLAY',
      gradient: ['#C0392B', '#781515'],
      borderColor: '#E74C3C',
      onPress: () => handleSelectMode('computer'),
    },
    {
      id: 'random',
      title: 'Quick Match',
      subtitle: 'Online random opponents',
      glyph: '⚡',
      badge: '2,110 ONLINE',
      gradient: ['#2980B9', '#154360'],
      borderColor: '#3498DB',
      onPress: () => handleSelectMode('random'),
    },
    {
      id: 'private',
      title: 'Play with Friends',
      subtitle: 'Create / Join with code',
      glyph: '🔒',
      badge: 'CUSTOM ROOM',
      gradient: ['#27AE60', '#145A32'],
      borderColor: '#2ECC71',
      onPress: () => handleSelectMode('private'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#080E0B' : '#F2F8F4' }]}>
      <StatusBar barStyle="light-content" />

      {/* Top App Bar */}
      <LinearGradient
        colors={['#C0392B', '#922B21', '#641E16']}
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
            <Text style={styles.appBarTitle}>UNO CHAMPIONSHIP</Text>
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
          colors={['#E74C3C', '#C0392B', '#8E1A1A']}
          style={styles.heroBanner}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>SPEED 3-CARD RULES · 108 DECK</Text>
            </View>
            <Text style={styles.heroTitle}>Master the Color & Action Cards</Text>
            <Text style={styles.heroSubtitle}>
              Match colors & numbers, drop +4 Wilds, and shout UNO before your rivals!
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.heroActionBtn}
              onPress={() => handleSelectMode('computer')}
            >
              <LinearGradient
                colors={['#F1C40F', '#F39C12']}
                style={styles.heroActionGradient}
              >
                <Text style={styles.heroActionText}>⚡ PLAY VS ROBOT NOW</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.heroEmblem}>
            <Text style={styles.heroEmblemText}>🂡</Text>
          </View>
        </LinearGradient>

        {/* Section: Select Game Mode */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SELECT GAME MODE</Text>
        </View>

        <View style={styles.tilesGrid}>
          {modeTiles.map((tile, index) => {
            const isFullWidth = index === modeTiles.length - 1;
            return (
              <TouchableOpacity
                key={tile.id}
                activeOpacity={0.82}
                style={[
                  styles.tileCard,
                  isFullWidth && styles.tileCardFull,
                  {
                    borderColor: tile.borderColor,
                  },
                ]}
                onPress={tile.onPress}
              >
                <LinearGradient colors={tile.gradient} style={styles.tileGradient}>
                  <View style={styles.tileTopRow}>
                    <Text style={styles.tileGlyph}>{tile.glyph}</Text>
                    <View style={styles.tileBadgeWrap}>
                      <Text style={styles.tileBadgeText}>{tile.badge}</Text>
                    </View>
                  </View>

                  <View style={styles.tileBottom}>
                    <Text style={styles.tileTitle}>{tile.title}</Text>
                    <Text style={styles.tileSub}>{tile.subtitle}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Guide & Rules Strip */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.guideCard}
          onPress={() => handleSelectMode('rules')}
        >
          <LinearGradient
            colors={['#1E272E', '#0F1418']}
            style={styles.guideGradient}
          >
            <Text style={styles.guideIcon}>📖</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.guideTitle}>Complete Uno Rules & Action Cards Guide</Text>
              <Text style={styles.guideSub}>Learn Skip, Reverse, +2, +4 Wild rules and penalties</Text>
            </View>
            <Text style={styles.guideArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    paddingBottom: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  titleWrap: {
    alignItems: 'center',
  },
  appBarTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  coinDot: {
    fontSize: 13,
  },
  coinText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFD700',
  },
  content: {
    padding: 16,
  },
  heroBanner: {
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#FF7675',
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  heroBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#F1C40F',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#FFD2D2',
    lineHeight: 16,
    marginBottom: 12,
  },
  heroActionBtn: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  heroActionGradient: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  heroActionText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#1C1204',
    letterSpacing: 0.5,
  },
  heroEmblem: {
    position: 'absolute',
    right: -10,
    bottom: -15,
    opacity: 0.25,
  },
  heroEmblemText: {
    fontSize: 110,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E74C3C',
    letterSpacing: 1,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  tileCard: {
    width: TILE_WIDTH,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  tileCardFull: {
    width: '100%',
  },
  tileGradient: {
    padding: 14,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileGlyph: {
    fontSize: 26,
  },
  tileBadgeWrap: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tileBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tileBottom: {
    marginTop: 10,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  tileSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#E0E0E0',
    marginTop: 2,
  },
  guideCard: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  guideGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  guideIcon: {
    fontSize: 26,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  guideSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#A0B2A6',
    marginTop: 2,
  },
  guideArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: '#E74C3C',
  },
});

export default UnoHomeScreen;
