import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
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
import {
  setGameAssetState,
  setGameDownloadProgress,
} from '../../../redux/slices/downloadSlice';
import { userService } from '../../../services/user/userService';
import { Game, GameId, GameHubCategory } from '../../../types/game';
import { GameAssetState, GameModule } from '../../../types/gameModule';
import { GAMES } from '../../../constants/gameConstants';
import { ROUTES } from '../../../navigation/routes';
import GameCard, { GameCardMeta } from '../../../components/cards/GameCard/GameCard';
import { GameRegistry } from '../../../core/registry/GameRegistry';
import { GameDownloadManager } from '../../../core/download/GameDownloadManager';
import { GameAnalytics } from '../../../core/analytics/GameAnalytics';

const { width } = Dimensions.get('window');

// ─── Hub Category Tabs ────────────────────────────────────────────────────────

interface HubTab {
  key: GameHubCategory;
  label: string;
  emoji: string;
}

const HUB_TABS: HubTab[] = [
  { key: 'popular', label: 'Popular', emoji: '🔥' },
  { key: 'indian',  label: 'Indian',  emoji: '🇮🇳' },
  { key: 'board',   label: 'Board',   emoji: '♟️' },
  { key: 'card',    label: 'Card',    emoji: '🃏' },
];

// ─── Friends ──────────────────────────────────────────────────────────────────

interface OnlineFriend {
  id: string;
  initials: string;
  name: string;
  status: string;
}

