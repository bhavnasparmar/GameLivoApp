import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Animated,
  StatusBar,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../../theme';
import {
  settingsService,
  BlockedUser,
  PrivacySettings,
} from '../../../services/settings/settingsService';

const { width } = Dimensions.get('window');

const BLOCK_REASONS = [
  'Toxic chat behavior',
  'Cheating / Game exploit',
  'Spamming match invites',
  'Offensive name/avatar',
  'Unwanted messages',
  'Other reason',
];

export const PrivacySecurityScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();

  // State
  const [activeTab, setActiveTab] = useState<'blocked' | 'privacy'>('blocked');
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowFriendRequests: true,
    allowGameInvites: true,
    twoFactorEnabled: false,
  });

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  // Block Modal state
  const [blockModalVisible, setBlockModalVisible] = useState(false);
  const [blockUsername, setBlockUsername] = useState('');
  const [selectedReason, setSelectedReason] = useState(BLOCK_REASONS[0]);
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    loadData();
  }, [fadeAnim]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [priv, blocked] = await Promise.all([
        settingsService.getPrivacySettings(),
        settingsService.getBlockedUsers(),
      ]);
      setPrivacy(priv);
      setBlockedUsers(blocked);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrivacy = async (key: keyof PrivacySettings, value: any) => {
    const updated = { ...privacy, [key]: value };
    setPrivacy(updated);
    try {
      await settingsService.updatePrivacySettings({ [key]: value });
    } catch {
      // optimistic update
    }
  };

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'Unblock Player',
      `Are you sure you want to unblock @${user.username}? They will be able to send you friend requests and game invites again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'destructive',
          onPress: async () => {
            setActionUserId(user.id);
            try {
              await settingsService.unblockUser(user.id);
              setBlockedUsers(prev => prev.filter(u => u.id !== user.id));
              Alert.alert('Unblocked', `@${user.username} has been unblocked.`);
            } catch {
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            } finally {
              setActionUserId(null);
            }
          },
        },
      ]
    );
  };

  const handleBlockSubmit = async () => {
    const cleanUsername = blockUsername.trim().replace(/^@/, '');
    if (!cleanUsername) {
      Alert.alert('Missing Username', 'Please enter a username or player ID to block.');
      return;
    }

    setIsSubmittingBlock(true);
    try {
      const blocked = await settingsService.blockUser({
        id: `user_blocked_${Date.now()}`,
        name: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
        username: cleanUsername,
        reason: selectedReason,
      });
      setBlockedUsers(prev => [blocked, ...prev.filter(u => u.username !== cleanUsername)]);
      setBlockModalVisible(false);
      setBlockUsername('');
      Alert.alert('Player Blocked', `@${cleanUsername} has been blocked successfully.`);
    } catch {
      Alert.alert('Error', 'Could not block player. Please check the username.');
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const filteredBlocked = blockedUsers.filter(
    u =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#08120D' : '#F4F9F5' }]}>
      <StatusBar barStyle="light-content" />

      {/* Header Banner */}
      <LinearGradient
        colors={isDark ? ['#1A3D2D', '#0F261C', '#08120D'] : ['#155A3F', '#0F4530', '#F4F9F5']}
        style={[styles.headerGradient, { paddingTop: Math.max(insets.top + 8, 20) }]}
      >
        <View style={styles.topNavRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => setBlockModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#E5584A', '#B5281A']} style={styles.headerActionGradient}>
              <Text style={styles.headerActionText}>+ Block</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'blocked' && styles.tabItemActive]}
            onPress={() => setActiveTab('blocked')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'blocked' && styles.tabTextActive]}>
              🚫 Blocked Users ({blockedUsers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'privacy' && styles.tabItemActive]}
            onPress={() => setActiveTab('privacy')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
              🛡️ Privacy Settings
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {activeTab === 'blocked' ? (
          // ─── TAB: BLOCKED USERS ─────────────────────────────────────────────
          <View style={styles.tabContent}>
            {/* Search Box */}
            <View style={styles.searchRow}>
              <View
                style={[
                  styles.searchContainer,
                  {
                    backgroundColor: isDark ? '#102018' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2EDE6',
                  },
                ]}
              >
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#121A15' }]}
                  placeholder="Search blocked players..."
                  placeholderTextColor={isDark ? '#6E8A7B' : '#9EB5A8'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#F0C64A" />
                <Text style={styles.loadingText}>Loading blocked players...</Text>
              </View>
            ) : filteredBlocked.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyIcon}>🛡️</Text>
                </View>
                <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                  {searchQuery ? 'No Matching Blocked Players' : 'No Blocked Players'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? `No blocked player matches "${searchQuery}"`
                    : 'Players you block will not be able to message you, invite you to games, or see your online status.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => setBlockModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#E5584A', '#B5281A']} style={styles.emptyActionGradient}>
                    <Text style={styles.emptyActionText}>+ Block a Player</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={[styles.listScroll, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.listHeaderTitle}>
                  {filteredBlocked.length} BLOCKED {filteredBlocked.length === 1 ? 'PLAYER' : 'PLAYERS'}
                </Text>

                {filteredBlocked.map(user => {
                  const isActing = actionUserId === user.id;
                  const dateStr = user.blockedAt
                    ? new Date(user.blockedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recently';

                  return (
                    <View
                      key={user.id}
                      style={[
                        styles.blockedCard,
                        {
                          backgroundColor: isDark ? '#102018' : '#FFFFFF',
                          borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6',
                        },
                      ]}
                    >
                      <View style={styles.userAvatarBox}>
                        <LinearGradient
                          colors={['#4A5A52', '#2A3A32']}
                          style={styles.userAvatarGradient}
                        >
                          <Text style={styles.userAvatarInitials}>{getInitials(user.name)}</Text>
                        </LinearGradient>
                        <View style={styles.blockStatusBadge}>
                          <Text style={styles.blockStatusIcon}>🚫</Text>
                        </View>
                      </View>

                      <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                          {user.name}
                        </Text>
                        <Text style={styles.userHandle}>@{user.username}</Text>
                        {user.reason ? (
                          <View style={styles.reasonBadge}>
                            <Text style={styles.reasonText} numberOfLines={1}>
                              {user.reason}
                            </Text>
                          </View>
                        ) : null}
                        <Text style={styles.blockedDate}>Blocked on {dateStr}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.unblockBtn}
                        onPress={() => handleUnblock(user)}
                        disabled={isActing}
                        activeOpacity={0.7}
                      >
                        {isActing ? (
                          <ActivityIndicator size="small" color="#4BD07A" />
                        ) : (
                          <View style={styles.unblockBtnInner}>
                            <Text style={styles.unblockBtnText}>Unblock</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        ) : (
          // ─── TAB: PRIVACY SETTINGS ──────────────────────────────────────────
          <ScrollView
            contentContainerStyle={[styles.privacyScroll, { paddingBottom: Math.max(insets.bottom + 40, 60) }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Visibility */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>PROFILE VISIBILITY</Text>
              <View
                style={[
                  styles.cardGroup,
                  { backgroundColor: isDark ? '#102018' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6' },
                ]}
              >
                {[
                  { key: 'public', title: 'Public (Recommended)', sub: 'Anyone can view your stats and achievements' },
                  { key: 'friends', title: 'Friends Only', sub: 'Only confirmed friends can view your full profile' },
                  { key: 'private', title: 'Private / Ghost Mode', sub: 'Hide stats and match history from search' },
                ].map((opt, i) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.radioRow, i > 0 && styles.rowTopBorder]}
                    onPress={() => handleTogglePrivacy('profileVisibility', opt.key)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioTextWrap}>
                      <Text style={[styles.radioTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                        {opt.title}
                      </Text>
                      <Text style={styles.radioSub}>{opt.sub}</Text>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        privacy.profileVisibility === opt.key && styles.radioCircleActive,
                      ]}
                    >
                      {privacy.profileVisibility === opt.key && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Interactions */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>GAMEPLAY & SOCIAL INTERACTIONS</Text>
              <View
                style={[
                  styles.cardGroup,
                  { backgroundColor: isDark ? '#102018' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6' },
                ]}
              >
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextWrap}>
                    <Text style={[styles.toggleTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                      Show Online Status
                    </Text>
                    <Text style={styles.toggleSub}>Allow friends to see when you are playing</Text>
                  </View>
                  <Switch
                    value={privacy.showOnlineStatus}
                    onValueChange={v => handleTogglePrivacy('showOnlineStatus', v)}
                    trackColor={{ false: '#2D3A33', true: '#1F9D55' }}
                    thumbColor={privacy.showOnlineStatus ? '#F0C64A' : '#7A8C82'}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFF5F1' }]} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextWrap}>
                    <Text style={[styles.toggleTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                      Allow Game Invites
                    </Text>
                    <Text style={styles.toggleSub}>Receive match challenges from other players</Text>
                  </View>
                  <Switch
                    value={privacy.allowGameInvites}
                    onValueChange={v => handleTogglePrivacy('allowGameInvites', v)}
                    trackColor={{ false: '#2D3A33', true: '#1F9D55' }}
                    thumbColor={privacy.allowGameInvites ? '#F0C64A' : '#7A8C82'}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#EFF5F1' }]} />

                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextWrap}>
                    <Text style={[styles.toggleTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                      Allow Friend Requests
                    </Text>
                    <Text style={styles.toggleSub}>Allow players to send you connection requests</Text>
                  </View>
                  <Switch
                    value={privacy.allowFriendRequests}
                    onValueChange={v => handleTogglePrivacy('allowFriendRequests', v)}
                    trackColor={{ false: '#2D3A33', true: '#1F9D55' }}
                    thumbColor={privacy.allowFriendRequests ? '#F0C64A' : '#7A8C82'}
                  />
                </View>
              </View>
            </View>

            {/* Two-Factor Authentication */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>SECURITY & 2-STEP VERIFICATION</Text>
              <View
                style={[
                  styles.cardGroup,
                  { backgroundColor: isDark ? '#102018' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2EDE6' },
                ]}
              >
                <View style={styles.toggleRow}>
                  <View style={styles.toggleTextWrap}>
                    <Text style={[styles.toggleTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                      Two-Factor Authentication (OTP)
                    </Text>
                    <Text style={styles.toggleSub}>Require SMS / Email OTP on every new login</Text>
                  </View>
                  <Switch
                    value={privacy.twoFactorEnabled}
                    onValueChange={v => {
                      handleTogglePrivacy('twoFactorEnabled', v);
                      Alert.alert(
                        v ? '2FA Enabled' : '2FA Disabled',
                        v
                          ? 'Two-factor OTP verification is now active for your account.'
                          : 'Two-factor verification has been turned off.'
                      );
                    }}
                    trackColor={{ false: '#2D3A33', true: '#1F9D55' }}
                    thumbColor={privacy.twoFactorEnabled ? '#F0C64A' : '#7A8C82'}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* ─── BLOCK USER MODAL ────────────────────────────────────────────── */}
      <Modal
        visible={blockModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBlockModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: isDark ? '#102018' : '#FFFFFF',
                paddingBottom: Math.max(insets.bottom + 20, 30),
              },
            ]}
          >
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Text style={styles.modalIcon}>🚫</Text>
              </View>
              <View style={styles.modalTitleWrap}>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#121A15' }]}>
                  Block a Player
                </Text>
                <Text style={styles.modalSubtitle}>Prevent user from contacting or matching with you</Text>
              </View>
              <TouchableOpacity
                onPress={() => setBlockModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>PLAYER USERNAME OR ID</Text>
            <View
              style={[
                styles.modalInputWrap,
                {
                  backgroundColor: isDark ? '#08120D' : '#F4F9F5',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#D6E4DB',
                },
              ]}
            >
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={[styles.modalTextInput, { color: isDark ? '#FFFFFF' : '#121A15' }]}
                placeholder="e.g. rohan_gamer or player_99"
                placeholderTextColor={isDark ? '#5C7467' : '#8FA89A'}
                value={blockUsername}
                onChangeText={setBlockUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={styles.inputLabel}>REASON FOR BLOCKING</Text>
            <ScrollView style={styles.reasonsList} horizontal={false} showsVerticalScrollIndicator={false}>
              {BLOCK_REASONS.map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonOption,
                    {
                      backgroundColor: isDark ? '#0A1810' : '#F9FCFA',
                      borderColor:
                        selectedReason === reason
                          ? '#E5584A'
                          : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#E2EDE6',
                    },
                  ]}
                  onPress={() => setSelectedReason(reason)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.reasonOptionText,
                      { color: selectedReason === reason ? '#E5584A' : isDark ? '#BCD8C8' : '#2D3A33' },
                    ]}
                  >
                    {reason}
                  </Text>
                  <View
                    style={[
                      styles.reasonRadio,
                      selectedReason === reason && { borderColor: '#E5584A' },
                    ]}
                  >
                    {selectedReason === reason && <View style={styles.reasonRadioSelected} />}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: isDark ? '#263C30' : '#D6E4DB' }]}
                onPress={() => setBlockModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { color: isDark ? '#8CA597' : '#5C7467' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBlockBtn}
                onPress={handleBlockSubmit}
                disabled={isSubmittingBlock}
                activeOpacity={0.8}
              >
                <LinearGradient colors={['#E5584A', '#B5281A']} style={styles.confirmBlockGradient}>
                  {isSubmittingBlock ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmBlockText}>Block Player</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  headerGradient: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnIcon: {
    fontSize: 28,
    color: '#FFFFFF',
    lineHeight: 30,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerActionBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  headerActionGradient: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  headerActionText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 4,
    gap: 6,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  tabText: {
    color: '#8CA597',
    fontSize: 12.5,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  tabContent: {
    flex: 1,
  },
  searchRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  loadingBox: {
    paddingTop: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8CA597',
    fontSize: 13,
    marginTop: 12,
    fontWeight: '500',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 50,
  },
  emptyIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(31,157,85,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(31,157,85,0.3)',
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#7A9485',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptyActionGradient: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  listScroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  listHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A9485',
    letterSpacing: 1,
    marginBottom: 10,
    paddingLeft: 4,
  },
  blockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  userAvatarBox: {
    width: 46,
    height: 46,
    position: 'relative',
    marginRight: 12,
  },
  userAvatarGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  blockStatusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#08120D',
    borderRadius: 10,
    padding: 1,
  },
  blockStatusIcon: {
    fontSize: 12,
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 1,
  },
  userHandle: {
    fontSize: 12,
    color: '#8CA597',
    fontWeight: '500',
    marginBottom: 4,
  },
  reasonBadge: {
    backgroundColor: 'rgba(229,88,74,0.12)',
    borderColor: 'rgba(229,88,74,0.25)',
    borderWidth: 1,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginBottom: 4,
  },
  reasonText: {
    color: '#FF7D6F',
    fontSize: 10,
    fontWeight: '700',
  },
  blockedDate: {
    fontSize: 10.5,
    color: '#5C7467',
    fontWeight: '500',
  },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(39,174,96,0.15)',
    borderColor: 'rgba(39,174,96,0.4)',
    borderWidth: 1,
  },
  unblockBtnInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockBtnText: {
    color: '#4BD07A',
    fontSize: 12,
    fontWeight: '800',
  },
  // Privacy Tab Styles
  privacyScroll: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  sectionBox: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A9485',
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  cardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowTopBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  radioTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  radioTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  radioSub: {
    fontSize: 11.5,
    color: '#7A9485',
    fontWeight: '500',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7A9485',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#4BD07A',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4BD07A',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  toggleTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  toggleSub: {
    fontSize: 11.5,
    color: '#7A9485',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginLeft: 14,
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(229,88,74,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalIcon: {
    fontSize: 20,
  },
  modalTitleWrap: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#8CA597',
    fontWeight: '500',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseIcon: {
    fontSize: 18,
    color: '#8CA597',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7A9485',
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 16,
  },
  atSymbol: {
    fontSize: 16,
    color: '#8CA597',
    fontWeight: '700',
    marginRight: 4,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    padding: 0,
  },
  reasonsList: {
    maxHeight: 160,
    marginBottom: 20,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  reasonOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  reasonRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#7A9485',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonRadioSelected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5584A',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBlockBtn: {
    flex: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  confirmBlockGradient: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBlockText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default PrivacySecurityScreen;
