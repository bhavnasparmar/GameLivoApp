import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { selectUserProfile, selectUserCoins } from '../../../redux/selectors/userSelectors';
import { fetchProfileSuccess } from '../../../redux/slices/userSlice';
import { selectGame } from '../../../redux/slices/gameSlice';
import { userService } from '../../../services/user/userService';
import { gameService } from '../../../services/games/gameService';
import { Game, GameId } from '../../../types/game';
import { GAMES } from '../../../constants/gameConstants';
import { ROUTES } from '../../../navigation/routes';

const { width } = Dimensions.get('window');
const TILE_WIDTH = (width - 40 - 14) / 2;

interface GameCardMeta {
  id: GameId;
  name: string;
  glyph: string;
  tag: string;
  onlineCount: string;
  gradient: string[];
  route: string;
}

const GAME_CARDS: GameCardMeta[] = [
  {
    id: 'chess',
    name: 'Chess',
    glyph: '♞',
    tag: '1v1 · Ranked',
    onlineCount: '1,204 online',
    gradient: ['#4A4238', '#211C17'],
    route: ROUTES.CHESS_HOME || 'ChessHome',
  },
  {
    id: 'ludo',
    name: 'Ludo',
    glyph: '⛃',
    tag: '2–4 players',
    onlineCount: '3,890 online',
    gradient: ['#2668D9', '#123A80'],
    route: ROUTES.LUDO_HOME || 'LudoHome',
  },
  {
    id: 'uno',
    name: 'Uno',
    glyph: '🂡',
    tag: '2–6 players',
    onlineCount: '2,110 online',
    gradient: ['#E6483A', '#8F1D13'],
    route: ROUTES.UNO_HOME || 'UnoHome',
  },
  {
    id: 'snakeLadder',
    name: 'Snake & Ladder',
    glyph: '🐍',
    tag: '2–6 players',
    onlineCount: '960 online',
    gradient: ['#1F9D55', '#0D5230'],
    route: ROUTES.SNAKE_LADDER_HOME || 'SnakeLadderHome',
  },
  {
    id: 'chidiyaUdd',
    name: 'Chidiya Udd',
    glyph: '🐦',
    tag: 'Up to 8 players',
    onlineCount: '540 online',
    gradient: ['#F2B705', '#A67200'],
    route: ROUTES.CHIDIYA_HOME || 'ChidiyaHome',
  },
  {
    id: 'esto',
    name: 'Esto',
    glyph: '🐚',
    tag: 'Chowka Bara',
    onlineCount: '720 online',
    gradient: ['#9A4BD1', '#4C1F70'],
    route: ROUTES.ESTO_HOME || 'EstoHome',
  },
];

interface OnlineFriend {
  id: string;
  initials: string;
  name: string;
  status: string;
}

const SAMPLE_FRIENDS: OnlineFriend[] = [
  { id: '1', initials: 'RS', name: 'Riya', status: 'Playing Ludo' },
  { id: '2', initials: 'KV', name: 'Karan', status: 'In lobby' },
  { id: '3', initials: 'MJ', name: 'Meera', status: 'Playing Uno' },
  { id: '4', initials: 'TP', name: 'Tanvi', status: 'Online' },
  { id: '5', initials: 'SP', name: 'Sanya', status: 'Playing Chess' },
];

