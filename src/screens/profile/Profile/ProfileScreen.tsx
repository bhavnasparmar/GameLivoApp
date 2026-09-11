import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { selectUserProfile } from '../../../redux/selectors/userSelectors';
import { fetchProfileSuccess } from '../../../redux/slices/userSlice';
import { useAuth } from '../../../hooks/useAuth';
import { userService } from '../../../services/user/userService';
import { UserProfile, Achievement, GameStat } from '../../../types/user';

const { width } = Dimensions.get('window');

// ─── Mock profile fallback ────────────────────────────────────────────────────
const MOCK_PROFILE: UserProfile = {
  id: 'user_1',
  name: 'Aarav Kapoor',
  username: 'aarav.kapoor',
  mobile: '+91 98765 43210',
  email: 'aarav@email.com',
  level: 14,
  xp: 3420,
  coins: 2480,
  rank: 128,
  totalGamesPlayed: 342,
  totalWins: 208,
  totalLosses: 134,
  winRate: 61,
  referralCode: 'AARAV14',
  isOnline: true,
  lastSeen: new Date().toISOString(),
  createdAt: '2025-03-01T00:00:00Z',
  bio: 'Board game enthusiast 🎲 Ludo King in the making!',
  achievements: [
    { id: 'a1', title: 'Ludo King', description: 'Win 50 Ludo games', icon: '👑', unlockedAt: '2026-08-01', rarity: 'epic' },
    { id: 'a2', title: 'Chess Prodigy', description: 'Reach Rank #50 in Chess', icon: '♞', unlockedAt: '2026-07-15', rarity: 'rare' },
    { id: 'a3', title: 'First Win', description: 'Win your first match', icon: '🏆', unlockedAt: '2025-03-05', rarity: 'common' },
    { id: 'a4', title: 'Coin Collector', description: 'Collect 10,000 coins', icon: '💰', unlockedAt: '2026-06-20', rarity: 'rare' },
    { id: 'a5', title: 'Social Butterfly', description: 'Add 20 friends', icon: '🦋', unlockedAt: '2026-05-10', rarity: 'common' },
    { id: 'a6', title: 'Legendary', description: 'Reach Level 50', icon: '⭐', unlockedAt: '', rarity: 'legendary' },
  ],
  gameStats: [
    { gameId: 'ludo', gameName: 'Ludo', gamesPlayed: 180, wins: 112, losses: 68, winRate: 62, highScore: 4200, rank: 42 },
    { gameId: 'chess', gameName: 'Chess', gamesPlayed: 85, wins: 54, losses: 31, winRate: 63, highScore: 1850, rank: 88 },
    { gameId: 'uno', gameName: 'Uno', gamesPlayed: 55, wins: 30, losses: 25, winRate: 54, highScore: 890, rank: 210 },
    { gameId: 'snakeLadder', gameName: 'Snake & Ladder', gamesPlayed: 22, wins: 12, losses: 10, winRate: 54, highScore: 320, rank: 340 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name?: string) => {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
};

const RARITY_COLORS: Record<string, string[]> = {
  common: ['#4A6355', '#2A3D33'],
  rare: ['#3A7BD5', '#123A80'],
  epic: ['#9A4BD1', '#4C1F70'],
  legendary: ['#F0C64A', '#D4A017'],
};

const GAME_GLYPHS: Record<string, string> = {
  ludo: '⛃',
  chess: '♞',
  uno: '🂡',
  snakeLadder: '🐍',
  chidiyaUdd: '🐦',
  esto: '🐚',
};

const GAME_GRADIENTS: Record<string, string[]> = {
  ludo: ['#2668D9', '#123A80'],
  chess: ['#4A4238', '#211C17'],
  uno: ['#E6483A', '#8F1D13'],
  snakeLadder: ['#1F9D55', '#0D5230'],
  chidiyaUdd: ['#F2B705', '#A67200'],
  esto: ['#9A4BD1', '#4C1F70'],
};

// ─── XP Progress bar ──────────────────────────────────────────────────────────
const XP_PER_LEVEL = 500;

// Helper to ensure all fields and arrays are populated safely
const getMergedProfile = (source?: Partial<UserProfile> | null): UserProfile => {
  if (!source) return MOCK_PROFILE;
  return {
    ...MOCK_PROFILE,
    ...source,
    name: source.name || source.username || MOCK_PROFILE.name,
    username: source.username || MOCK_PROFILE.username,
    level: typeof source.level === 'number' ? source.level : MOCK_PROFILE.level,
    xp: typeof source.xp === 'number' ? source.xp : MOCK_PROFILE.xp,
    coins: typeof source.coins === 'number' ? source.coins : MOCK_PROFILE.coins,
    rank: typeof source.rank === 'number' ? source.rank : MOCK_PROFILE.rank,
    totalGamesPlayed: typeof source.totalGamesPlayed === 'number' ? source.totalGamesPlayed : MOCK_PROFILE.totalGamesPlayed,
    totalWins: typeof source.totalWins === 'number' ? source.totalWins : MOCK_PROFILE.totalWins,
    totalLosses: typeof source.totalLosses === 'number' ? source.totalLosses : MOCK_PROFILE.totalLosses,
    winRate: typeof source.winRate === 'number' ? source.winRate : MOCK_PROFILE.winRate,
    achievements: Array.isArray(source.achievements) && source.achievements.length > 0 ? source.achievements : MOCK_PROFILE.achievements,
    gameStats: Array.isArray(source.gameStats) && source.gameStats.length > 0 ? source.gameStats : MOCK_PROFILE.gameStats,
  };
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { isDark } = useTheme();
  const { logout } = useAuth();

  const reduxProfile = useAppSelector(selectUserProfile);
  const [profile, setProfile] = useState<UserProfile>(() => getMergedProfile(reduxProfile));
  const [refreshing, setRefreshing] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(headerAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 600, delay: 200, useNativeDriver: true }),
    ]).start();
  }, [headerAnim, statsAnim]);

  useEffect(() => {
    if (reduxProfile) setProfile(getMergedProfile(reduxProfile));
  }, [reduxProfile]);

  const loadProfile = useCallback(async () => {
    try {
      const data = await userService.getProfile();
      if (data) {
        const merged = getMergedProfile(data);
        dispatch(fetchProfileSuccess(merged));
        setProfile(merged);
      }
    } catch {
      // keep existing
    }
  }, [dispatch]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { profile });
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const displayName = profile.name || profile.username || 'Player';
  const initials = getInitials(displayName);
  const xpProgress = (profile.xp % XP_PER_LEVEL) / XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - (profile.xp % XP_PER_LEVEL);

  // ─── Section: Header Hero ──────────────────────────────────────────────────
  const renderHeader = () => (
    <LinearGradient
      colors={isDark ? ['#0F3628', '#0A2019', '#061611'] : ['#155A3F', '#0F4530', '#0B3323']}
      style={[styles.headerGradient, { paddingTop: Math.max(insets.top + 10, 30) }]}
    >
      {/* Glow */}
      <View style={styles.headerGlow} />

      {/* Edit FAB */}
      <TouchableOpacity style={styles.editFab} onPress={handleEditProfile} activeOpacity={0.8}>
        <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.editFabGradient}>
          <Text style={styles.editFabIcon}>✏️</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.heroContent,
          { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] },
        ]}
      >
        {/* Avatar */}
        <View style={styles.avatarRing}>
          <LinearGradient colors={['#F0C64A', '#D4A017', '#A6740C']} style={styles.avatarGradient}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </LinearGradient>
        </View>

        {/* Name & username */}
        <Text style={styles.heroName}>{displayName}</Text>
        <Text style={styles.heroUsername}>@{profile.username}</Text>

        {/* Rank & level chips */}
        <View style={styles.chipRow}>
          <View style={styles.rankChip}>
            <Text style={styles.rankChipText}>Rank #{profile.rank}</Text>
          </View>
          <View style={styles.levelChip}>
            <Text style={styles.levelChipText}>Level {profile.level}</Text>
          </View>
        </View>

        {/* Bio */}
        {profile.bio ? (
          <Text style={styles.heroBio}>{profile.bio}</Text>
        ) : null}

        {/* XP Bar */}
        <View style={styles.xpContainer}>
          <View style={styles.xpLabelRow}>
            <Text style={styles.xpLabel}>XP Progress</Text>
            <Text style={styles.xpRemaining}>{xpToNext} XP to Lv.{profile.level + 1}</Text>
          </View>
          <View style={styles.xpTrack}>
            <Animated.View
              style={[
                styles.xpFill,
                { width: `${Math.round(xpProgress * 100)}%` as any },
              ]}
            />
          </View>
          <Text style={styles.xpValue}>{profile.xp.toLocaleString()} XP</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );

  // ─── Section: Stats Grid ───────────────────────────────────────────────────
  const renderStats = () => (
    <Animated.View
      style={[
        styles.statsGrid,
        { opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
      ]}
    >
      {[
        { label: 'Matches', value: profile.totalGamesPlayed.toLocaleString(), icon: '🎮' },
        { label: 'Win Rate', value: `${profile.winRate}%`, icon: '🏆' },
        { label: 'Wins', value: profile.totalWins.toLocaleString(), icon: '✅' },
        { label: 'Coins', value: profile.coins.toLocaleString(), icon: '🪙' },
      ].map((stat, i) => (
        <View
          key={i}
          style={[
            styles.statBox,
            {
              backgroundColor: isDark ? '#111E17' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#EAF0EB',
            },
          ]}
        >
          <Text style={styles.statIcon}>{stat.icon}</Text>
          <Text style={[styles.statValue, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>{stat.value}</Text>
          <Text style={[styles.statLabel, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>{stat.label}</Text>
        </View>
      ))}
    </Animated.View>
  );

  // ─── Section: Game Stats ───────────────────────────────────────────────────
  const renderGameStats = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>Game Stats</Text>
      </View>
      {(profile.gameStats || []).map((g, i) => {
        const glyph = GAME_GLYPHS[g.gameId] || '🎮';
        const gradient = GAME_GRADIENTS[g.gameId] || ['#3A6B5D', '#1A3D33'];
        return (
          <View
            key={g.gameId || i}
            style={[
              styles.gameStatRow,
              {
                backgroundColor: isDark ? '#111E17' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EAF0EB',
              },
            ]}
          >
            <LinearGradient colors={gradient} style={styles.gameStatIcon}>
              <Text style={styles.gameStatGlyph}>{glyph}</Text>
            </LinearGradient>
            <View style={styles.gameStatInfo}>
              <Text style={[styles.gameStatName, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>{g.gameName}</Text>
              <Text style={[styles.gameStatSub, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
                {g.gamesPlayed} played · Rank #{g.rank}
              </Text>
            </View>
            <View style={styles.gameStatRight}>
              <Text style={[styles.gameWinRate, { color: g.winRate >= 60 ? '#27AE60' : isDark ? '#F1F4F7' : '#1A2318' }]}>
                {g.winRate}%
              </Text>
              <Text style={[styles.gameWins, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
                {g.wins}W / {g.losses}L
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  // ─── Section: Achievements ─────────────────────────────────────────────────
  const renderAchievements = () => {
    const achievementsList = profile.achievements || [];
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>Achievements</Text>
          <Text style={[styles.sectionSub, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
            {achievementsList.filter(a => a.unlockedAt).length}/{achievementsList.length}
          </Text>
        </View>
        <View style={styles.achievementsGrid}>
          {achievementsList.map(ach => {
            const isUnlocked = !!ach.unlockedAt;
            const grad = RARITY_COLORS[ach.rarity] || ['#4A6355', '#2A3D33'];
            return (
              <View
                key={ach.id}
                style={[
                  styles.achCard,
                  {
                    backgroundColor: isDark ? '#111E17' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#EAF0EB',
                    opacity: isUnlocked ? 1 : 0.4,
                  },
                ]}
              >
                <LinearGradient colors={grad} style={styles.achIconBadge}>
                  <Text style={styles.achIcon}>{ach.icon}</Text>
                </LinearGradient>
                <Text style={[styles.achTitle, { color: isDark ? '#F1F4F7' : '#1A2318' }]} numberOfLines={1}>
                  {ach.title}
                </Text>
                <View style={[styles.rarityPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                  <Text style={[styles.rarityText, { color: grad[0] }]}>{ach.rarity}</Text>
                </View>
                {!isUnlocked && (
                  <Text style={styles.lockedText}>🔒</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ─── Section: Referral ─────────────────────────────────────────────────────
  const renderReferral = () => (
    <View style={styles.section}>
      <LinearGradient
        colors={isDark ? ['#183021', '#102017'] : ['#155A3F', '#0F4530']}
        style={styles.referralCard}
      >
        <View style={styles.referralLeft}>
          <Text style={styles.referralLabel}>🎁 Your Referral Code</Text>
          <Text style={styles.referralCode}>{profile.referralCode}</Text>
          <Text style={styles.referralSub}>Share & earn 500 coins per friend!</Text>
        </View>
        <TouchableOpacity
          style={styles.shareBtn}
          activeOpacity={0.8}
          onPress={() => Alert.alert('Share', `Share your code: ${profile.referralCode}`)}
        >
          <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.shareBtnGradient}>
            <Text style={styles.shareBtnText}>Share</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  // ─── Section: Actions ──────────────────────────────────────────────────────
  const renderActions = () => (
    <View style={[styles.section, { marginBottom: 30 }]}>
      <TouchableOpacity
        style={[styles.actionRow, { backgroundColor: isDark ? '#111E17' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#EAF0EB' }]}
        onPress={handleEditProfile}
        activeOpacity={0.8}
      >
        <Text style={styles.actionIcon}>✏️</Text>
        <Text style={[styles.actionText, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>Edit Profile</Text>
        <Text style={[styles.actionChevron, { color: isDark ? '#3A5045' : '#B0C4BB' }]}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionRow, { backgroundColor: isDark ? '#111E17' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#EAF0EB' }]}
        onPress={() => Alert.alert('Coming Soon', 'Match history is coming soon!')}
        activeOpacity={0.8}
      >
        <Text style={styles.actionIcon}>📋</Text>
        <Text style={[styles.actionText, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>Match History</Text>
        <Text style={[styles.actionChevron, { color: isDark ? '#3A5045' : '#B0C4BB' }]}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionRow, { backgroundColor: isDark ? '#2E120D' : '#FFF5F4', borderColor: '#E5584A33' }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.actionIcon}>🚪</Text>
        <Text style={[styles.actionText, { color: '#E5584A' }]}>Log Out</Text>
        <Text style={[styles.actionChevron, { color: '#E5584A55' }]}>›</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0B1410' : '#F4F9F5' }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4A017" colors={['#D4A017', '#1F9D55']} />
        }
      >
        {renderHeader()}
        <View style={styles.body}>
          {renderStats()}
          {renderGameStats()}
          {renderAchievements()}
          {renderReferral()}
          {renderActions()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ──
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerGlow: {
    position: 'absolute',
    top: -60,
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: width * 0.55,
    backgroundColor: 'rgba(212,160,23,0.06)',
  },
  editFab: {
    position: 'absolute',
    top: 18,
    right: 18,
    borderRadius: 13,
    overflow: 'hidden',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  editFabGradient: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editFabIcon: { fontSize: 17 },
  heroContent: { alignItems: 'center', width: '100%' },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    backgroundColor: 'rgba(212,160,23,0.3)',
    marginBottom: 14,
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  avatarGradient: {
    flex: 1,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: '#2B1C04', fontSize: 28, fontWeight: '800' },
  heroName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3, marginBottom: 3 },
  heroUsername: { fontSize: 13, color: '#BCD8C8', fontWeight: '500', marginBottom: 12 },
  chipRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  rankChip: {
    backgroundColor: 'rgba(212,160,23,0.2)',
    borderColor: 'rgba(212,160,23,0.45)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  rankChipText: { color: '#F0C64A', fontSize: 12, fontWeight: '700' },
  levelChip: {
    backgroundColor: 'rgba(39,174,96,0.2)',
    borderColor: 'rgba(39,174,96,0.45)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  levelChipText: { color: '#4BD07A', fontSize: 12, fontWeight: '700' },
  heroBio: { color: '#BCD8C8', fontSize: 13, textAlign: 'center', maxWidth: 280, lineHeight: 19, marginBottom: 16 },

  // ── XP Bar ──
  xpContainer: { width: '100%', paddingHorizontal: 4, marginTop: 4 },
  xpLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600' },
  xpRemaining: { color: '#F0C64A', fontSize: 11, fontWeight: '700' },
  xpTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#F0C64A',
    borderRadius: 3,
    shadowColor: '#F0C64A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  xpValue: { color: 'rgba(255,255,255,0.5)', fontSize: 10.5, fontWeight: '500', textAlign: 'right' },

  // ── Body ──
  body: { paddingHorizontal: 16, paddingTop: 20 },
  section: { marginBottom: 22 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  sectionSub: { fontSize: 12, fontWeight: '600' },

  // ── Stats Grid ──
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
  },
  statBox: {
    width: (width - 32 - 30) / 4,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: { fontSize: 18, marginBottom: 6 },
  statValue: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

  // ── Game Stats ──
  gameStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  gameStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gameStatGlyph: { fontSize: 20 },
  gameStatInfo: { flex: 1 },
  gameStatName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  gameStatSub: { fontSize: 11.5, fontWeight: '500' },
  gameStatRight: { alignItems: 'flex-end' },
  gameWinRate: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  gameWins: { fontSize: 11, fontWeight: '500' },

  // ── Achievements ──
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achCard: {
    width: (width - 32 - 20) / 3,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  achIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  achIcon: { fontSize: 20 },
  achTitle: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 5 },
  rarityPill: { paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6 },
  rarityText: { fontSize: 9.5, fontWeight: '700', textTransform: 'capitalize' },
  lockedText: { position: 'absolute', top: 8, right: 8, fontSize: 11 },

  // ── Referral ──
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  referralLeft: { flex: 1, marginRight: 12 },
  referralLabel: { color: '#F0C64A', fontSize: 11, fontWeight: '700', letterSpacing: 0.3, marginBottom: 4 },
  referralCode: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  referralSub: { color: '#BCD8C8', fontSize: 11.5, fontWeight: '500' },
  shareBtn: { borderRadius: 12, overflow: 'hidden', shadowColor: '#D4A017', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 },
  shareBtnGradient: { paddingVertical: 10, paddingHorizontal: 18 },
  shareBtnText: { color: '#2B1C04', fontSize: 13, fontWeight: '800' },

  // ── Actions ──
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  actionIcon: { fontSize: 18, marginRight: 12 },
  actionText: { flex: 1, fontSize: 14.5, fontWeight: '600' },
  actionChevron: { fontSize: 22, fontWeight: '700', lineHeight: 24 },
});

export default ProfileScreen;
