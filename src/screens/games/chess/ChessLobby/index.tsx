import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Animated,
  Easing,
  TextInput,
  Share,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { socketService } from '../../../../services/socket/socketService';
import { SOCKET_EVENTS } from '../../../../constants/socketConstants';
import { friendsService } from '../../../../services/friends/friendsService';
import { Friend } from '../../../../types/friends';
import { useAppSelector } from '../../../../redux/hooks';

const SEARCH_STATUS_MESSAGES = [
  'Searching for Grandmaster Opponents...',
  'Connecting to GameLivo Chess Arena...',
  'Matching with similar ELO (1400 - 1450)...',
  'Setting up 1v1 Clock & Board...',
];

const MOCK_FRIENDS_FALLBACK: Friend[] = [
  { id: 'u_101', name: 'Riya Sharma', username: 'riya_s', level: 24, rank: 142, isOnline: true, currentActivity: 'Online' },
  { id: 'u_102', name: 'Karan Verma', username: 'kv_plays', level: 31, rank: 88, isOnline: true, currentActivity: 'In Arena' },
  { id: 'u_103', name: 'Meera Joshi', username: 'meera_j', level: 19, rank: 215, isOnline: true, currentActivity: 'Online' },
  { id: 'u_104', name: 'Arjun Dev', username: 'arjun_d', level: 42, rank: 30, isOnline: false, lastSeen: '2h ago' },
];

