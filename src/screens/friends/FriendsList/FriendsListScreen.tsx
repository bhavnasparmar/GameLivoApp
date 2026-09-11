import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import { useTheme } from '../../../theme';
import { friendsService } from '../../../services/friends/friendsService';
import { Friend, FriendRequest, SearchedUser } from '../../../types/friends';

const { width } = Dimensions.get('window');

// ─── Mock Fallback Data ───────────────────────────────────────────────────────
const MOCK_FRIENDS: Friend[] = [
  { id: '1', name: 'Riya Sharma', username: 'riya_s', level: 24, rank: 142, isOnline: true, currentActivity: 'Playing Ludo' },
  { id: '2', name: 'Karan Verma', username: 'kv_plays', level: 31, rank: 88, isOnline: true, currentActivity: 'In lobby' },
  { id: '3', name: 'Meera Joshi', username: 'meera_j', level: 19, rank: 215, isOnline: true, currentActivity: 'Playing Uno' },
  { id: '4', name: 'Tanvi Pillai', username: 'tanvi_p', level: 15, rank: 312, isOnline: false, lastSeen: '2h ago' },
  { id: '5', name: 'Arjun Dev', username: 'arjun_d', level: 42, rank: 30, isOnline: false, lastSeen: '1d ago' },
  { id: '6', name: 'Priya Nair', username: 'priya_nair', level: 9, rank: 540, isOnline: false, lastSeen: '3d ago' },
];

const MOCK_REQUESTS: FriendRequest[] = [
  { id: 'r1', requestId: 'req1', name: 'Sanya Patel', username: 'sanya_p', level: 12, mutualFriends: 3, sentAt: '2026-09-10', direction: 'incoming' },
  { id: 'r2', requestId: 'req2', name: 'Rohan Mehta', username: 'rohan_m', level: 20, mutualFriends: 1, sentAt: '2026-09-09', direction: 'incoming' },
];

// ─── Tab types ────────────────────────────────────────────────────────────────
type TabKey = 'all' | 'requests' | 'find';

// ─── Helper: get avatar initials ─────────────────────────────────────────────
const getInitials = (name: string): string =>
  name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

// ─── Avatar gradient pools ────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  ['#F0C64A', '#D4A017'],
  ['#27AE60', '#0D5230'],
  ['#E6483A', '#8F1D13'],
  ['#3A7BD5', '#123A80'],
  ['#9A4BD1', '#4C1F70'],
  ['#F2B705', '#A67200'],
];

