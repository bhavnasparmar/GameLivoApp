import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../../theme';
import { notificationService } from '../../../services/notification/notificationService';
import { AppNotification, NotificationType } from '../../../types/notification';

const { width } = Dimensions.get('window');

// ─── Mock fallback data ───────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    type: 'friend_request',
    title: 'New Friend Request',
    body: 'Sanya Patel wants to be your friend.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    meta: { fromUserName: 'Sanya Patel', fromUserInitials: 'SP', requestId: 'req1' },
  },
  {
    id: 'n2',
    type: 'game_invite',
    title: 'Game Invite',
    body: 'Karan Verma invited you to a Ludo match!',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    meta: { fromUserName: 'Karan Verma', fromUserInitials: 'KV', gameId: 'ludo' },
  },
  {
    id: 'n3',
    type: 'match_result',
    title: 'Match Result',
    body: 'You won the Chess match against Riya Sharma! +150 coins earned.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    meta: { fromUserName: 'Riya Sharma', fromUserInitials: 'RS', rewardAmount: 150 },
  },
  {
    id: 'n4',
    type: 'achievement',
    title: 'Achievement Unlocked!',
    body: 'You earned the "Ludo King" badge. Keep winning!',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    meta: { achievementTitle: 'Ludo King' },
  },
  {
    id: 'n5',
    type: 'reward',
    title: 'Daily Reward Claimed',
    body: 'You claimed 250 coins from the daily lucky wheel!',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    meta: { rewardAmount: 250 },
  },
  {
    id: 'n6',
    type: 'friend_accepted',
    title: 'Friend Request Accepted',
    body: 'Meera Joshi accepted your friend request.',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    meta: { fromUserName: 'Meera Joshi', fromUserInitials: 'MJ' },
  },
  {
    id: 'n7',
    type: 'leaderboard',
    title: 'Leaderboard Update',
    body: 'You moved up to Rank #128 on the global leaderboard!',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'n8',
    type: 'system',
    title: 'App Update Available',
    body: 'Version 2.4 is here — new Uno tournament mode & bug fixes!',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

// ─── Type metadata: icon, gradient, label ────────────────────────────────────
const TYPE_META: Record<NotificationType, { icon: string; gradient: string[]; label: string }> = {
  friend_request: { icon: '👥', gradient: ['#9A4BD1', '#4C1F70'], label: 'Friends' },
  friend_accepted: { icon: '🤝', gradient: ['#27AE60', '#0D5230'], label: 'Friends' },
  game_invite: { icon: '🎮', gradient: ['#2668D9', '#123A80'], label: 'Invite' },
  match_result: { icon: '🏆', gradient: ['#F0C64A', '#D4A017'], label: 'Match' },
  reward: { icon: '🎁', gradient: ['#E6483A', '#8F1D13'], label: 'Reward' },
  system: { icon: '🔔', gradient: ['#3A6B5D', '#1A3D33'], label: 'System' },
  achievement: { icon: '⭐', gradient: ['#F2B705', '#A67200'], label: 'Achievement' },
  leaderboard: { icon: '📊', gradient: ['#3A7BD5', '#123A80'], label: 'Rank' },
};

// ─── Time ago helper ─────────────────────────────────────────────────────────
const timeAgo = (isoDate: string): string => {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
};

// ─── Group notifications by date ─────────────────────────────────────────────
type GroupedItem =
  | { type: 'header'; label: string }
  | { type: 'notification'; data: AppNotification };

const groupByDate = (notifications: AppNotification[]): GroupedItem[] => {
  const groups: Record<string, AppNotification[]> = {};
  const ORDER: string[] = [];

  notifications.forEach(n => {
    const diff = Date.now() - new Date(n.createdAt).getTime();
    const hrs = diff / 3600000;
    let key: string;
    if (hrs < 24) key = 'Today';
    else if (hrs < 48) key = 'Yesterday';
    else key = 'Earlier';

    if (!groups[key]) {
      groups[key] = [];
      ORDER.push(key);
    }
    groups[key].push(n);
  });

  const result: GroupedItem[] = [];
  ORDER.forEach(key => {
    result.push({ type: 'header', label: key });
    groups[key].forEach(n => result.push({ type: 'notification', data: n }));
  });
  return result;
};

// ─── Notification Card ────────────────────────────────────────────────────────
interface NotifCardProps {
  notification: AppNotification;
  onPress: (n: AppNotification) => void;
  isDark: boolean;
  animValue: Animated.Value;
}

const NotifCard: React.FC<NotifCardProps> = ({ notification, onPress, isDark, animValue }) => {
  const meta = TYPE_META[notification.type];
  const isUnread = !notification.isRead;

  return (
    <Animated.View style={{ opacity: animValue, transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => onPress(notification)}
        style={[
          styles.card,
          {
            backgroundColor: isUnread
              ? (isDark ? '#111E17' : '#F0FBF4')
              : (isDark ? '#0E1610' : '#FFFFFF'),
            borderColor: isUnread
              ? (isDark ? 'rgba(39,174,96,0.2)' : 'rgba(31,157,85,0.18)')
              : (isDark ? 'rgba(255,255,255,0.05)' : '#EAF0EB'),
          },
        ]}
      >
        {/* Unread indicator stripe */}
        {isUnread && (
          <View style={styles.unreadStripe} />
        )}

        {/* Icon badge */}
        <LinearGradient colors={meta.gradient} style={styles.iconBadge}>
          <Text style={styles.iconText}>{meta.icon}</Text>
        </LinearGradient>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <View style={[styles.typePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}>
              <Text style={[styles.typePillText, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
                {meta.label}
              </Text>
            </View>
            <Text style={[styles.timeText, { color: isDark ? '#3A5045' : '#9DB5A5' }]}>
              {timeAgo(notification.createdAt)}
            </Text>
          </View>

          <Text
            style={[styles.cardTitle, { color: isDark ? '#F1F4F7' : '#1A2318', fontWeight: isUnread ? '800' : '600' }]}
            numberOfLines={1}
          >
            {notification.title}
          </Text>
          <Text
            style={[styles.cardBody, { color: isDark ? '#7A9485' : '#5C7A6A' }]}
            numberOfLines={2}
          >
            {notification.body}
          </Text>

          {/* Action buttons for actionable types */}
          {notification.type === 'friend_request' && isUnread && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.acceptMiniBtn} activeOpacity={0.8}>
                <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.acceptMiniGradient}>
                  <Text style={styles.acceptMiniText}>Accept</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.declineMiniBtn, { backgroundColor: isDark ? '#1A2A20' : '#F0F5F2', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#D4E3DA' }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.declineMiniText, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
          {notification.type === 'game_invite' && isUnread && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.joinMiniBtn} activeOpacity={0.8}>
                <LinearGradient colors={['#27AE60', '#0D5230']} style={styles.acceptMiniGradient}>
                  <Text style={styles.acceptMiniText}>Join Game</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const NotificationsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();

  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const fadeAnims = useRef<Map<string, Animated.Value>>(new Map()).current;

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const grouped = groupByDate(notifications);

  // ─── Animate in cards ──────────────────────────────────────────────────────
  const getAnimValue = (id: string): Animated.Value => {
    if (!fadeAnims.has(id)) {
      const val = new Animated.Value(0);
      fadeAnims.set(id, val);
      Animated.spring(val, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }).start();
    }
    return fadeAnims.get(id)!;
  };

  // ─── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications();
      if (data && data.length > 0) setNotifications(data);
    } catch {
      // keep mock data
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // ─── Mark single as read ───────────────────────────────────────────────────
  const handleNotificationPress = async (notif: AppNotification) => {
    if (!notif.isRead) {
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n),
      );
      try {
        await notificationService.markRead(notif.id);
      } catch {
        // revert on error
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, isRead: false } : n),
        );
      }
    }
  };

  // ─── Mark all read ─────────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    const prev = [...notifications];
    setNotifications(ns => ns.map(n => ({ ...n, isRead: true })));
    try {
      await notificationService.markAllRead();
    } catch {
      setNotifications(prev);
      Alert.alert('Error', 'Could not mark all as read. Please try again.');
    } finally {
      setMarkingAll(false);
    }
  };

  // ─── Render list item ──────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: GroupedItem }) => {
    if (item.type === 'header') {
      return (
        <Text style={[styles.groupLabel, { color: isDark ? '#4A6355' : '#7A9485' }]}>
          {item.label}
        </Text>
      );
    }
    return (
      <NotifCard
        notification={item.data}
        onPress={handleNotificationPress}
        isDark={isDark}
        animValue={getAnimValue(item.data.id)}
      />
    );
  };

  const keyExtractor = (item: GroupedItem) =>
    item.type === 'header' ? `header-${item.label}` : item.data.id;

  // ─── Empty state ───────────────────────────────────────────────────────────
  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={[styles.emptyTitle, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>
        All caught up!
      </Text>
      <Text style={[styles.emptySub, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
        No notifications yet. Play a game and come back!
      </Text>
    </View>
  );

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0B1410' : '#F4F9F5' }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Appbar ── */}
      <LinearGradient
        colors={isDark ? ['#0F3628', '#0A2019', '#061611'] : ['#155A3F', '#0F4530', '#0B3323']}
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 10, 28) }]}
      >
        <View style={styles.appBarRow}>
          {/* Back button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          {/* Title */}
          <View style={styles.titleCenter}>
            <Text style={styles.appBarTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadCountBadge}>
                <Text style={styles.unreadCountText}>{unreadCount} new</Text>
              </View>
            )}
          </View>

          {/* Mark all read */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleMarkAllRead}
            disabled={unreadCount === 0 || markingAll}
            style={[styles.markAllBtn, { opacity: unreadCount === 0 ? 0.4 : 1 }]}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color="#D4A017" />
            ) : (
              <Text style={styles.markAllText}>Mark all read</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Unread summary strip */}
        {unreadCount > 0 && (
          <View style={styles.summaryStrip}>
            <View style={styles.summaryDot} />
            <Text style={styles.summaryText}>
              You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* ── List ── */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={[styles.loadingText, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
            Loading notifications…
          </Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 24, 40) },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<ListEmpty />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#D4A017"
              colors={['#D4A017', '#1F9D55']}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Appbar ──
  appBar: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
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
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  titleCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  unreadCountBadge: {
    backgroundColor: '#E6483A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  markAllBtn: {
    alignItems: 'flex-end',
    minWidth: 80,
    height: 38,
    justifyContent: 'center',
  },
  markAllText: {
    color: '#D4A017',
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'right',
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  summaryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F0C64A',
    shadowColor: '#F0C64A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  summaryText: {
    color: '#BCD8C8',
    fontSize: 12,
    fontWeight: '600',
  },

  // ── List ──
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },

  // ── Notification Card ──
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    padding: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  unreadStripe: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3.5,
    borderRadius: 2,
    backgroundColor: '#27AE60',
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconText: {
    fontSize: 20,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  typePill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  timeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 14,
    letterSpacing: 0.1,
    marginBottom: 3,
  },
  cardBody: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },

  // ── Inline Action Buttons ──
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  acceptMiniBtn: {
    borderRadius: 9,
    overflow: 'hidden',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  joinMiniBtn: {
    borderRadius: 9,
    overflow: 'hidden',
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  acceptMiniGradient: {
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  acceptMiniText: {
    color: '#2B1C04',
    fontSize: 12,
    fontWeight: '800',
  },
  declineMiniBtn: {
    borderRadius: 9,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  declineMiniText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Loading ──
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // ── Empty ──
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 20,
    opacity: 0.75,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default NotificationsScreen;
