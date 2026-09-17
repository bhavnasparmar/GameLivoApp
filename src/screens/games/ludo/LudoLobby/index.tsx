import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  Animated,
  Easing,
  Share,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { useAppSelector } from '../../../../redux/hooks';
import { socketService } from '../../../../services/socket/socketService';
import { SOCKET_EVENTS } from '../../../../constants/socketConstants';
import { friendsService } from '../../../../services/friends/friendsService';
import { Friend } from '../../../../types/friends';
import { soundService } from '../../../../services/sound/soundService';
import { vibrationService } from '../../../../services/vibration/vibrationService';
import { LUDO_BOT_PROFILES, LUDO_COLOR_THEMES, LUDO_6P_COLORS } from '../../../../gameEngine/ludo/ludoConstants';

const { width } = Dimensions.get('window');

const LUDO_TABLE_CAPACITY_OPTIONS = [
  { count: 1, label: '1 Player', title: 'Solo vs Bots', icon: '🤖', desc: '1 to 5 Bots', color: '#E74C3C' },
  { count: 2, label: '2 Players', title: '1v1 Duel', icon: '⚔️', desc: 'Fast & Intense', color: '#E67E22' },
  { count: 3, label: '3 Players', title: '3-Way Trio', icon: '⚡', desc: 'Triangle Clash', color: '#F1C40F' },
  { count: 4, label: '4 Players', title: 'Classic 4P', icon: '🎯', desc: 'Official Match', color: '#2ECC71' },
  { count: 5, label: '5 Players', title: 'Squad 5P', icon: '🌟', desc: '5-Way Mayhem', color: '#1ABC9C' },
  { count: 6, label: '6 Players', title: 'Hexa 6P', icon: '🔥', desc: 'Full Hexagon', color: '#9B59B6' },
];

const TURN_TIME_OPTIONS = [
  { seconds: 10, label: '10s Blitz' },
  { seconds: 15, label: '15s Standard' },
  { seconds: 30, label: '30s Relaxed' },
];

const SEARCH_STATUS_MESSAGES = [
  'Searching for active Ludo champions...',
  'Connecting to GameLivo Speed Arena...',
  'Matching players of similar rating (1,400 - 1,550)...',
  'Preparing 3D board & dealing player colors...',
  'All players connected! Starting match...',
];

interface LobbyRoomPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isBot: boolean;
  isReady: boolean;
  rating?: number;
  ping?: string;
  color?: any;
}