const SAMPLE_FRIENDS: OnlineFriend[] = [
  { id: '1', initials: 'RS', name: 'Riya',  status: 'Playing Ludo' },
  { id: '2', initials: 'KV', name: 'Karan', status: 'In lobby' },
  { id: '3', initials: 'MJ', name: 'Meera', status: 'Playing Uno' },
  { id: '4', initials: 'TP', name: 'Tanvi', status: 'Online' },
  { id: '5', initials: 'SP', name: 'Sanya', status: 'Playing Chess' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const GameHubScreen: React.FC = () => {
  const insets        = useSafeAreaInsets();
  const navigation    = useNavigation<any>();
  const dispatch      = useAppDispatch();
  const { theme, isDark } = useTheme();

  const userProfile = useAppSelector(selectUserProfile);
  const userCoins   = useAppSelector(selectUserCoins);
  const downloadMap = useAppSelector(s => s.download.games);

  const [searchQuery,   setSearchQuery]   = useState('');
  const [refreshing,    setRefreshing]    = useState(false);
  const [activeTab,     setActiveTab]     = useState<GameHubCategory>('popular');

  const displayName  = userProfile?.name?.split(' ')[0] || 'Player';
  const userInitials = (userProfile?.name || 'P')
    .split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();

  // ─── Bootstrap ─────────────────────────────────────────────────────────────

  const initAssetStates = useCallback(async () => {
    const modules = GameRegistry.getAllModules();
    await Promise.all(
      modules.map(async m => {
        const state = await GameDownloadManager.getGameStatus(m.gameId);
        const progress = await GameDownloadManager.getDownloadProgress(m.gameId);
        dispatch(setGameAssetState({ gameId: m.gameId, assetState: state }));
        if (state === GameAssetState.DOWNLOADING) {
          dispatch(setGameDownloadProgress({ gameId: m.gameId, progress }));
        }
      }),
    );
  }, [dispatch]);

  useEffect(() => {
    GameAnalytics.trackHubViewed();
    initAssetStates();

    // Listen for download progress updates
    const unsub = GameDownloadManager.addProgressListener((gameId, progress, state) => {
      dispatch(setGameDownloadProgress({ gameId, progress }));
      dispatch(setGameAssetState({ gameId, assetState: state }));
    });
    return unsub;
  }, [dispatch, initAssetStates]);

  const loadProfile = useCallback(async () => {
    try {
      const profileData = await userService.getProfile().catch(() => null);
      if (profileData) dispatch(fetchProfileSuccess(profileData));
    } catch { /* keep existing state */ }
  }, [dispatch]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    await initAssetStates();
    setRefreshing(false);
  };

  // ─── Game Modules (filtered by tab + search) ────────────────────────────────

  const tabModules = useMemo(() =>
    GameRegistry.getModulesByHubCategory(activeTab),
    [activeTab],
  );

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tabModules;
    return GameRegistry.getAllModules().filter(m =>
      m.gameName.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q),
    );
  }, [searchQuery, tabModules]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleOpenGame = useCallback((gameModule: GameModule) => {
    const state = downloadMap[gameModule.gameId]?.state ?? GameAssetState.READY;
    if (state !== GameAssetState.READY) return;

    // Build a Game object for the Redux game slice
    const game: Game = {
      id: gameModule.gameId,
      name: gameModule.gameName,
      description: gameModule.description,
      icon: gameModule.icon,
      banner: '',
      minPlayers: gameModule.minPlayers,
      maxPlayers: gameModule.maxPlayers,
      estimatedDuration: '15–30 min',
      modes: ['classic', 'quick', 'private'],
      isActive: true,
      isFeatured: false,
      category: gameModule.category as any,
    };
    dispatch(selectGame(game));
    GameAnalytics.trackGameOpened(gameModule.gameId);
    gameModule.launchGame(navigation);
  }, [downloadMap, dispatch, navigation]);

  const handleDownload = useCallback(async (gameId: GameId) => {
    GameAnalytics.trackGameDownloadStarted(gameId);
    try {
      await GameDownloadManager.downloadGame(gameId);
      GameAnalytics.trackGameDownloadCompleted(gameId, 0);
    } catch {
      GameAnalytics.trackGameDownloadFailed(gameId, 'unknown');
    }
  }, []);

  const handleTabPress = useCallback((tab: GameHubCategory) => {
    setActiveTab(tab);
    GameAnalytics.trackCategorySelected(tab);
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  const bg = isDark ? '#171B20' : '#F8F2E2';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Top App Bar ─────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={isDark
          ? ['#0F3628', '#0A2019', '#061611']
          : ['#155A3F', '#0F4530', '#0B3323']}
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 10, 28) }]}
      >
        {/* Brand & Greeting */}
        <View style={styles.appBarRow}>
          <View style={styles.brandRow}>
            <LinearGradient colors={['#F0C64A', '#D4A017', '#A6740C']} style={styles.brandMark}>
              <Text style={styles.brandIcon}>🎲</Text>
            </LinearGradient>
            <View>
              <Text style={styles.greetingTitle}>Namaste, {displayName}</Text>
              <Text style={styles.greetingSub}>Ready for a match?</Text>
            </View>
          </View>

          {/* Right: Coin + Bell */}
          <View style={styles.appBarRight}>
            <View style={styles.coinPill}>
              <View style={styles.coinDot} />
              <Text style={styles.coinText}>{(userCoins || 2480).toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { try { navigation.navigate('Notifications' as never); } catch {} }}
              style={styles.bellBtn}
            >
              <Text style={styles.bellIcon}>🔔</Text>
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Row & Avatar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Search games…"
              placeholderTextColor="rgba(255,255,255,0.65)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => { try { navigation.navigate('Profile'); } catch {} }}
          >
            <LinearGradient colors={['#E6483A', '#A52418']} style={styles.avatarBtn}>
              <Text style={styles.avatarBtnText}>{userInitials}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
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
          style={[styles.bannerCard, { borderColor: isDark ? 'rgba(212,160,23,0.3)' : 'rgba(212,160,23,0.2)' }]}
        >
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerBadge}>🎁 DAILY REWARD</Text>
            <Text style={styles.bannerTitle}>Claim 250 Free Coins</Text>
            <Text style={styles.bannerSub}>Spin the lucky wheel & win big</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.claimBtn}>
            <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.claimBtnGradient}>
              <Text style={styles.claimBtnText}>Claim</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Category Tabs ─────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
          style={styles.tabsContainer}
        >
          {HUB_TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                onPress={() => handleTabPress(tab.key)}
                style={[
                  styles.tabChip,
                  isActive && styles.tabChipActive,
                ]}
              >
                {isActive && (
                  <LinearGradient
                    colors={['#1F9D55', '#155A3F']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                )}
                <Text style={styles.tabEmoji}>{tab.emoji}</Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Game Grid (Registry-driven) ───────────────────────────────────── */}
        {filteredModules.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyText, { color: isDark ? '#96A1AD' : '#6B6154' }]}>
              No games found for "{searchQuery}"
            </Text>
          </View>
        ) : (
          <View style={styles.gameGrid}>
            {filteredModules.map(m => {
              const entry   = downloadMap[m.gameId];
              const state   = entry?.state    ?? GameAssetState.READY;
              const progress= entry?.progress ?? 100;
              const cardMeta: GameCardMeta = {
                id: m.gameId,
                name: m.gameName,
                glyph: m.icon,
                tag: m.playerTag,
                onlineCount: m.onlineCountLabel,
                gradient: [m.cardGradient[0], m.cardGradient[1]],
                route: '',
              };
              return (
                <GameCard
                  key={m.gameId}
                  module={m}
                  card={cardMeta}
                  assetState={state}
                  downloadProgress={progress}
                  onPress={() => handleOpenGame(m)}
                  onDownloadPress={() => handleDownload(m.gameId as GameId)}
                />
              );
            })}
          </View>
        )}

        {/* ── Friends Online ────────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F1F4F7' : '#241C15' }]}>
            Friends online
          </Text>
          <TouchableOpacity onPress={() => { try { navigation.navigate('Friends'); } catch {} }}>
            <Text style={[styles.sectionLink, { color: theme.colors.accentLight || '#D4A017' }]}>
              Invite
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsScroll}>
          {SAMPLE_FRIENDS.map(friend => (
            <TouchableOpacity key={friend.id} activeOpacity={0.8} style={styles.friendCard}>
              <View style={styles.friendAvatarContainer}>
                <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>{friend.initials}</Text>
                </LinearGradient>
                <View style={[styles.onlineDot, { borderColor: bg }]} />
              </View>
              <Text style={[styles.friendName, { color: isDark ? '#F1F4F7' : '#241C15' }]} numberOfLines={1}>
                {friend.name}
              </Text>
              <Text style={[styles.friendStatus, { color: isDark ? '#96A1AD' : '#6B6154' }]} numberOfLines={1}>
                {friend.status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // App Bar
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
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D4A017', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  brandIcon: { fontSize: 20 },
  greetingTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
  greetingSub: { fontSize: 11.5, color: '#BCD8C8', fontWeight: '500' },
  appBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coinPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)', gap: 6,
  },
  coinDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: '#F0C64A',
    shadowColor: '#F0C64A', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 4,
  },
  coinText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  bellBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    position: 'relative',
  },
  bellIcon: { fontSize: 18 },
  bellDot: {
    position: 'absolute', top: 6, right: 6,
    width: 9, height: 9, borderRadius: 4.5,
    backgroundColor: '#E6483A', borderWidth: 1.5,
    borderColor: 'rgba(15,54,40,0.9)',
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14, paddingHorizontal: 12, height: 44,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 13.5, fontWeight: '500', paddingVertical: 0 },
  clearSearchText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, paddingHorizontal: 4 },
  avatarBtn: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  // Body
  scrollBody: { padding: 18 },

  // Banner
  bannerCard: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, borderRadius: 18, borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 3,
  },
  bannerLeft: { flex: 1, marginRight: 10 },
  bannerBadge: { color: '#F0C64A', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  bannerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 2 },
  bannerSub: { color: '#BCD8C8', fontSize: 11.5 },
  claimBtn: {
    borderRadius: 12, overflow: 'hidden',
    shadowColor: '#D4A017', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  claimBtnGradient: {
    paddingVertical: 9, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  claimBtnText: { color: '#2B1C04', fontSize: 13, fontWeight: '800' },

  // Category Tabs
  tabsContainer: { marginBottom: 16 },
  tabsScroll: { gap: 8, paddingRight: 4 },
  tabChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20, gap: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  tabChipActive: {
    borderColor: 'rgba(31,157,85,0.6)',
  },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  tabLabelActive: { color: '#FFFFFF', fontWeight: '800' },

  // Game Grid
  gameGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 24 },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, fontWeight: '500', textAlign: 'center' },

  // Section Header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12, marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  sectionLink: { fontSize: 13, fontWeight: '700' },

  // Friends
  friendsScroll: { gap: 12, paddingBottom: 8 },
  friendCard: { width: 86, alignItems: 'center' },
  friendAvatarContainer: { position: 'relative', marginBottom: 6 },
  friendAvatar: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  friendAvatarText: { color: '#3A2705', fontSize: 16, fontWeight: '800' },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#4BD07A', borderWidth: 2.5,
  },
  friendName: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  friendStatus: { fontSize: 10, textAlign: 'center', marginTop: 1 },
});

export default GameHubScreen;