export const GameHubScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { theme, isDark } = useTheme();

  const userProfile = useAppSelector(selectUserProfile);
  const userCoins = useAppSelector(selectUserCoins);

  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeGames, setActiveGames] = useState<Game[]>(GAMES);

  const displayName = userProfile?.name?.split(' ')[0] || 'Player';
  const userInitials = (userProfile?.name || 'Player')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const loadData = useCallback(async () => {
    try {
      const [profileData, gamesData] = await Promise.all([
        userService.getProfile().catch(() => null),
        gameService.getGames().catch(() => GAMES),
      ]);

      if (profileData) {
        dispatch(fetchProfileSuccess(profileData));
      }
      if (gamesData && gamesData.length > 0) {
        setActiveGames(gamesData);
      }
    } catch {
      // Keep existing state
    }
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenGame = (card: GameCardMeta) => {
    const matchedGame = activeGames.find(g => g.id === card.id) || {
      id: card.id,
      name: card.name,
      description: card.tag,
      icon: '',
      banner: '',
      minPlayers: 2,
      maxPlayers: 4,
      estimatedDuration: '15m',
      modes: ['classic', 'quick'],
      isActive: true,
      isFeatured: false,
      category: 'board' as const,
    };

    dispatch(selectGame(matchedGame));

    // Try navigating to game specific route, fallback to LudoHome or alert
    if (navigation.navigate) {
      try {
        navigation.navigate(card.route);
      } catch {
        // In case stack is restricted, try LudoHome
        navigation.navigate('LudoHome');
      }
    }
  };

  const filteredCards = GAME_CARDS.filter(card =>
    card.name.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#171B20' : '#F8F2E2' }]}>
      <StatusBar barStyle="light-content" />

      {/* Top App Bar with Deep Emerald Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['#0F3628', '#0A2019', '#061611']
            : ['#155A3F', '#0F4530', '#0B3323']
        }
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 10, 28) }]}
      >
        <View style={styles.appBarRow}>
          {/* Brand & Greeting */}
          <View style={styles.brandRow}>
            <LinearGradient
              colors={['#F0C64A', '#D4A017', '#A6740C']}
              style={styles.brandMark}
            >
              <Text style={styles.brandIcon}>🎲</Text>
            </LinearGradient>
            <View>
              <Text style={styles.greetingTitle}>Namaste, {displayName}</Text>
              <Text style={styles.greetingSub}>Ready for a match?</Text>
            </View>
          </View>

          {/* Right: Coin + Bell */}
          <View style={styles.appBarRight}>
            {/* Coin Pill */}
            <View style={styles.coinPill}>
              <View style={styles.coinDot} />
              <Text style={styles.coinText}>
                {(userCoins || 2480).toLocaleString()}
              </Text>
            </View>

            {/* Notification Bell */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                try { navigation.navigate('Notifications' as never); } catch { /* ignore */ }
              }}
              style={styles.bellBtn}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              {/* Unread dot */}
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Row & Avatar Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Search games or friends…"
              placeholderTextColor="rgba(255, 255, 255, 0.65)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* User Avatar Circle */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              try {
                navigation.navigate('Profile');
              } catch {
                // Ignore fallback
              }
            }}
          >
            <LinearGradient
              colors={['#E6483A', '#A52418']}
              style={styles.avatarBtn}
            >
              <Text style={styles.avatarBtnText}>{userInitials}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Body */}
      <ScrollView
        contentContainerStyle={[styles.scrollBody, { paddingBottom: Math.max(insets.bottom + 20, 32) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4A017"
            colors={['#D4A017', '#1F9D55']}
          />
        }
      >
        {/* Daily Bonus Banner */}
        <LinearGradient
          colors={['#183021', '#102017']}
          style={[
            styles.bannerCard,
            { borderColor: isDark ? 'rgba(212, 160, 23, 0.3)' : 'rgba(212, 160, 23, 0.2)' },
          ]}
        >
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerBadge}>🎁 DAILY REWARD</Text>
            <Text style={styles.bannerTitle}>Claim 250 Free Coins</Text>
            <Text style={styles.bannerSub}>Spin the daily lucky wheel & win big</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.claimBtn}>
            <LinearGradient
              colors={['#F0C64A', '#D4A017']}
              style={styles.claimBtnGradient}
            >
              <Text style={styles.claimBtnText}>Claim</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Section Header: Choose a game */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#F1F4F7' : '#241C15' },
            ]}
          >
            Choose a game
          </Text>
          <TouchableOpacity>
            <Text style={[styles.sectionLink, { color: theme.colors.accentLight || '#D4A017' }]}>
              See all
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2-Column Game Grid */}
        <View style={styles.gameGrid}>
          {filteredCards.map(card => (
            <TouchableOpacity
              key={card.id}
              activeOpacity={0.88}
              onPress={() => handleOpenGame(card)}
              style={styles.tileWrapper}
            >
              <LinearGradient
                colors={card.gradient}
                style={styles.tile}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Live Online Badge */}
                <View style={styles.tileLiveBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.tileLiveText}>{card.onlineCount}</Text>
                </View>

                {/* Big Watermarked Glyph */}
                <Text style={styles.tileGlyph}>{card.glyph}</Text>

                {/* Title & Tag */}
                <View style={styles.tileBottom}>
                  <Text style={styles.tileTitle}>{card.name}</Text>
                  <Text style={styles.tileTag}>{card.tag}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section Header: Friends Online */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#F1F4F7' : '#241C15' },
            ]}
          >
            Friends online
          </Text>
          <TouchableOpacity
            onPress={() => {
              try {
                navigation.navigate('Friends');
              } catch {
                // Ignore fallback
              }
            }}
          >
            <Text style={[styles.sectionLink, { color: theme.colors.accentLight || '#D4A017' }]}>
              Invite
            </Text>
          </TouchableOpacity>
        </View>

        {/* Friends Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.friendsScroll}
        >
          {SAMPLE_FRIENDS.map(friend => (
            <TouchableOpacity
              key={friend.id}
              activeOpacity={0.8}
              style={styles.friendCard}
            >
              <View style={styles.friendAvatarContainer}>
                <LinearGradient
                  colors={['#F0C64A', '#D4A017']}
                  style={styles.friendAvatar}
                >
                  <Text style={styles.friendAvatarText}>{friend.initials}</Text>
                </LinearGradient>
                <View
                  style={[
                    styles.onlineDot,
                    { borderColor: isDark ? '#171B20' : '#F8F2E2' },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.friendName,
                  { color: isDark ? '#F1F4F7' : '#241C15' },
                ]}
                numberOfLines={1}
              >
                {friend.name}
              </Text>
              <Text
                style={[
                  styles.friendStatus,
                  { color: isDark ? '#96A1AD' : '#6B6154' },
                ]}
                numberOfLines={1}
              >
                {friend.status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  brandIcon: {
    fontSize: 20,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  greetingSub: {
    fontSize: 11.5,
    color: '#BCD8C8',
    fontWeight: '500',
  },
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
    gap: 6,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 18,
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#E6483A',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 54, 40, 0.9)',
  },
  coinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F0C64A',
    shadowColor: '#F0C64A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  coinText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearSearchText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  avatarBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  scrollBody: {
    padding: 18,
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerLeft: {
    flex: 1,
    marginRight: 10,
  },
  bannerBadge: {
    color: '#F0C64A',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  bannerSub: {
    color: '#BCD8C8',
    fontSize: 11.5,
  },
  claimBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  claimBtnGradient: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtnText: {
    color: '#2B1C04',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 24,
  },
  tileWrapper: {
    width: TILE_WIDTH,
    height: 154,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tileLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignSelf: 'flex-end',
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    borderRadius: 8,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5CF27A',
  },
  tileLiveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tileGlyph: {
    position: 'absolute',
    right: 4,
    bottom: -6,
    fontSize: 68,
    opacity: 0.2,
    transform: [{ rotate: '-8deg' }],
  },
  tileBottom: {
    zIndex: 2,
  },
  tileTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tileTag: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
  friendsScroll: {
    gap: 12,
    paddingBottom: 8,
  },
  friendCard: {
    width: 86,
    alignItems: 'center',
  },
  friendAvatarContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  friendAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  friendAvatarText: {
    color: '#3A2705',
    fontSize: 16,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4BD07A',
    borderWidth: 2.5,
  },
  friendName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  friendStatus: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 1,
  },
});

export default GameHubScreen;