export const LudoLobbyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const currentUserId = useAppSelector((state) => state.auth.userId) || 'player_me';
  const playerName = userProfile?.name || userProfile?.username || 'You';
  const userAvatar = userProfile?.avatar || '👩🏻';
  const userCoins = userProfile?.coins || 2500;
  const userRating = userProfile?.gameStats?.find((g) => g.gameId === 'ludo')?.rank || 1500;

  const mode = route.params?.mode || 'random'; // 'random' (Quick Match) or 'private' (Play with Friends)
  const isHostParam = route.params?.isHost ?? (mode === 'private');

  // Room Setup State
  const [selectedCapacity, setSelectedCapacity] = useState<number>(route.params?.playerCount || 4);
  const [selectedTurnTime, setSelectedTurnTime] = useState<number>(route.params?.timeSeconds || 15);

  // Quick Match State
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [statusMsgIndex, setStatusMsgIndex] = useState<number>(0);
  const [matchedOpponents, setMatchedOpponents] = useState<any[]>([]);
  const [isMatchReady, setIsMatchReady] = useState<boolean>(false);
  const [matchCountdown, setMatchCountdown] = useState<number>(3);

  // Private Mode State
  const [privateTab, setPrivateTab] = useState<'create' | 'join'>(isHostParam ? 'create' : 'join');
  const [isRoomCreated, setIsRoomCreated] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string>(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `LUDO-${res}`;
  });
  const [inputJoinCode, setInputJoinCode] = useState<string>('');
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());

  // Room Players List
  const [roomPlayers, setRoomPlayers] = useState<LobbyRoomPlayer[]>([
    {
      id: currentUserId,
      name: playerName,
      avatar: userAvatar,
      isHost: true,
      isBot: false,
      isReady: true,
      rating: userRating,
      ping: '24ms',
    },
  ]);

  const [toastMsg, setToastMsg] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  // Pulse animation for search radar
  const radarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSearching) {
      Animated.loop(
        Animated.timing(radarAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ).start();
    } else {
      radarAnim.setValue(0);
    }
  }, [isSearching]);

  // Quick Match Timer Simulation
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isSearching && !isMatchReady) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next === 2) setStatusMsgIndex(1);
          if (next === 3) setStatusMsgIndex(2);
          if (next === 4) {
            setStatusMsgIndex(3);
            const numOpponents = selectedCapacity === 1 ? 3 : Math.max(1, selectedCapacity - 1);
            const bots = LUDO_BOT_PROFILES.slice(0, numOpponents);
            setMatchedOpponents(bots);
          }
          if (next === 5) {
            setStatusMsgIndex(4);
            setIsMatchReady(true);
            setMatchCountdown(3);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSearching, isMatchReady, selectedCapacity]);

  // Launch Match after countdown
  useEffect(() => {
    let countdownTimer: ReturnType<typeof setInterval>;
    if (isMatchReady && matchCountdown > 0) {
      countdownTimer = setInterval(() => {
        setMatchCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            launchGameScreen();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownTimer);
  }, [isMatchReady, matchCountdown]);

  // Load Friends List
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friends = await friendsService.getFriends();
        setFriendsList(friends || []);
      } catch (e) {
        // Mock fallback
        setFriendsList([
          { id: 'f_1', username: 'Rohan_Master', avatar: '🧔🏽', isOnline: true, status: 'online' } as any,
          { id: 'f_2', username: 'Sneha_Dice', avatar: '👱🏼‍♀️', isOnline: true, status: 'online' } as any,
          { id: 'f_3', username: 'Karan_Pro', avatar: '👨🏽‍🎓', isOnline: false, status: 'offline' } as any,
        ]);
      }
    };
    fetchFriends();
  }, []);

  const handleCreateRoom = () => {
    soundService.play('button_tap');
    vibrationService.vibrateTap();
    setIsRoomCreated(true);
    showToast(`Room #${roomCode} created! Share PIN with friends.`);
  };

  const handleAddBot = (slotIdx: number) => {
    if (roomPlayers.length >= selectedCapacity) {
      showToast('Room is already full!');
      return;
    }
    const availableBots = LUDO_BOT_PROFILES.filter(
      (b) => !roomPlayers.some((p) => p.id === b.id),
    );
    const bot = availableBots[0] || LUDO_BOT_PROFILES[0];
    const newBotPlayer: LobbyRoomPlayer = {
      id: `${bot.id}_${Date.now()}`,
      name: bot.name,
      avatar: bot.avatar,
      isHost: false,
      isBot: true,
      isReady: true,
      rating: bot.rating,
      ping: '10ms',
    };
    setRoomPlayers((prev) => [...prev, newBotPlayer]);
    showToast(`Added ${bot.name} (Bot)`);
  };

  const handleKickPlayer = (id: string) => {
    setRoomPlayers((prev) => prev.filter((p) => p.id !== id));
    showToast('Player removed');
  };

  const handleInviteFriend = (friend: Friend) => {
    setInvitedFriends((prev) => new Set(prev).add(friend.id));
    showToast(`Invite sent to ${friend.username}! 📩`);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `🎲 Join my Ludo Match on GameLivo! Room PIN: ${roomCode}`,
      });
    } catch (error) {
      Clipboard.setString(roomCode);
      showToast('Room PIN copied to clipboard!');
    }
  };

  const handleCopyCode = () => {
    Clipboard.setString(roomCode);
    showToast('Room PIN copied! 📋');
  };

  const handleJoinWithCode = () => {
    if (!inputJoinCode.trim()) {
      showToast('Please enter a valid room PIN code');
      return;
    }
    soundService.play('button_tap');
    showToast(`Joining room ${inputJoinCode.trim().toUpperCase()}...`);
    setTimeout(() => {
      navigation.navigate(ROUTES.LUDO_GAME, {
        matchId: inputJoinCode.trim().toUpperCase(),
        mode: 'private',
        playerCount: selectedCapacity,
        timeSeconds: selectedTurnTime,
      });
    }, 1000);
  };

  const launchGameScreen = () => {
    let finalPlayers: Array<{
      id: string;
      name: string;
      avatar: string;
      isBot: boolean;
      isHost: boolean;
      rating?: number;
    }> = [];

    const effectiveCapacity = selectedCapacity === 1 ? 4 : selectedCapacity;

    if (mode === 'random') {
      const numOpponents = effectiveCapacity - 1;
      const bots =
        matchedOpponents.length >= numOpponents
          ? matchedOpponents.slice(0, numOpponents)
          : LUDO_BOT_PROFILES.slice(0, numOpponents);

      finalPlayers = [
        {
          id: currentUserId,
          name: playerName,
          avatar: userAvatar,
          isHost: true,
          isBot: false,
          rating: userRating,
        },
        ...bots.map((b, idx) => ({
          id: `bot_${b.id || idx}_${Date.now()}`,
          name: b.name,
          avatar: b.avatar,
          isBot: true,
          isHost: false,
          rating: b.rating,
        })),
      ];
    } else {
      finalPlayers = roomPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isBot: p.isBot,
        isHost: p.isHost,
        rating: p.rating,
      }));
    }

    navigation.navigate(ROUTES.LUDO_GAME, {
      matchId: roomCode,
      mode: mode === 'random' ? 'quick_match' : 'private',
      playerCount: effectiveCapacity,
      timeSeconds: selectedTurnTime,
      players: finalPlayers,
    });
  };

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
            <Text style={styles.appBarTitle}>
              {mode === 'random' ? 'QUICK MATCH LOBBY' : 'CUSTOM LUDO ROOM'}
            </Text>
          </View>

          <View style={styles.coinPill}>
            <Text style={styles.coinDot}>🪙</Text>
            <Text style={styles.coinText}>{userCoins.toLocaleString()}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Toast Banner */}
      {toastMsg ? (
        <View style={styles.toastBanner}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      {/* Quick Match Screen */}
      {mode === 'random' ? (
        <View style={styles.quickMatchContainer}>
          {!isSearching ? (
            <ScrollView contentContainerStyle={styles.quickSetupContent}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1A252F' }]}>
                Choose Table Capacity
              </Text>

              <View style={styles.capacityGrid}>
                {LUDO_TABLE_CAPACITY_OPTIONS.map((opt) => {
                  const isSelected = selectedCapacity === opt.count;
                  return (
                    <TouchableOpacity
                      key={opt.count}
                      activeOpacity={0.8}
                      style={[styles.capacityCard, isSelected && styles.selectedCapacityCard]}
                      onPress={() => setSelectedCapacity(opt.count)}
                    >
                      <Text style={styles.capEmoji}>{opt.icon}</Text>
                      <Text style={[styles.capTitle, isSelected && { color: '#E74C3C' }]}>
                        {opt.title}
                      </Text>
                      <Text style={styles.capDesc}>{opt.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.findMatchBtn}
                onPress={() => {
                  setIsSearching(true);
                  setElapsedSeconds(0);
                  setStatusMsgIndex(0);
                }}
              >
                <LinearGradient
                  colors={['#E74C3C', '#C0392B']}
                  style={styles.findMatchGrad}
                >
                  <Text style={styles.findMatchText}>
                    FIND {selectedCapacity}P MATCH ⚡
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.searchingWrap}>
              {/* Radar Pulse */}
              <View style={styles.radarCenter}>
                <Animated.View
                  style={[
                    styles.radarWave,
                    {
                      transform: [
                        {
                          scale: radarAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2.8],
                          }),
                        },
                      ],
                      opacity: radarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 0],
                      }),
                    },
                  ]}
                />
                <View style={styles.radarUserAvatar}>
                  <Text style={styles.radarEmoji}>{userAvatar}</Text>
                </View>
              </View>

              <Text style={styles.searchingStatus}>
                {SEARCH_STATUS_MESSAGES[statusMsgIndex]}
              </Text>
              <Text style={styles.elapsedText}>{elapsedSeconds}s elapsed</Text>

              {isMatchReady && (
                <View style={styles.matchReadyBanner}>
                  <Text style={styles.readyTitle}>MATCH FOUND! 🎲</Text>
                  <Text style={styles.countdownText}>
                    Starting in {matchCountdown}...
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.cancelSearchBtn}
                onPress={() => {
                  setIsSearching(false);
                  setIsMatchReady(false);
                }}
              >
                <Text style={styles.cancelSearchText}>Cancel Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        /* Private Room Tabs: Create / Join */
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Tab Switcher */}
          <View style={styles.tabSwitcher}>
            <TouchableOpacity
              style={[styles.tabBtn, privateTab === 'create' && styles.activeTabBtn]}
              onPress={() => setPrivateTab('create')}
            >
              <Text style={[styles.tabText, privateTab === 'create' && styles.activeTabText]}>
                Create Room
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, privateTab === 'join' && styles.activeTabBtn]}
              onPress={() => setPrivateTab('join')}
            >
              <Text style={[styles.tabText, privateTab === 'join' && styles.activeTabText]}>
                Join with PIN
              </Text>
            </TouchableOpacity>
          </View>

          {privateTab === 'create' ? (
            <View>
              {/* Capacity Selector (1 to 6 Players) */}
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1A252F', marginTop: 12 }]}>
                Table Player Capacity (1 - 6 Players)
              </Text>

              <View style={styles.capacityGrid}>
                {LUDO_TABLE_CAPACITY_OPTIONS.map((opt) => {
                  const isSelected = selectedCapacity === opt.count;
                  return (
                    <TouchableOpacity
                      key={opt.count}
                      activeOpacity={0.8}
                      style={[styles.capacityCard, isSelected && styles.selectedCapacityCard]}
                      onPress={() => {
                        setSelectedCapacity(opt.count);
                        // Adjust room players if exceeds new capacity
                        setRoomPlayers((prev) => prev.slice(0, opt.count));
                      }}
                    >
                      <Text style={styles.capEmoji}>{opt.icon}</Text>
                      <Text style={[styles.capTitle, isSelected && { color: '#E74C3C' }]}>
                        {opt.title}
                      </Text>
                      <Text style={styles.capDesc}>{opt.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Room PIN Code Card */}
              <View style={styles.roomCodeCard}>
                <LinearGradient
                  colors={['#1F2937', '#111827']}
                  style={styles.roomCodeGrad}
                >
                  <Text style={styles.roomCodeLabel}>ROOM PIN CODE</Text>
                  <Text style={styles.roomCodeValue}>{roomCode}</Text>

                  <View style={styles.roomCodeBtnRow}>
                    <TouchableOpacity
                      style={styles.actionPillBtn}
                      onPress={handleCopyCode}
                    >
                      <Text style={styles.actionPillText}>📋 Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionPillBtn, { backgroundColor: '#2ECC71' }]}
                      onPress={handleShareCode}
                    >
                      <Text style={styles.actionPillText}>📲 Share PIN</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>

              {/* Live Room Table Seats (1 to 6 Seats) */}
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1A252F', marginTop: 16 }]}>
                Table Seats ({roomPlayers.length}/{selectedCapacity})
              </Text>

              <View style={styles.seatsList}>
                {Array.from({ length: selectedCapacity }, (_, slotIdx) => {
                  const player = roomPlayers[slotIdx];
                  const seatColor = LUDO_6P_COLORS[slotIdx];
                  const theme = LUDO_COLOR_THEMES[seatColor];

                  return (
                    <View
                      key={slotIdx}
                      style={[
                        styles.seatRow,
                        player && { borderColor: theme.primary },
                      ]}
                    >
                      {player ? (
                        <>
                          <View style={[styles.seatAvatarWrap, { borderColor: theme.primary }]}>
                            <Text style={styles.seatAvatarEmoji}>{player.avatar}</Text>
                          </View>

                          <View style={styles.seatInfo}>
                            <View style={styles.seatNameRow}>
                              <Text style={styles.seatName}>{player.name}</Text>
                              {player.isHost && (
                                <View style={styles.hostTag}>
                                  <Text style={styles.hostTagText}>HOST</Text>
                                </View>
                              )}
                              {player.isBot && (
                                <View style={styles.botTag}>
                                  <Text style={styles.botTagText}>BOT</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.seatColorText}>
                              {theme.badge} {theme.name} · ⭐ {player.rating || 1450}
                            </Text>
                          </View>

                          {!player.isHost && (
                            <TouchableOpacity
                              style={styles.kickBtn}
                              onPress={() => handleKickPlayer(player.id)}
                            >
                              <Text style={styles.kickBtnText}>✕</Text>
                            </TouchableOpacity>
                          )}
                        </>
                      ) : (
                        <>
                          <View style={styles.emptySeatCircle}>
                            <Text style={styles.emptySeatPlus}>+</Text>
                          </View>

                          <View style={styles.seatInfo}>
                            <Text style={styles.emptySeatTitle}>
                              Seat #{slotIdx + 1} ({theme.name})
                            </Text>
                            <Text style={styles.emptySeatSub}>Waiting for player...</Text>
                          </View>

                          <TouchableOpacity
                            style={styles.addBotBtn}
                            onPress={() => handleAddBot(slotIdx)}
                          >
                            <Text style={styles.addBotText}>+ Add Bot</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Start Match Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.launchBtn}
                onPress={launchGameScreen}
              >
                <LinearGradient
                  colors={['#E74C3C', '#C0392B', '#922B21']}
                  style={styles.launchGrad}
                >
                  <Text style={styles.launchBtnText}>
                    START MATCH NOW 🚀
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            /* Join Room Tab */
            <View style={styles.joinContainer}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1A252F', marginTop: 16 }]}>
                Enter 4-8 Character Room PIN
              </Text>

              <TextInput
                value={inputJoinCode}
                onChangeText={setInputJoinCode}
                placeholder="e.g. LUDO-7B9Q"
                placeholderTextColor="#6B7280"
                autoCapitalize="characters"
                style={styles.pinInput}
              />

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.joinBtn}
                onPress={handleJoinWithCode}
              >
                <LinearGradient
                  colors={['#2ECC71', '#27AE60']}
                  style={styles.joinGrad}
                >
                  <Text style={styles.joinBtnText}>JOIN ROOM 🎲</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
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
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
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
  toastBanner: {
    backgroundColor: '#F39C12',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  content: {
    padding: 16,
  },
  quickMatchContainer: {
    flex: 1,
  },
  quickSetupContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  capacityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  capacityCard: {
    width: (width - 44) / 2,
    backgroundColor: '#1E272E',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedCapacityCard: {
    borderColor: '#E74C3C',
    backgroundColor: '#2C3E50',
  },
  capEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  capTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  capDesc: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  findMatchBtn: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  findMatchGrad: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findMatchText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  searchingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  radarCenter: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  radarWave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E74C3C',
  },
  radarUserAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2C3E50',
    borderWidth: 3,
    borderColor: '#E74C3C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarEmoji: {
    fontSize: 32,
  },
  searchingStatus: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  elapsedText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 24,
  },
  matchReadyBanner: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#2ECC71',
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  readyTitle: {
    color: '#2ECC71',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelSearchBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelSearchText: {
    color: '#E74C3C',
    fontWeight: '800',
    fontSize: 13,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#1E272E',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabBtn: {
    backgroundColor: '#E74C3C',
  },
  tabText: {
    color: '#9CA3AF',
    fontWeight: '800',
    fontSize: 13,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  roomCodeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E74C3C',
    marginTop: 12,
  },
  roomCodeGrad: {
    padding: 16,
    alignItems: 'center',
  },
  roomCodeLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  roomCodeValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
    marginVertical: 8,
  },
  roomCodeBtnRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  actionPillBtn: {
    backgroundColor: '#3498DB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  actionPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  seatsList: {
    marginBottom: 16,
  },
  seatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E272E',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  seatAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#2C3E50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  seatAvatarEmoji: {
    fontSize: 20,
  },
  seatInfo: {
    flex: 1,
  },
  seatNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginRight: 6,
  },
  hostTag: {
    backgroundColor: '#F39C12',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  hostTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#000000',
  },
  botTag: {
    backgroundColor: '#7F8C8D',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  botTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  seatColorText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  kickBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kickBtnText: {
    color: '#E74C3C',
    fontWeight: '900',
    fontSize: 12,
  },
  emptySeatCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  emptySeatPlus: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySeatTitle: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  emptySeatSub: {
    color: '#6B7280',
    fontSize: 10,
  },
  addBotBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addBotText: {
    color: '#ECF0F1',
    fontSize: 11,
    fontWeight: '800',
  },
  launchBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  launchGrad: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  joinContainer: {
    paddingVertical: 10,
  },
  pinInput: {
    backgroundColor: '#1E272E',
    borderWidth: 2,
    borderColor: '#2ECC71',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginVertical: 16,
  },
  joinBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  joinGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});

export default LudoLobbyScreen;