const getAvatarGradient = (id: string) => {
  const idx = id.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FriendRowProps {
  friend: Friend;
  onRemove: (id: string, name: string) => void;
  onInvite: (id: string, name: string) => void;
  isDark: boolean;
}

const FriendRow: React.FC<FriendRowProps> = ({ friend, onRemove, onInvite, isDark }) => {
  const gradColors = getAvatarGradient(friend.id);
  return (
    <View style={[styles.friendRow, { backgroundColor: isDark ? '#131A10' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#EAF0EB' }]}>
      <View style={styles.avatarWrap}>
        <LinearGradient colors={gradColors} style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(friend.name)}</Text>
        </LinearGradient>
        {friend.isOnline && <View style={[styles.onlineBadge, { borderColor: isDark ? '#131A10' : '#FFFFFF' }]} />}
      </View>

      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: isDark ? '#F1F4F7' : '#1A2318' }]} numberOfLines={1}>
          {friend.name}
        </Text>
        <Text style={[styles.friendSub, { color: isDark ? '#7A9485' : '#5C7A6A' }]} numberOfLines={1}>
          {friend.isOnline
            ? (friend.currentActivity || 'Online')
            : `Offline · ${friend.lastSeen || 'a while ago'}`}
        </Text>
        <View style={styles.statRow}>
          <Text style={styles.levelBadge}>Lv.{friend.level}</Text>
          <Text style={[styles.rankBadge, { color: isDark ? '#96A1AD' : '#6B7A70' }]}>#{friend.rank}</Text>
        </View>
      </View>

      <View style={styles.actionCol}>
        {friend.isOnline ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.inviteBtn}
            onPress={() => onInvite(friend.id, friend.name)}
          >
            <LinearGradient colors={['#1F9D55', '#0D5230']} style={styles.inviteBtnGradient}>
              <Text style={styles.inviteBtnText}>Invite</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.messageBtn, { backgroundColor: isDark ? '#1E2A24' : '#EDF5F0', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#C8DDD0' }]}
            onPress={() => onRemove(friend.id, friend.name)}
          >
            <Text style={[styles.messageBtnText, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

interface RequestRowProps {
  request: FriendRequest;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  isDark: boolean;
  accepting: boolean;
}

const RequestRow: React.FC<RequestRowProps> = ({ request, onAccept, onDecline, isDark, accepting }) => {
  const gradColors = getAvatarGradient(request.id);
  return (
    <View style={[styles.friendRow, { backgroundColor: isDark ? '#131A10' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#EAF0EB' }]}>
      <LinearGradient colors={gradColors} style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(request.name)}</Text>
      </LinearGradient>

      <View style={[styles.friendInfo, { flex: 1 }]}>
        <Text style={[styles.friendName, { color: isDark ? '#F1F4F7' : '#1A2318' }]} numberOfLines={1}>
          {request.name}
        </Text>
        <Text style={[styles.friendSub, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
          @{request.username} · Lv.{request.level}
        </Text>
        {(request.mutualFriends || 0) > 0 && (
          <Text style={styles.mutualText}>👥 {request.mutualFriends} mutual friends</Text>
        )}
      </View>

      <View style={styles.requestActions}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.acceptBtn}
          onPress={() => onAccept(request.requestId)}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.acceptBtnGradient}>
              <Text style={styles.acceptBtnText}>Accept</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.declineBtn, { backgroundColor: isDark ? '#1E2A24' : '#F5F5F5', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#DDD' }]}
          onPress={() => onDecline(request.requestId)}
        >
          <Text style={[styles.declineBtnText, { color: isDark ? '#96A1AD' : '#6B6154' }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

interface SearchResultRowProps {
  user: SearchedUser;
  onAdd: (userId: string, name: string) => void;
  isDark: boolean;
  adding: boolean;
}

const SearchResultRow: React.FC<SearchResultRowProps> = ({ user, onAdd, isDark, adding }) => {
  const gradColors = getAvatarGradient(user.id);
  return (
    <View style={[styles.friendRow, { backgroundColor: isDark ? '#131A10' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#EAF0EB' }]}>
      <LinearGradient colors={gradColors} style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
      </LinearGradient>

      <View style={[styles.friendInfo, { flex: 1 }]}>
        <Text style={[styles.friendName, { color: isDark ? '#F1F4F7' : '#1A2318' }]} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={[styles.friendSub, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
          @{user.username} · Lv.{user.level}
        </Text>
        {(user.mutualFriends || 0) > 0 && (
          <Text style={styles.mutualText}>👥 {user.mutualFriends} mutual</Text>
        )}
      </View>

      {user.isFriend ? (
        <View style={[styles.alreadyFriendBadge, { backgroundColor: isDark ? '#1A2D22' : '#E6F7EE' }]}>
          <Text style={styles.alreadyFriendText}>Friends</Text>
        </View>
      ) : user.hasPendingRequest ? (
        <View style={[styles.pendingBadge, { backgroundColor: isDark ? '#252310' : '#FDF4E3' }]}>
          <Text style={styles.pendingText}>Pending</Text>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onAdd(user.id, user.name)}
          disabled={adding}
          style={styles.addBtnWrap}
        >
          <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.addBtnGradient}>
            {adding ? (
              <ActivityIndicator size="small" color="#3A2705" />
            ) : (
              <Text style={styles.addBtnText}>+ Add</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const FriendsListScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [requests, setRequests] = useState<FriendRequest[]>(MOCK_REQUESTS);
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);

  const tabIndicatorX = useRef(new Animated.Value(0)).current;
  const [autoFocusSearch, setAutoFocusSearch] = useState(false);

  const tabWidth = (width - 36) / 3;

  const onlineFriends = friends.filter(f => f.isOnline);
  const offlineFriends = friends.filter(f => !f.isOnline);
  const pendingRequests = requests.filter(r => r.direction === 'incoming');

  // ─── Data Loading ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      const [friendsList, requestsList] = await Promise.all([
        friendsService.getFriends().catch(() => null),
        friendsService.getFriendRequests().catch(() => null),
      ]);
      if (friendsList) setFriends(friendsList);
      if (requestsList) setRequests(requestsList);
    } catch {
      // Keep mock data on error
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

  // ─── Tab Switching ─────────────────────────────────────────────────────────
  const switchTab = (tab: TabKey, idx: number) => {
    setActiveTab(tab);
    Animated.spring(tabIndicatorX, {
      toValue: idx * tabWidth,
      tension: 60,
      friction: 9,
      useNativeDriver: true,
    }).start();

    if (tab === 'find') {
      setAutoFocusSearch(true);
    } else {
      setAutoFocusSearch(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // ─── Search ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await friendsService.searchUsers(query.trim());
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // ─── Accept ────────────────────────────────────────────────────────────────
  const handleAccept = async (requestId: string) => {
    setAcceptingId(requestId);
    try {
      await friendsService.acceptFriendRequest(requestId);
      const accepted = requests.find(r => r.requestId === requestId);
      if (accepted) {
        setFriends(prev => [
          { id: accepted.id, name: accepted.name, username: accepted.username, level: accepted.level, rank: 999, isOnline: false },
          ...prev,
        ]);
        setRequests(prev => prev.filter(r => r.requestId !== requestId));
      }
    } catch {
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  // ─── Decline ───────────────────────────────────────────────────────────────
  const handleDecline = async (requestId: string) => {
    try {
      await friendsService.declineFriendRequest(requestId);
      setRequests(prev => prev.filter(r => r.requestId !== requestId));
    } catch {
      Alert.alert('Error', 'Failed to decline request. Please try again.');
    }
  };

  // ─── Remove friend ─────────────────────────────────────────────────────────
  const handleRemoveFriend = (id: string, name: string) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${name} from your friends list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendsService.removeFriend(id);
              setFriends(prev => prev.filter(f => f.id !== id));
            } catch {
              Alert.alert('Error', 'Could not remove friend. Try again.');
            }
          },
        },
      ],
    );
  };

  // ─── Invite ────────────────────────────────────────────────────────────────
  const handleInvite = (_id: string, name: string) => {
    Alert.alert('Game Invite', `Send a game invite to ${name}?\n(This feature is coming soon!)`, [
      { text: 'OK' },
    ]);
  };

  // ─── Add Friend ────────────────────────────────────────────────────────────
  const handleAddFriend = async (userId: string, name: string) => {
    setAddingId(userId);
    try {
      await friendsService.sendFriendRequest(userId);
      setSearchResults(prev =>
        prev.map(u => u.id === userId ? { ...u, hasPendingRequest: true } : u),
      );
      Alert.alert('Request Sent!', `Friend request sent to ${name}.`);
    } catch {
      Alert.alert('Error', 'Could not send friend request. Try again.');
    } finally {
      setAddingId(null);
    }
  };

  // ─── Render Content per tab ────────────────────────────────────────────────
  const renderAllFriends = () => (
    <ScrollView
      contentContainerStyle={[styles.tabBody, { paddingBottom: 100 }]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#D4A017"
          colors={['#D4A017', '#1F9D55']}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={[styles.emptyTitle, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>No friends yet</Text>
          <Text style={[styles.emptySub, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
            Find friends using the search tab!
          </Text>
        </View>
      ) : (
        <>
          {onlineFriends.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: isDark ? '#5CF27A' : '#1F9D55' }]}>
                🟢  Online now · {onlineFriends.length}
              </Text>
              {onlineFriends.map(f => (
                <FriendRow
                  key={f.id}
                  friend={f}
                  onRemove={handleRemoveFriend}
                  onInvite={handleInvite}
                  isDark={isDark}
                />
              ))}
            </>
          )}
          {offlineFriends.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: isDark ? '#7A9485' : '#5C7A6A', marginTop: 20 }]}>
                ⚫  Offline · {offlineFriends.length}
              </Text>
              {offlineFriends.map(f => (
                <FriendRow
                  key={f.id}
                  friend={f}
                  onRemove={handleRemoveFriend}
                  onInvite={handleInvite}
                  isDark={isDark}
                />
              ))}
            </>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderRequests = () => (
    <ScrollView
      contentContainerStyle={[styles.tabBody, { paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {pendingRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📬</Text>
          <Text style={[styles.emptyTitle, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>No pending requests</Text>
          <Text style={[styles.emptySub, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
            When someone sends you a request, it'll appear here.
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: isDark ? '#D4A017' : '#B8872A' }]}>
            📨  Friend Requests · {pendingRequests.length}
          </Text>
          {pendingRequests.map(req => (
            <RequestRow
              key={req.requestId}
              request={req}
              onAccept={handleAccept}
              onDecline={handleDecline}
              isDark={isDark}
              accepting={acceptingId === req.requestId}
            />
          ))}
        </>
      )}
    </ScrollView>
  );

  const renderFind = () => (
    <View style={{ flex: 1 }}>
      {/* Search input */}
      <View style={[styles.findSearchBox, { backgroundColor: isDark ? '#131A10' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#D4E3DA' }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          autoFocus={autoFocusSearch}
          placeholder="Search by username…"
          placeholderTextColor={isDark ? '#3A5045' : '#9DB5A5'}
          value={searchQuery}
          onChangeText={handleSearch}
          style={[styles.findSearchInput, { color: isDark ? '#F1F4F7' : '#1A2318' }]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isSearching ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#D4A017" />
          <Text style={[styles.loadingText, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>Searching…</Text>
        </View>
      ) : searchQuery && searchResults.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔎</Text>
          <Text style={[styles.emptyTitle, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>No users found</Text>
          <Text style={[styles.emptySub, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
            Try searching with a different username.
          </Text>
        </View>
      ) : !searchQuery ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🧑‍🤝‍🧑</Text>
          <Text style={[styles.emptyTitle, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>Find new friends</Text>
          <Text style={[styles.emptySub, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
            Type a username above to search for players.
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.tabBody, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SearchResultRow
              user={item}
              onAdd={handleAddFriend}
              isDark={isDark}
              adding={addingId === item.id}
            />
          )}
        />
      )}
    </View>
  );

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0B1410' : '#F4F9F5' }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Appbar ── */}
      <LinearGradient
        colors={isDark ? ['#0F3628', '#0A2019', '#061611'] : ['#155A3F', '#0F4530', '#0B3323']}
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 10, 28) }]}
      >
        {/* Title Row */}
        <View style={styles.appBarRow}>
          <View style={styles.titleGroup}>
            <LinearGradient colors={['#F0C64A', '#D4A017', '#A6740C']} style={styles.brandMark}>
              <Text style={styles.brandIcon}>👥</Text>
            </LinearGradient>
            <View>
              <Text style={styles.appBarTitle}>Friends</Text>
              <Text style={styles.appBarSub}>
                {friends.length} friends · {onlineFriends.length} online
              </Text>
            </View>
          </View>

          {/* Invite button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.inviteHeaderBtn}
            onPress={() => switchTab('find', 2)}
          >
            <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.inviteHeaderGradient}>
              <Text style={styles.inviteHeaderText}>+ Add</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Tab Pills ── */}
        <View style={[styles.tabPillsWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)' }]}>
          <Animated.View
            style={[
              styles.tabIndicator,
              { width: tabWidth, transform: [{ translateX: tabIndicatorX }] },
            ]}
          />
          {(['all', 'requests', 'find'] as TabKey[]).map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPill, { width: tabWidth }]}
              onPress={() => switchTab(tab, idx)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabPillText,
                  { color: activeTab === tab ? '#FFFFFF' : 'rgba(255,255,255,0.55)', fontWeight: activeTab === tab ? '700' : '500' },
                ]}
              >
                {tab === 'all' ? `All (${friends.length})` : tab === 'requests' ? `Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ''}` : 'Find'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* ── Tab Content ── */}
      <View style={{ flex: 1 }}>
        {activeTab === 'all' && renderAllFriends()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'find' && renderFind()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Appbar ──
  appBar: {
    paddingHorizontal: 18,
    paddingBottom: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    zIndex: 10,
  },
  appBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  brandIcon: {
    fontSize: 20,
  },
  appBarTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  appBarSub: {
    fontSize: 11.5,
    color: '#BCD8C8',
    fontWeight: '500',
  },
  inviteHeaderBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  inviteHeaderGradient: {
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  inviteHeaderText: {
    color: '#2B1C04',
    fontSize: 13,
    fontWeight: '800',
  },

  // ── Tab Pills ──
  tabPillsWrapper: {
    flexDirection: 'row',
    borderRadius: 14,
    marginHorizontal: 0,
    marginBottom: 0,
    height: 42,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: 3,
  },
  tabPill: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabPillText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // ── Tab Body ──
  tabBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },

  // ── Friend Row ──
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#4BD07A',
    borderWidth: 2.5,
  },
  friendInfo: {
    flex: 1,
    marginRight: 8,
  },
  friendName: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  friendSub: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4A017',
    backgroundColor: 'rgba(212,160,23,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  rankBadge: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionCol: {
    alignItems: 'flex-end',
  },
  inviteBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  inviteBtnGradient: {
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  inviteBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  messageBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  messageBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mutualText: {
    fontSize: 11,
    color: '#D4A017',
    fontWeight: '600',
    marginTop: 2,
  },

  // ── Request Actions ──
  requestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  acceptBtn: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  acceptBtnGradient: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  acceptBtnText: {
    color: '#2B1C04',
    fontSize: 12.5,
    fontWeight: '800',
  },
  declineBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Search Result Badges ──
  alreadyFriendBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  alreadyFriendText: {
    color: '#1F9D55',
    fontSize: 12,
    fontWeight: '700',
  },
  pendingBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pendingText: {
    color: '#E5A93D',
    fontSize: 12,
    fontWeight: '700',
  },
  addBtnWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  addBtnGradient: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addBtnText: {
    color: '#2B1C04',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // ── Find Tab ──
  findSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  findSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearBtn: {
    color: '#7A9485',
    fontSize: 15,
    paddingHorizontal: 4,
  },

  // ── Empty / Loading ──
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingText: {
    fontSize: 13.5,
    fontWeight: '500',
    marginTop: 10,
  },
});

export default FriendsListScreen;