export const ChessLobbyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const currentUserId = useAppSelector((state) => state.auth.userId) || 'guest_me';
  const username = userProfile?.username || 'You';

  const mode = route.params?.mode || 'random'; // 'private' or 'random'
  const isHostParam = route.params?.isHost ?? true;

  // Private mode tabs: 'create' or 'join'
  const [privateTab, setPrivateTab] = useState<'create' | 'join'>(isHostParam ? 'create' : 'join');
  const [roomCode, setRoomCode] = useState(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  });
  const [inputJoinCode, setInputJoinCode] = useState('');
  const [selectedTime, setSelectedTime] = useState(300); // 5 min default
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMsgIndex, setStatusMsgIndex] = useState(0);

  // Matchmaking State (Quick Match)
  const [isSearching, setIsSearching] = useState(mode === 'random');
  const [matchFoundData, setMatchFoundData] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(3);

  // Private Lobby Multiplayer State
  const [joinedFriend, setJoinedFriend] = useState<{
    userId: string;
    username: string;
    avatar?: string;
    rating?: number;
    isReady?: boolean;
  } | null>(null);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [hasJoinedAsGuest, setHasJoinedAsGuest] = useState(false);
  const [invitedFriendIds, setInvitedFriendIds] = useState<Set<string>>(new Set());

  // Friends list
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  // Animation values
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const matchFoundScale = useRef(new Animated.Value(0.8)).current;
  const matchFoundOpacity = useRef(new Animated.Value(0)).current;

  // Fetch friends list for invite section
  const loadFriends = useCallback(async () => {
    setIsLoadingFriends(true);
    try {
      const friends = await friendsService.getFriends();
      if (friends && friends.length > 0) {
        // Filter out self if present
        const filtered = friends.filter((f) => f.id !== currentUserId && f.username !== username);
        setFriendsList(filtered.length > 0 ? filtered : MOCK_FRIENDS_FALLBACK);
      } else {
        setFriendsList(MOCK_FRIENDS_FALLBACK);
      }
    } catch {
      setFriendsList(MOCK_FRIENDS_FALLBACK);
    } finally {
      setIsLoadingFriends(false);
    }
  }, [currentUserId, username]);

  useEffect(() => {
    if (mode === 'private') {
      loadFriends();
    }
  }, [mode, loadFriends]);

  // Radar Animation Loop
  useEffect(() => {
    if (!isSearching) return;

    const createPulse = (anim: Animated.Value, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulse1 = createPulse(pulseAnim1, 0);
    const pulse2 = createPulse(pulseAnim2, 1000);

    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    pulse1.start();
    pulse2.start();
    rotation.start();

    return () => {
      pulse1.stop();
      pulse2.stop();
      rotation.stop();
    };
  }, [isSearching, pulseAnim1, pulseAnim2, rotateAnim]);

  // Status message cycler & elapsed timer for Quick Match
  useEffect(() => {
    if (!isSearching) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const msgTimer = setInterval(() => {
      setStatusMsgIndex((prev) => (prev + 1) % SEARCH_STATUS_MESSAGES.length);
    }, 2200);

    return () => {
      clearInterval(timer);
      clearInterval(msgTimer);
    };
  }, [isSearching]);

  // Quick Match Socket Connection & Listeners
  useEffect(() => {
    if (mode !== 'random') return;

    let isMounted = true;

    const startMatchmaking = async () => {
      try {
        if (!socketService.isConnected()) {
          await socketService.connect();
        }

        socketService.emit(SOCKET_EVENTS.MATCH_QUEUE_JOIN, {
          gameId: 'chess',
          timeSeconds: selectedTime,
          entryFee: 0,
        });
      } catch (err) {
        console.error('Failed to connect socket for matchmaking:', err);
      }
    };

    const handleMatchFound = (data: any) => {
      if (!isMounted) return;

      setIsSearching(false);
      setMatchFoundData(data);

      Animated.parallel([
        Animated.spring(matchFoundScale, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(matchFoundOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    };

    startMatchmaking();
    socketService.on(SOCKET_EVENTS.MATCH_FOUND, handleMatchFound);
    socketService.on(SOCKET_EVENTS.GAME_START, handleMatchFound);

    return () => {
      isMounted = false;
      socketService.off(SOCKET_EVENTS.MATCH_FOUND);
      socketService.off(SOCKET_EVENTS.GAME_START);
      socketService.emit(SOCKET_EVENTS.MATCH_QUEUE_LEAVE, { gameId: 'chess' });
    };
  }, [mode, selectedTime, matchFoundScale, matchFoundOpacity]);

  // Quick Match Countdown & Navigation Trigger
  useEffect(() => {
    if (!matchFoundData || mode !== 'random') return;

    if (countdown > 0) {
      const cdTimer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(cdTimer);
    }

    const whitePlayer = matchFoundData.whitePlayer || matchFoundData.players?.[0];
    const blackPlayer = matchFoundData.blackPlayer || matchFoundData.players?.[1];
    const isUserWhite =
      whitePlayer?.userId === currentUserId ||
      whitePlayer?.username === username ||
      (!whitePlayer?.userId?.startsWith('bot_') && blackPlayer?.userId?.startsWith('bot_'));

    const myColor = isUserWhite ? 'white' : 'black';
    const opponent = isUserWhite ? blackPlayer : whitePlayer;

    navigation.replace(ROUTES.CHESS_GAME, {
      matchId: matchFoundData.matchId,
      mode: 'random',
      timeSeconds: matchFoundData.timeSeconds || selectedTime,
      myColor,
      whitePlayer: whitePlayer?.username || (isUserWhite ? username : 'Opponent'),
      blackPlayer: blackPlayer?.username || (isUserWhite ? 'Opponent' : username),
      opponent: {
        name: opponent?.username || 'Grandmaster Opponent',
        rating: opponent?.rating || 1410,
        avatar: opponent?.avatar || '',
      },
      initialGameState: matchFoundData.gameState,
    });
  }, [matchFoundData, countdown, currentUserId, username, navigation, selectedTime, mode]);

  // ─── Play with Friends Socket Handlers ───────────────────────────────────────
  useEffect(() => {
    if (mode !== 'private') return;

    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // If host, create/join the room on socket server
    if (privateTab === 'create' && roomCode) {
      socketService.emit(SOCKET_EVENTS.LOBBY_CREATE, {
        gameId: 'chess',
        code: roomCode,
        mode: 'private',
        maxPlayers: 2,
        timeSeconds: selectedTime,
      });
    }

    // Handle lobby updates (when friend joins or leaves)
    const handleLobbyUpdate = (lobby: any) => {
      if (!lobby || !lobby.players) return;

      const otherPlayer = lobby.players.find((p: any) => p.userId !== currentUserId);
      if (otherPlayer) {
        setJoinedFriend({
          userId: otherPlayer.userId,
          username: otherPlayer.username,
          avatar: otherPlayer.avatar,
          rating: otherPlayer.rating || 1420,
          isReady: otherPlayer.isReady ?? true,
        });
      } else {
        setJoinedFriend(null);
      }
    };

    // Handle incoming game start from host
    const handleGameStart = (data: any) => {
      const whitePlayer = data.whitePlayer || data.players?.[0];
      const blackPlayer = data.blackPlayer || data.players?.[1];

      const isUserWhite =
        whitePlayer?.userId === currentUserId ||
        whitePlayer?.username === username ||
        privateTab === 'create';

      const myColor = isUserWhite ? 'white' : 'black';
      const opponent = isUserWhite ? blackPlayer : whitePlayer;

      navigation.replace(ROUTES.CHESS_GAME, {
        matchId: data.matchId || `chess_${roomCode}`,
        mode: 'private',
        timeSeconds: data.timeSeconds || selectedTime,
        myColor,
        whitePlayer: whitePlayer?.username || (isUserWhite ? username : opponent?.username || 'Friend'),
        blackPlayer: blackPlayer?.username || (isUserWhite ? opponent?.username || 'Friend' : username),
        opponent: {
          name: opponent?.username || 'Friend',
          rating: opponent?.rating || 1420,
          avatar: opponent?.avatar || '',
        },
        initialGameState: data.gameState,
      });
    };

    // Handle invite response
    const handleInviteResponse = (data: { friendUsername?: string; accepted?: boolean }) => {
      if (data.accepted) {
        Alert.alert('Friend Joined! 🎉', `${data.friendUsername || 'Your friend'} accepted the invite and joined the room!`);
      } else {
        Alert.alert('Invite Declined', `${data.friendUsername || 'Your friend'} could not join right now.`);
      }
    };

    // Handle Socket Validation / Business Logic Errors
    const handleSocketError = (err: { message?: string }) => {
      setIsJoiningRoom(false);
      Alert.alert('Notice', err.message || 'An error occurred with the room.');
    };

    socketService.on(SOCKET_EVENTS.LOBBY_UPDATE, handleLobbyUpdate);
    socketService.on(SOCKET_EVENTS.GAME_START, handleGameStart);
    socketService.on(SOCKET_EVENTS.FRIEND_INVITE_RESPONSE, handleInviteResponse);
    socketService.on(SOCKET_EVENTS.CONNECT_ERROR, handleSocketError);
    socketService.on('error', handleSocketError);

    return () => {
      socketService.off(SOCKET_EVENTS.LOBBY_UPDATE);
      socketService.off(SOCKET_EVENTS.GAME_START);
      socketService.off(SOCKET_EVENTS.FRIEND_INVITE_RESPONSE);
      socketService.off(SOCKET_EVENTS.CONNECT_ERROR);
      socketService.off('error');
      if (privateTab === 'create') {
        socketService.emit(SOCKET_EVENTS.LOBBY_LEAVE);
      }
    };
  }, [mode, privateTab, roomCode, currentUserId, username, navigation, selectedTime]);

  const handleCancel = () => {
    if (mode === 'random') {
      socketService.emit(SOCKET_EVENTS.MATCH_QUEUE_LEAVE, { gameId: 'chess' });
    } else {
      socketService.emit(SOCKET_EVENTS.LOBBY_LEAVE);
    }
    navigation.goBack();
  };

  const handleCopyCode = () => {
    Clipboard.setString(roomCode);
    Alert.alert('Room Code Copied! 📋', `Code #${roomCode} copied to clipboard. Share it with your friend!`);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `⚔️ Play Chess with me on GameLivo!\nRoom Code: #${roomCode}\nJoin now and make your move!`,
      });
    } catch (err) {
      console.error('Error sharing code:', err);
    }
  };

  const handleGenerateNewCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRoomCode(res);
    setJoinedFriend(null);
    setInvitedFriendIds(new Set());

    socketService.emit(SOCKET_EVENTS.LOBBY_CREATE, {
      gameId: 'chess',
      code: res,
      mode: 'private',
      maxPlayers: 2,
      timeSeconds: selectedTime,
    });
  };

  const handleSendInviteToFriend = (friend: Friend) => {
    const friendId = friend.id;

    // Validation: prevent self-invite
    if (friendId === currentUserId) {
      Alert.alert('Validation Error', 'You cannot invite yourself.');
      return;
    }

    if (invitedFriendIds.has(friendId)) {
      Alert.alert('Already Invited', `An invite was already sent to ${friend.name || friend.username}.`);
      return;
    }

    setInvitedFriendIds((prev) => new Set(prev).add(friendId));

    socketService.emit(SOCKET_EVENTS.FRIEND_GAME_INVITE, {
      friendUserId: friendId,
      gameId: 'chess',
      roomCode,
      timeSeconds: selectedTime,
    });

    Alert.alert(
      'Invite Sent! ✉️',
      `Sent a game invitation to ${friend.name || friend.username} for Room #${roomCode}.`,
    );
  };

  // Sanitized Code input handler
  const handleCodeInputChange = (text: string) => {
    // Only allow alphanumeric uppercase characters, max 8
    const cleaned = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
    setInputJoinCode(cleaned);
  };

  const handleJoinByCode = async () => {
    const cleanCode = inputJoinCode.trim().toUpperCase();

    // 1. Validation: code length
    if (cleanCode.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid 4-8 character room code.');
      return;
    }

    // 2. Validation: cannot join own room
    if (cleanCode === roomCode && privateTab === 'create') {
      Alert.alert('Validation', 'You are already the host of this room.');
      return;
    }

    setIsJoiningRoom(true);
    try {
      if (!socketService.isConnected()) {
        await socketService.connect();
      }

      socketService.emit(SOCKET_EVENTS.LOBBY_JOIN, {
        code: cleanCode,
        gameId: 'chess',
      });

      setRoomCode(cleanCode);
      setHasJoinedAsGuest(true);
    } catch (err) {
      Alert.alert('Join Failed', 'Could not connect to the room. Please check your network and try again.');
    } finally {
      setIsJoiningRoom(false);
    }
  };

  const handleStartPrivateMatch = () => {
    if (joinedFriend) {
      // Synchronized match with friend
      socketService.emit(SOCKET_EVENTS.LOBBY_START_GAME, {
        timeSeconds: selectedTime,
      });
    } else {
      // Confirmation dialog if friend hasn't joined yet
      Alert.alert(
        'Friend Has Not Joined Yet',
        `Your friend has not entered Room #${roomCode} yet.\n\nWould you like to share the code with your friend or start a solo test match?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share Code 📤', onPress: handleShareCode },
          {
            text: 'Start Solo Match',
            onPress: () => {
              navigation.replace(ROUTES.CHESS_GAME, {
                matchId: `match_${roomCode}`,
                mode: 'private',
                timeSeconds: selectedTime,
                myColor: 'white',
                whitePlayer: username,
                blackPlayer: 'Friend (Guest)',
                opponent: {
                  name: 'Friend (Guest)',
                  rating: 1420,
                  avatar: '',
                },
              });
            },
          },
        ]
      );
    }
  };

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isJoinBtnDisabled = inputJoinCode.trim().length < 4 || isJoiningRoom;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A120E' : '#F4F9F5' }]}>
      <StatusBar barStyle="light-content" />

      {/* App Bar */}
      <LinearGradient
        colors={isDark ? ['#0F3628', '#0A2019', '#061611'] : ['#155A3F', '#0F4530', '#0B3323']}
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 10, 28) }]}
      >
        <View style={styles.appBarRow}>
          <TouchableOpacity activeOpacity={0.7} style={styles.backBtn} onPress={handleCancel}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>
            {mode === 'random' ? 'Quick Matchmaking' : 'Play with Friends'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Sub-tab Pill Switcher for Private Mode */}
        {mode === 'private' && (
          <View style={styles.tabPillWrap}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.tabBtn, privateTab === 'create' && styles.activeTabBtn]}
              onPress={() => setPrivateTab('create')}
            >
              <Text style={[styles.tabText, privateTab === 'create' && styles.activeTabText]}>
                👑 Create Room
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.tabBtn, privateTab === 'join' && styles.activeTabBtn]}
              onPress={() => setPrivateTab('join')}
            >
              <Text style={[styles.tabText, privateTab === 'join' && styles.activeTabText]}>
                🔑 Join Room
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {mode === 'random' ? (
        /* Quick Match / Matchmaking Screen */
        <View style={styles.quickMatchContainer}>
          <ScrollView
            contentContainerStyle={[styles.quickMatchContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Radar Animation Area */}
            <View style={styles.radarSection}>
              {isSearching ? (
                <View style={styles.radarWrapper}>
                  {/* Pulse Ring 1 */}
                  <Animated.View
                    style={[
                      styles.pulseRing,
                      {
                        transform: [
                          {
                            scale: pulseAnim1.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 2.4],
                            }),
                          },
                        ],
                        opacity: pulseAnim1.interpolate({
                          inputRange: [0, 0.7, 1],
                          outputRange: [0.8, 0.3, 0],
                        }),
                      },
                    ]}
                  />

                  {/* Pulse Ring 2 */}
                  <Animated.View
                    style={[
                      styles.pulseRing,
                      {
                        transform: [
                          {
                            scale: pulseAnim2.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 2.4],
                            }),
                          },
                        ],
                        opacity: pulseAnim2.interpolate({
                          inputRange: [0, 0.7, 1],
                          outputRange: [0.8, 0.3, 0],
                        }),
                      },
                    ]}
                  />

                  {/* Rotating Orbit with Chess Glyphs */}
                  <Animated.View style={[styles.orbitCircle, { transform: [{ rotate: spin }] }]}>
                    <View style={styles.orbitBadgeTop}>
                      <Text style={styles.orbitGlyph}>♚</Text>
                    </View>
                    <View style={styles.orbitBadgeBottom}>
                      <Text style={styles.orbitGlyph}>♞</Text>
                    </View>
                  </Animated.View>

                  {/* Central Hub */}
                  <LinearGradient colors={['#F0C64A', '#D4A017', '#9C6C0C']} style={styles.centerRadarHub}>
                    <Text style={styles.centerRadarIcon}>⚡</Text>
                  </LinearGradient>
                </View>
              ) : (
                /* Match Found Pop-In Card */
                <Animated.View
                  style={[
                    styles.matchFoundBanner,
                    {
                      opacity: matchFoundOpacity,
                      transform: [{ scale: matchFoundScale }],
                    },
                  ]}
                >
                  <LinearGradient colors={['#1F9D55', '#0E5C31']} style={styles.matchFoundGradient}>
                    <Text style={styles.matchFoundEmblem}>⚔️</Text>
                    <Text style={styles.matchFoundHeading}>OPPONENT FOUND!</Text>
                    <Text style={styles.matchFoundCountdown}>
                      Starting match in {countdown}s...
                    </Text>
                  </LinearGradient>
                </Animated.View>
              )}

              {/* Live Match Timer & Status */}
              <View style={styles.statusBox}>
                {isSearching && (
                  <View style={styles.timerBadge}>
                    <Text style={styles.timerText}>{formatElapsed(elapsedSeconds)}</Text>
                  </View>
                )}
                <Text style={[styles.statusText, { color: isDark ? '#F0C64A' : '#A6740C' }]}>
                  {isSearching ? SEARCH_STATUS_MESSAGES[statusMsgIndex] : 'Preparing Chessboard...'}
                </Text>
              </View>
            </View>

            {/* Match Details & Opponent Card */}
            <View style={styles.playersSection}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#D4A017' : '#9E740C' }]}>
                PLAYERS (1v1)
              </Text>

              {/* Current User Card */}
              <View
                style={[
                  styles.playerCard,
                  {
                    backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                    borderColor: '#1F9D55',
                  },
                ]}
              >
                <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.avatar}>
                  <Text style={styles.avatarText}>ME</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.playerName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                      {username}
                    </Text>
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>YOU</Text>
                    </View>
                  </View>
                  <Text style={[styles.playerSub, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                    Rating: 1,420 ELO · Level 12
                  </Text>
                </View>
                <View style={[styles.readyPill, { backgroundColor: '#1F9D55' }]}>
                  <Text style={styles.readyText}>READY ✓</Text>
                </View>
              </View>

              {/* Opponent Card (Searching vs Found) */}
              <View
                style={[
                  styles.playerCard,
                  {
                    backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                    borderColor: matchFoundData ? '#2668D9' : isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
                  },
                ]}
              >
                {matchFoundData ? (
                  <>
                    <LinearGradient colors={['#2668D9', '#153E8A']} style={styles.avatar}>
                      <Text style={styles.avatarText}>OP</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.playerName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                        {matchFoundData.blackPlayer?.username || matchFoundData.whitePlayer?.username || 'Opponent'}
                      </Text>
                      <Text style={[styles.playerSub, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                        Rating: {matchFoundData.blackPlayer?.rating || 1410} ELO
                      </Text>
                    </View>
                    <View style={[styles.readyPill, { backgroundColor: '#2668D9' }]}>
                      <Text style={styles.readyText}>MATCHED ✓</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.searchingRow}>
                    <Text style={styles.radarSearchIcon}>📡</Text>
                    <Text style={[styles.searchingText, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                      Matching with opponent...
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Time Control Options */}
            <Text style={[styles.sectionTitle, { color: isDark ? '#D4A017' : '#9E740C', marginTop: 18 }]}>
              TIME CONTROL
            </Text>
            <View style={styles.timeRow}>
              {[
                { label: '3m Blitz', sec: 180, icon: '⚡' },
                { label: '5m Rapid', sec: 300, icon: '⏱️' },
                { label: '10m Classic', sec: 600, icon: '⏳' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.sec}
                  activeOpacity={0.8}
                  disabled={!isSearching}
                  style={[
                    styles.timeBtn,
                    selectedTime === t.sec && styles.activeTimeBtn,
                    { backgroundColor: isDark ? '#141A16' : '#FFFFFF' },
                  ]}
                  onPress={() => setSelectedTime(t.sec)}
                >
                  <Text style={styles.timeIcon}>{t.icon}</Text>
                  <Text
                    style={[
                      styles.timeBtnText,
                      selectedTime === t.sec && styles.activeTimeBtnText,
                      { color: isDark ? '#FFF' : '#1A2318' },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer Cancel Button */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity activeOpacity={0.85} style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>✕ Cancel Matchmaking</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : privateTab === 'create' ? (
        /* Create Room / Play with Friends Screen */
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Room Code Card */}
          <LinearGradient
            colors={isDark ? ['#201B11', '#14110A'] : ['#FFFBF0', '#FBF2D9']}
            style={[styles.codeCard, { borderColor: '#D4A017' }]}
          >
            <View style={styles.codeHeaderRow}>
              <View>
                <Text style={[styles.codeLabel, { color: isDark ? '#F0C64A' : '#A6740C' }]}>
                  ROOM CODE
                </Text>
                <Text style={styles.codeNumber}>#{roomCode}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.refreshCodeBtn}
                onPress={handleGenerateNewCode}
              >
                <Text style={styles.refreshCodeIcon}>🔄</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.codeActionRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.codeActionBtn, { backgroundColor: isDark ? '#2E2210' : '#F4E4BC' }]}
                onPress={handleCopyCode}
              >
                <Text style={styles.codeActionText}>📋 Copy Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.codeActionBtn, { backgroundColor: '#D4A017' }]}
                onPress={handleShareCode}
              >
                <Text style={[styles.codeActionText, { color: '#1B1405', fontWeight: '800' }]}>
                  📤 Share Invite
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* 2-Player Table / Slots */}
          <Text style={[styles.sectionTitle, { color: isDark ? '#D4A017' : '#9E740C', marginTop: 16 }]}>
            PLAYERS IN ROOM (1v1)
          </Text>

          <View style={styles.playersCol}>
            {/* Player 1 (Host / You) */}
            <View
              style={[
                styles.playerCard,
                {
                  backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                  borderColor: '#1F9D55',
                },
              ]}
            >
              <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.avatar}>
                <Text style={styles.avatarText}>ME</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.playerName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                    {username}
                  </Text>
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>HOST · WHITE ♔</Text>
                  </View>
                </View>
                <Text style={[styles.playerSub, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                  Rating: 1,420 ELO
                </Text>
              </View>
              <View style={[styles.readyPill, { backgroundColor: '#1F9D55' }]}>
                <Text style={styles.readyText}>READY ✓</Text>
              </View>
            </View>

            {/* Player 2 (Friend Slot) */}
            <View
              style={[
                styles.playerCard,
                {
                  backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                  borderColor: joinedFriend ? '#2668D9' : isDark ? 'rgba(212,160,23,0.3)' : '#E0ECE4',
                },
              ]}
            >
              {joinedFriend ? (
                <>
                  <LinearGradient colors={['#2668D9', '#153E8A']} style={styles.avatar}>
                    <Text style={styles.avatarText}>P2</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.playerName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                        {joinedFriend.username}
                      </Text>
                      <View style={[styles.youBadge, { backgroundColor: 'rgba(38,104,217,0.2)' }]}>
                        <Text style={[styles.youBadgeText, { color: '#4A90E2' }]}>BLACK ♚</Text>
                      </View>
                    </View>
                    <Text style={[styles.playerSub, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                      Rating: {joinedFriend.rating || 1420} ELO
                    </Text>
                  </View>
                  <View style={[styles.readyPill, { backgroundColor: '#2668D9' }]}>
                    <Text style={styles.readyText}>JOINED ✓</Text>
                  </View>
                </>
              ) : (
                <View style={styles.waitingFriendRow}>
                  <View style={styles.waitingDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.waitingHeading, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>
                      Waiting for Friend to Join...
                    </Text>
                    <Text style={[styles.waitingSub, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                      Share Room #{roomCode} or invite a friend below
                    </Text>
                  </View>
                  <View style={[styles.readyPill, { backgroundColor: 'rgba(212,160,23,0.2)' }]}>
                    <Text style={[styles.readyText, { color: '#D4A017' }]}>OPEN</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Time Control Setting */}
          <Text style={[styles.sectionTitle, { color: isDark ? '#D4A017' : '#9E740C', marginTop: 18 }]}>
            TIME CONTROL
          </Text>
          <View style={styles.timeRow}>
            {[
              { label: '3m Blitz', sec: 180, icon: '⚡' },
              { label: '5m Rapid', sec: 300, icon: '⏱️' },
              { label: '10m Classic', sec: 600, icon: '⏳' },
            ].map((t) => (
              <TouchableOpacity
                key={t.sec}
                activeOpacity={0.8}
                style={[
                  styles.timeBtn,
                  selectedTime === t.sec && styles.activeTimeBtn,
                  { backgroundColor: isDark ? '#141A16' : '#FFFFFF' },
                ]}
                onPress={() => setSelectedTime(t.sec)}
              >
                <Text style={styles.timeIcon}>{t.icon}</Text>
                <Text
                  style={[
                    styles.timeBtnText,
                    selectedTime === t.sec && styles.activeTimeBtnText,
                    { color: isDark ? '#FFF' : '#1A2318' },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Online Friends Direct Inviter Section */}
          <View style={styles.friendsSectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#D4A017' : '#9E740C' }]}>
              INVITE ONLINE FRIENDS
            </Text>
            {isLoadingFriends && <ActivityIndicator size="small" color="#D4A017" />}
          </View>

          <View
            style={[
              styles.friendsContainer,
              {
                backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E0ECE4',
              },
            ]}
          >
            {friendsList.length === 0 ? (
              <Text style={[styles.emptyFriendsText, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                No friends found. Share room code #{roomCode} with your friends!
              </Text>
            ) : (
              friendsList.map((friend) => {
                const isInvited = invitedFriendIds.has(friend.id);
                return (
                  <View
                    key={friend.id}
                    style={[
                      styles.friendInviteRow,
                      { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F4F2' },
                    ]}
                  >
                    <View style={styles.friendAvatarWrap}>
                      <LinearGradient colors={['#1F9D55', '#0E5C31']} style={styles.friendAvatar}>
                        <Text style={styles.friendAvatarText}>
                          {(friend.name || friend.username || 'F').slice(0, 2).toUpperCase()}
                        </Text>
                      </LinearGradient>
                      {friend.isOnline && <View style={styles.friendOnlineDot} />}
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.friendNameText, { color: isDark ? '#FFF' : '#1A2318' }]}>
                        {friend.name || friend.username}
                      </Text>
                      <Text style={[styles.friendStatusText, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                        {friend.isOnline ? 'Online · Level 18' : 'Offline'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      disabled={isInvited}
                      style={[
                        styles.inviteFriendBtn,
                        isInvited && styles.invitedFriendBtn,
                      ]}
                      onPress={() => handleSendInviteToFriend(friend)}
                    >
                      <Text style={[styles.inviteFriendBtnText, isInvited && styles.invitedFriendBtnText]}>
                        {isInvited ? 'Invited ✓' : '⚡ Invite'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      ) : (
        /* Join Room Tab Screen */
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Join Code Card */}
          <LinearGradient
            colors={isDark ? ['#1A2534', '#0E1724'] : ['#E8F2FC', '#D6E7F8']}
            style={[styles.joinCard, { borderColor: '#2668D9' }]}
          >
            <Text style={styles.joinIcon}>🔑</Text>
            <Text style={[styles.joinHeading, { color: isDark ? '#FFFFFF' : '#1A2318' }]}>
              Enter Room Code
            </Text>
            <Text style={[styles.joinSub, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
              Ask your friend for their 4-8 character room code to join their chess game.
            </Text>

            <View style={styles.codeInputWrapper}>
              <TextInput
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: isDark ? '#111A26' : '#FFFFFF',
                    color: isDark ? '#FFF' : '#1A2318',
                    borderColor: inputJoinCode.length > 0 && inputJoinCode.length < 4 ? '#E6483A' : '#2668D9',
                  },
                ]}
                placeholder="e.g. AB49K2"
                placeholderTextColor={isDark ? '#5C708A' : '#96A1AD'}
                value={inputJoinCode}
                onChangeText={handleCodeInputChange}
                autoCapitalize="characters"
                maxLength={8}
                autoCorrect={false}
              />
              {inputJoinCode.length > 0 && inputJoinCode.length < 4 && (
                <Text style={styles.inputErrorText}>Code must be at least 4 characters</Text>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.joinSubmitBtn, isJoinBtnDisabled && { opacity: 0.6 }]}
              onPress={handleJoinByCode}
              disabled={isJoinBtnDisabled}
            >
              <LinearGradient colors={['#2668D9', '#15418F']} style={styles.joinSubmitGradient}>
                {isJoiningRoom ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.joinSubmitText}>🚀 Join Room Now</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {hasJoinedAsGuest && (
              <View style={styles.joinedGuestBanner}>
                <Text style={styles.joinedGuestText}>
                  ✓ Connected to Room #{roomCode}! Waiting for Host to start match...
                </Text>
              </View>
            )}
          </LinearGradient>
        </ScrollView>
      )}

      {/* Private Room Footer Action */}
      {mode === 'private' && privateTab === 'create' && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity activeOpacity={0.85} style={styles.startBtn} onPress={handleStartPrivateMatch}>
            <LinearGradient colors={['#F0C64A', '#D4A017', '#9C6C0C']} style={styles.startBtnGradient}>
              <Text style={styles.startBtnText}>
                {joinedFriend ? '⚔️ Start Match with Friend' : '⚔️ Start Match Now'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  tabPillWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    padding: 4,
    marginTop: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabBtn: {
    backgroundColor: '#D4A017',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  activeTabText: {
    color: '#1C1505',
    fontWeight: '900',
  },
  quickMatchContainer: {
    flex: 1,
  },
  quickMatchContent: {
    padding: 16,
  },
  content: {
    padding: 16,
  },
  radarSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  radarWrapper: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: '#D4A017',
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
  },
  orbitCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
  },
  orbitBadgeTop: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(212, 160, 23, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitBadgeBottom: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(212, 160, 23, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitGlyph: {
    fontSize: 14,
    color: '#F0C64A',
  },
  centerRadarHub: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  centerRadarIcon: {
    fontSize: 32,
    color: '#241402',
  },
  matchFoundBanner: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 10,
    shadowColor: '#1F9D55',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  matchFoundGradient: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  matchFoundEmblem: {
    fontSize: 36,
    marginBottom: 6,
  },
  matchFoundHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  matchFoundCountdown: {
    fontSize: 14,
    color: '#B0F2C2',
    marginTop: 4,
    fontWeight: '600',
  },
  statusBox: {
    alignItems: 'center',
    marginTop: 10,
  },
  timerBadge: {
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4A017',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F0C64A',
    letterSpacing: 1,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  playersSection: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  playersCol: {
    gap: 10,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '800',
  },
  youBadge: {
    backgroundColor: 'rgba(31, 157, 85, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1F9D55',
  },
  playerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  readyPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  readyText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  radarSearchIcon: {
    fontSize: 20,
  },
  searchingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  waitingFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waitingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D4A017',
  },
  waitingHeading: {
    fontSize: 14,
    fontWeight: '700',
  },
  waitingSub: {
    fontSize: 11,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  activeTimeBtn: {
    borderColor: '#D4A017',
    backgroundColor: 'rgba(212,160,23,0.12)',
  },
  timeIcon: {
    fontSize: 16,
  },
  timeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeTimeBtnText: {
    color: '#F0C64A',
    fontWeight: '800',
  },
  codeCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  codeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  codeNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F0C64A',
    letterSpacing: 3,
    marginTop: 2,
  },
  refreshCodeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212,160,23,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshCodeIcon: {
    fontSize: 16,
  },
  codeActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  codeActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4A017',
  },
  friendsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  friendsContainer: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyFriendsText: {
    padding: 16,
    fontSize: 13,
    textAlign: 'center',
  },
  friendInviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  friendAvatarWrap: {
    position: 'relative',
  },
  friendAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  friendOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#27AE60',
    borderWidth: 1.5,
    borderColor: '#141A16',
  },
  friendNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  friendStatusText: {
    fontSize: 11,
    marginTop: 2,
  },
  inviteFriendBtn: {
    backgroundColor: '#1F9D55',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  invitedFriendBtn: {
    backgroundColor: 'rgba(212,160,23,0.2)',
  },
  inviteFriendBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  invitedFriendBtnText: {
    color: '#D4A017',
  },
  joinCard: {
    padding: 22,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  joinIcon: {
    fontSize: 38,
    marginBottom: 8,
  },
  joinHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  joinSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  codeInputWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  codeInput: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 4,
  },
  inputErrorText: {
    color: '#E6483A',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  joinSubmitBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  joinSubmitGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinSubmitText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  joinedGuestBanner: {
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(31,157,85,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F9D55',
  },
  joinedGuestText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F9D55',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  cancelBtn: {
    backgroundColor: 'rgba(230, 72, 58, 0.15)',
    borderWidth: 1.5,
    borderColor: '#E6483A',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E6483A',
  },
  startBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  startBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1A1405',
    letterSpacing: 0.5,
  },
});

export default ChessLobbyScreen;
