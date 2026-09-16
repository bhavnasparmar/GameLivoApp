import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
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
import apiClient from '../../../../services/api/apiClient';
import { API_ENDPOINTS } from '../../../../services/api/apiEndpoints';

const { width } = Dimensions.get('window');

const SEARCH_STATUS_MESSAGES = [
  'Searching for active Uno champions...',
  'Connecting to GameLivo Speed Arena...',
  'Matching players of similar rating (1,400 - 1,500)...',
  'Shuffling 108-card official tournament deck...',
  'Preparing table seats & dealing starting hand...',
];

const MOCK_ONLINE_PLAYERS = [
  { name: 'Maya Patel', avatar: '👩🏽‍🦱', rating: 1485, level: 16, country: '🇮🇳', ping: '24ms' },
  { name: 'Liam Connor', avatar: '👱🏻‍♂️', rating: 1520, level: 21, country: '🇬🇧', ping: '32ms' },
  { name: 'Sophia Chen', avatar: '👩🏻‍🦰', rating: 1430, level: 14, country: '🇸🇬', ping: '28ms' },
  { name: 'Rohan Mehta', avatar: '🧔🏽', rating: 1610, level: 25, country: '🇮🇳', ping: '19ms' },
  { name: 'Emma Watson', avatar: '👱🏼‍♀️', rating: 1390, level: 12, country: '🇺🇸', ping: '45ms' },
  { name: 'Lucas Silva', avatar: '👦🏽', rating: 1550, level: 19, country: '🇧🇷', ping: '38ms' },
  { name: 'Aarav Sharma', avatar: '👨🏽‍🎓', rating: 1490, level: 18, country: '🇮🇳', ping: '22ms' },
];

const STAKE_OPTIONS = [
  { id: 'free', label: 'Free', fee: 0, prizeMultiplier: 0, tag: 'PRACTICE' },
  { id: '100', label: '100 🪙', fee: 100, prizeMultiplier: 1, tag: 'CASUAL' },
  { id: '500', label: '500 🪙', fee: 500, prizeMultiplier: 1, tag: 'POPULAR' },
  { id: '1000', label: '1,000 🪙', fee: 1000, prizeMultiplier: 1, tag: 'HIGH ROLLER' },
  { id: '5000', label: '5,000 🪙', fee: 5000, prizeMultiplier: 1, tag: 'CHAMPION' },
];

const TABLE_SIZES = [
  { count: 2, label: '2 Players', title: '1v1 Duel', icon: '⚔️', desc: 'Fast & Intense' },
  { count: 4, label: '4 Players', title: 'Classic Table', icon: '🎯', desc: 'Official Match' },
  { count: 8, label: '8 Players', title: 'Party Arena', icon: '🔥', desc: 'Max Uno Chaos' },
];

export const UnoLobbyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const currentUserId = useAppSelector((state) => state.auth.userId) || 'player_me';
  const playerName = userProfile?.name || userProfile?.username || 'You';
  const userAvatar = userProfile?.avatar || '👩🏻';
  const userCoins = userProfile?.coins || 1500;
  const userRating = userProfile?.gameStats?.find((g) => g.gameId === 'uno')?.rank || 1450;
  const userLevel = userProfile?.level || 12;

  const mode = route.params?.mode || 'random'; // 'random' (Quick Match) or 'private' (Play with Friends)
  const isHostParam = route.params?.isHost ?? (mode === 'private');

  // Matchmaking / Setup Options
  const [selectedTableSize, setSelectedTableSize] = useState<number>(4);
  const [selectedStake, setSelectedStake] = useState<typeof STAKE_OPTIONS[0]>(STAKE_OPTIONS[2]); // default 500 coins

  // Quick Match State
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [statusMsgIndex, setStatusMsgIndex] = useState<number>(0);
  const [matchedOpponents, setMatchedOpponents] = useState<any[]>([]);
  const [isMatchReady, setIsMatchReady] = useState<boolean>(false);
  const [matchCountdown, setMatchCountdown] = useState<number>(3);

  // Private Mode State
  const [privateTab, setPrivateTab] = useState<'create' | 'join'>(isHostParam ? 'create' : 'join');
  const [roomCode, setRoomCode] = useState<string>(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `UNO-${res}`;
  });
  const [inputJoinCode, setInputJoinCode] = useState<string>('');
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const [dbUsers, setDbUsers] = useState<any[]>([]);

  // Animations
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const matchPopScale = useRef(new Animated.Value(0.7)).current;
  const matchPopOpacity = useRef(new Animated.Value(0)).current;

  // Calculate Prize Pool
  const prizePool = selectedStake.fee > 0 ? selectedStake.fee * selectedTableSize : 200;

  // Fetch real registered users from backend database (Leaderboard, Friends, Suggestions)
  useEffect(() => {
    const fetchDatabaseUsers = async () => {
      try {
        const [lbData, friendsData, suggestionsData] = await Promise.allSettled([
          apiClient.get<any>(API_ENDPOINTS.LEADERBOARD.GLOBAL),
          friendsService.getFriends(),
          apiClient.get<any>(API_ENDPOINTS.FRIENDS.SUGGESTIONS),
        ]);

        const rawList: any[] = [];

        if (lbData.status === 'fulfilled') {
          const val: any = lbData.value;
          if (Array.isArray(val)) rawList.push(...val);
          else if (val?.data && Array.isArray(val.data)) rawList.push(...val.data);
          else if (val?.users && Array.isArray(val.users)) rawList.push(...val.users);
          else if (val?.leaderboard && Array.isArray(val.leaderboard)) rawList.push(...val.leaderboard);
        }

        if (friendsData.status === 'fulfilled' && Array.isArray(friendsData.value)) {
          rawList.push(...friendsData.value);
        }

        if (suggestionsData.status === 'fulfilled') {
          const sVal: any = suggestionsData.value;
          if (Array.isArray(sVal)) rawList.push(...sVal);
          else if (sVal?.data && Array.isArray(sVal.data)) rawList.push(...sVal.data);
          else if (sVal?.suggestions && Array.isArray(sVal.suggestions)) rawList.push(...sVal.suggestions);
        }

        const valid = rawList
          .filter((u: any) => u && (u.id || u._id || u.userId) && (u.id !== currentUserId && u._id !== currentUserId && u.userId !== currentUserId && u.name !== playerName && u.username !== playerName))
          .map((u: any, idx: number) => ({
            id: u.id || u._id || u.userId || `db_${idx + 1}`,
            name: u.name || u.username || `Player ${idx + 1}`,
            avatar: u.avatar || '😎',
            rating: typeof u.rank === 'number' ? (u.rank > 200 ? u.rank : 1400 + u.rank * 10) : (u.rating || 1450),
            level: typeof u.level === 'number' ? u.level : (idx % 15) + 5,
            country: u.country || '🌐',
            ping: `${18 + (idx * 3) % 24}ms`,
            isBot: false,
          }));

        if (valid.length > 0) {
          setDbUsers(valid);
        }
      } catch (e) {
        console.log('[Uno Lobby] Backend DB user fetch check completed');
      }
    };

    fetchDatabaseUsers();
  }, [currentUserId, playerName]);

  // Fetch Friends List for Private Room
  useEffect(() => {
    if (mode === 'private') {
      friendsService.getFriends().then((res) => {
        if (res && res.length > 0) {
          setFriendsList(res);
        }
      }).catch(() => {});
    }
  }, [mode]);

  // Radar Animation Loop
  useEffect(() => {
    if (!isSearching) return;

    const createPulse = (anim: Animated.Value, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const pulse1 = createPulse(pulseAnim1, 0);
    const pulse2 = createPulse(pulseAnim2, 1100);

    const rotation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
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
    if (!isSearching || isMatchReady) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const msgTimer = setInterval(() => {
      setStatusMsgIndex((prev) => (prev + 1) % SEARCH_STATUS_MESSAGES.length);
    }, 2400);

    return () => {
      clearInterval(timer);
      clearInterval(msgTimer);
    };
  }, [isSearching, isMatchReady]);

  // Handle Socket Matchmaking & Lobby Events
  useEffect(() => {
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    if (mode === 'random' && isSearching) {
      socketService.emit(SOCKET_EVENTS.MATCH_QUEUE_JOIN, {
        gameId: 'uno',
        playerCount: selectedTableSize,
        entryFee: selectedStake.fee,
        userId: currentUserId,
        username: playerName,
        avatar: userAvatar,
        rating: userRating,
      });
    }

    const handleServerMatchFound = (data: any) => {
      if (data && data.players && data.players.length > 0) {
        const others = data.players.filter((p: any) => p.id !== currentUserId && p.userId !== currentUserId);
        if (others.length > 0) {
          setMatchedOpponents(others.map((p: any, idx: number) => ({
            id: p.id || p.userId || `opp_${idx + 1}`,
            name: p.name || p.username || `Player ${idx + 2}`,
            avatar: p.avatar || '😎',
            rating: p.rating || 1450,
            level: p.level || 12,
            country: p.country || '🌐',
            ping: '28ms',
            isBot: Boolean(p.isBot),
          })));
          setIsMatchReady(true);
          soundService.play('notification');
          vibrationService.vibrateSuccess();
        }
      }
    };

    const handleLobbyUpdate = (lobby: any) => {
      if (lobby && lobby.players) {
        console.log('[Uno Socket] Lobby updated:', lobby);
      }
    };

    const handleServerGameStart = (data: any) => {
      navigation.replace(ROUTES.UNO_GAME, {
        matchId: data.matchId || `uno_room_${roomCode}`,
        mode: 'private',
        difficulty: 'medium',
        playerCount: selectedTableSize,
        stake: selectedStake.fee,
        prizePool,
        players: data.players || undefined,
        player1Name: playerName,
      });
    };

    socketService.on(SOCKET_EVENTS.MATCH_FOUND, handleServerMatchFound);
    socketService.on(SOCKET_EVENTS.GAME_START, handleServerGameStart);
    socketService.on(SOCKET_EVENTS.LOBBY_UPDATE, handleLobbyUpdate);

    return () => {
      socketService.off(SOCKET_EVENTS.MATCH_FOUND);
      socketService.off(SOCKET_EVENTS.GAME_START);
      socketService.off(SOCKET_EVENTS.LOBBY_UPDATE);
      if (mode === 'random' && isSearching) {
        socketService.emit(SOCKET_EVENTS.MATCH_QUEUE_LEAVE, { gameId: 'uno' });
      }
    };
  }, [
    mode,
    isSearching,
    selectedTableSize,
    selectedStake.fee,
    currentUserId,
    playerName,
    userAvatar,
    userRating,
    navigation,
    roomCode,
    prizePool,
  ]);

  // Handle Quick Match Database Users Matching Flow
  useEffect(() => {
    if (!isSearching || isMatchReady) return;

    const requiredOpponents = selectedTableSize - 1;
    const sourcePool =
      dbUsers.length >= requiredOpponents
        ? dbUsers
        : dbUsers.length > 0
        ? [...dbUsers, ...MOCK_ONLINE_PLAYERS]
        : MOCK_ONLINE_PLAYERS;

    const shuffledPool = [...sourcePool].sort(() => 0.5 - Math.random());
    const matched: any[] = [];

    // Stagger discovery of opponents
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    for (let i = 0; i < requiredOpponents; i++) {
      const delay = (i + 1) * 750 + Math.random() * 400;
      const t = setTimeout(() => {
        const opp = shuffledPool[i % shuffledPool.length];
        matched.push({
          id: opp.id || `opp_${i + 1}_${Date.now()}`,
          name: opp.name,
          avatar: opp.avatar || '😎',
          rating: opp.rating || 1450,
          level: opp.level || 12,
          country: opp.country || '🌐',
          ping: opp.ping || '24ms',
          isBot: false,
        });
        setMatchedOpponents([...matched]);
        soundService.play('button_tap');
        vibrationService.vibrateTap();

        // If all opponents found
        if (matched.length === requiredOpponents) {
          setIsMatchReady(true);
          soundService.play('notification');
          vibrationService.vibrateSuccess();

          Animated.parallel([
            Animated.spring(matchPopScale, {
              toValue: 1,
              friction: 6,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.timing(matchPopOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }, delay);
      timers.push(t);
    }

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [isSearching, selectedTableSize, isMatchReady, matchPopScale, matchPopOpacity]);

  // Match Found Countdown & Navigation Trigger
  useEffect(() => {
    if (!isMatchReady) return;

    if (matchCountdown > 0) {
      const cd = setTimeout(() => {
        setMatchCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(cd);
    }

    // Build the final players list
    const finalPlayers = [
      {
        id: currentUserId,
        name: playerName,
        avatar: userAvatar,
        isBot: false,
        isHost: true,
      },
      ...matchedOpponents.map((opp) => ({
        id: opp.id,
        name: opp.name,
        avatar: opp.avatar,
        isBot: true, // Controlled smoothly by UnoBot engine
      })),
    ];

    navigation.replace(ROUTES.UNO_GAME, {
      matchId: `uno_qm_${Date.now()}`,
      mode: 'random',
      difficulty: 'medium',
      playerCount: selectedTableSize,
      stake: selectedStake.fee,
      prizePool,
      players: finalPlayers,
      player1Name: playerName,
    });
  }, [
    isMatchReady,
    matchCountdown,
    currentUserId,
    playerName,
    userAvatar,
    matchedOpponents,
    navigation,
    selectedTableSize,
    selectedStake.fee,
    prizePool,
  ]);

  const handleStartSearching = () => {
    if (selectedStake.fee > userCoins) {
      Alert.alert(
        'Insufficient Coins',
        `You need at least ${selectedStake.fee} coins to enter this table. You currently have ${userCoins} coins.`,
        [
          { text: 'Choose Free Table', onPress: () => setSelectedStake(STAKE_OPTIONS[0]) },
          { text: 'OK', style: 'cancel' },
        ],
      );
      return;
    }

    setMatchedOpponents([]);
    setIsMatchReady(false);
    setElapsedSeconds(0);
    setMatchCountdown(3);
    setIsSearching(true);
    soundService.play('button_tap');
    vibrationService.vibrateTap();
  };

  const handleCancelSearch = () => {
    socketService.emit(SOCKET_EVENTS.MATCH_QUEUE_LEAVE, { gameId: 'uno' });
    setIsSearching(false);
    setIsMatchReady(false);
    setMatchedOpponents([]);
    setElapsedSeconds(0);
    soundService.play('button_tap');
    vibrationService.vibrateTap();
  };

  const handleCopyRoomCode = () => {
    Clipboard.setString(roomCode);
    Alert.alert('Room Code Copied! 📋', `Code ${roomCode} copied to clipboard.`);
  };

  const handleShareRoomCode = async () => {
    try {
      await Share.share({
        message: `🔥 Join my UNO Match on GameLivo!\nRoom Code: ${roomCode}\nPlay with me and shout UNO! 🂡`,
      });
    } catch (e) {}
  };

  const handleInviteFriend = (friend: Friend) => {
    setInvitedFriends((prev) => new Set(prev).add(friend.id));
    socketService.emit(SOCKET_EVENTS.FRIEND_GAME_INVITE, {
      friendUserId: friend.id,
      gameId: 'uno',
      roomCode,
      timeSeconds: 300,
    });
    Alert.alert('Invite Sent! ✉️', `Invitation sent to ${friend.name || friend.username} for room ${roomCode}`);
  };

  const handleStartPrivateRoomMatch = () => {
    socketService.emit(SOCKET_EVENTS.LOBBY_START_GAME, {
      roomCode,
      timeSeconds: 300,
    });

    const finalPlayers = [
      { id: currentUserId, name: playerName, avatar: userAvatar, isBot: false, isHost: true },
      { id: 'friend_2', name: 'Friend 2', avatar: '🦁', isBot: true },
      ...(selectedTableSize >= 4 ? [
        { id: 'friend_3', name: 'Friend 3', avatar: '🐼', isBot: true },
        { id: 'friend_4', name: 'Friend 4', avatar: '🦊', isBot: true },
      ] : []),
    ];

    navigation.replace(ROUTES.UNO_GAME, {
      matchId: `uno_room_${roomCode}`,
      mode: 'private',
      difficulty: 'medium',
      playerCount: selectedTableSize,
      stake: selectedStake.fee,
      prizePool,
      players: finalPlayers,
      player1Name: playerName,
    });
  };

  const handleJoinByCode = () => {
    const clean = inputJoinCode.trim().toUpperCase();
    if (clean.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid room code (e.g. UNO-8492).');
      return;
    }

    socketService.emit(SOCKET_EVENTS.LOBBY_JOIN, {
      code: clean,
      gameId: 'uno',
    });

    navigation.replace(ROUTES.UNO_GAME, {
      matchId: `uno_join_${clean}`,
      mode: 'private',
      difficulty: 'medium',
      playerCount: 4,
      stake: 0,
      prizePool: 0,
      player1Name: playerName,
    });
  };

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#060D09' : '#F0F7F2' }]}>
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
            onPress={() => {
              if (isSearching) {
                handleCancelSearch();
              } else {
                navigation.goBack();
              }
            }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.appBarTitle}>
              {mode === 'random' ? '⚡ QUICK MATCH' : '🔒 PLAY WITH FRIENDS'}
            </Text>
          </View>

          <View style={styles.coinPill}>
            <Text style={styles.coinDot}>🪙</Text>
            <Text style={styles.coinText}>{userCoins.toLocaleString()}</Text>
          </View>
        </View>

        {/* Sub-tab Switcher for Private Mode */}
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

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {mode === 'random' ? (
          /* ─── QUICK MATCH VIEW ─── */
          isSearching ? (
            /* ACTIVE MATCHMAKING RADAR & LIVE QUEUE */
            <View style={styles.searchingContainer}>
              {/* Radar Area */}
              <View style={styles.radarSection}>
                {!isMatchReady ? (
                  <View style={styles.radarWrapper}>
                    {/* Expanding Pulse Ring 1 */}
                    <Animated.View
                      style={[
                        styles.pulseRing,
                        {
                          borderColor: '#E74C3C',
                          transform: [
                            {
                              scale: pulseAnim1.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 2.3],
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

                    {/* Expanding Pulse Ring 2 */}
                    <Animated.View
                      style={[
                        styles.pulseRing,
                        {
                          borderColor: '#F1C40F',
                          transform: [
                            {
                              scale: pulseAnim2.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 2.3],
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

                    {/* Orbiting Multi-Colored Uno Cards */}
                    <Animated.View style={[styles.orbitCircle, { transform: [{ rotate: spin }] }]}>
                      <View style={[styles.orbitBadge, { top: -14, backgroundColor: '#E74C3C' }]}>
                        <Text style={styles.orbitBadgeGlyph}>🂡</Text>
                      </View>
                      <View style={[styles.orbitBadge, { bottom: -14, backgroundColor: '#2980B9' }]}>
                        <Text style={styles.orbitBadgeGlyph}>+2</Text>
                      </View>
                      <View style={[styles.orbitBadge, { left: -14, backgroundColor: '#27AE60' }]}>
                        <Text style={styles.orbitBadgeGlyph}>⇄</Text>
                      </View>
                      <View style={[styles.orbitBadge, { right: -14, backgroundColor: '#F1C40F' }]}>
                        <Text style={styles.orbitBadgeGlyph}>🚫</Text>
                      </View>
                    </Animated.View>

                    {/* Center Radar Hub */}
                    <LinearGradient
                      colors={['#E74C3C', '#C0392B', '#781515']}
                      style={styles.centerRadarHub}
                    >
                      <Text style={styles.centerRadarIcon}>⚡</Text>
                    </LinearGradient>
                  </View>
                ) : (
                  /* MATCH FOUND CELEBRATION CARD */
                  <Animated.View
                    style={[
                      styles.matchFoundBanner,
                      {
                        opacity: matchPopOpacity,
                        transform: [{ scale: matchPopScale }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#27AE60', '#1E8449', '#145A32']}
                      style={styles.matchFoundGradient}
                    >
                      <Text style={styles.matchFoundEmblem}>🎉</Text>
                      <Text style={styles.matchFoundHeading}>ALL PLAYERS FOUND!</Text>
                      <Text style={styles.matchFoundSub}>Dealing cards in {matchCountdown}s...</Text>
                    </LinearGradient>
                  </Animated.View>
                )}

                {/* Live Match Timer & Status */}
                <View style={styles.statusBox}>
                  {!isMatchReady && (
                    <View style={styles.timerBadge}>
                      <Text style={styles.timerText}>{formatElapsed(elapsedSeconds)}</Text>
                    </View>
                  )}
                  <Text style={[styles.statusText, { color: isDark ? '#F1C40F' : '#B7950B' }]}>
                    {isMatchReady ? 'Launching Uno Table Arena...' : SEARCH_STATUS_MESSAGES[statusMsgIndex]}
                  </Text>
                </View>
              </View>

              {/* Table Info Header */}
              <View style={styles.tableInfoStrip}>
                <Text style={styles.tableInfoText}>
                  {selectedTableSize}-Player Table · {selectedStake.label} Stake ·{' '}
                  <Text style={{ color: '#FFD700', fontWeight: '900' }}>
                    🏆 {prizePool.toLocaleString()} Prize
                  </Text>
                </Text>
              </View>

              {/* Player Slots Section */}
              <View style={styles.slotsContainer}>
                {/* Slot 1: You */}
                <View
                  style={[
                    styles.playerSlotCard,
                    {
                      backgroundColor: isDark ? '#101C14' : '#FFFFFF',
                      borderColor: '#2ECC71',
                    },
                  ]}
                >
                  <LinearGradient colors={['#2ECC71', '#27AE60']} style={styles.slotAvatarWrap}>
                    <Text style={styles.slotAvatarText}>{userAvatar}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <View style={styles.slotNameRow}>
                      <Text style={[styles.slotPlayerName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                        {playerName}
                      </Text>
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>YOU</Text>
                      </View>
                    </View>
                    <Text style={[styles.slotSub, { color: isDark ? '#8CA093' : '#5C7A6A' }]}>
                      Rating {userRating} 🏆 · Level {userLevel}
                    </Text>
                  </View>
                  <View style={[styles.readyPill, { backgroundColor: '#2ECC71' }]}>
                    <Text style={styles.readyPillText}>READY ✓</Text>
                  </View>
                </View>

                {/* Opponent Slots */}
                {Array.from({ length: selectedTableSize - 1 }).map((_, index) => {
                  const opp = matchedOpponents[index];
                  return (
                    <View
                      key={`slot_${index}`}
                      style={[
                        styles.playerSlotCard,
                        {
                          backgroundColor: isDark ? '#101C14' : '#FFFFFF',
                          borderColor: opp
                            ? '#3498DB'
                            : isDark
                            ? 'rgba(255,255,255,0.08)'
                            : '#E0ECE4',
                        },
                      ]}
                    >
                      {opp ? (
                        <>
                          <LinearGradient colors={['#3498DB', '#2980B9']} style={styles.slotAvatarWrap}>
                            <Text style={styles.slotAvatarText}>{opp.avatar}</Text>
                          </LinearGradient>
                          <View style={{ flex: 1 }}>
                            <View style={styles.slotNameRow}>
                              <Text style={[styles.slotPlayerName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                                {opp.name} {opp.country}
                              </Text>
                            </View>
                            <Text style={[styles.slotSub, { color: isDark ? '#8CA093' : '#5C7A6A' }]}>
                              Rating {opp.rating} 🏆 · 🟢 {opp.ping}
                            </Text>
                          </View>
                          <View style={[styles.readyPill, { backgroundColor: '#3498DB' }]}>
                            <Text style={styles.readyPillText}>MATCHED ✓</Text>
                          </View>
                        </>
                      ) : (
                        <View style={styles.searchingSlotRow}>
                          <Text style={styles.searchingSlotIcon}>📡</Text>
                          <Text style={[styles.searchingSlotText, { color: isDark ? '#7A9182' : '#8CA093' }]}>
                            Searching Opponent {index + 1}...
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Cancel Button */}
              {!isMatchReady && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.cancelBtn}
                  onPress={handleCancelSearch}
                >
                  <Text style={styles.cancelBtnText}>✕ CANCEL SEARCH</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* QUICK MATCH SETUP / LOBBY SELECTION */
            <View style={styles.setupContainer}>
              {/* Hero Banner */}
              <LinearGradient
                colors={['#E74C3C', '#C0392B', '#922B21']}
                style={styles.heroCard}
              >
                <View style={styles.heroLeft}>
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>SPEED 3-CARD UNO</Text>
                  </View>
                  <Text style={styles.heroTitle}>Live Online Quick Match</Text>
                  <Text style={styles.heroSub}>
                    Instant matchmaking with real players worldwide. Choose table size & coins stake!
                  </Text>
                </View>
                <Text style={styles.heroIcon}>⚡</Text>
              </LinearGradient>

              {/* Section: Select Table Size */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SELECT TABLE SIZE</Text>
              </View>

              <View style={styles.tableSizesRow}>
                {TABLE_SIZES.map((size) => {
                  const isSelected = selectedTableSize === size.count;
                  return (
                    <TouchableOpacity
                      key={size.count}
                      activeOpacity={0.8}
                      style={[
                        styles.sizeCard,
                        {
                          backgroundColor: isDark ? '#101C14' : '#FFFFFF',
                          borderColor: isSelected ? '#E74C3C' : isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
                        },
                        isSelected && styles.sizeCardActive,
                      ]}
                      onPress={() => setSelectedTableSize(size.count)}
                    >
                      <Text style={styles.sizeIcon}>{size.icon}</Text>
                      <Text
                        style={[
                          styles.sizeTitle,
                          { color: isSelected ? '#E74C3C' : isDark ? '#FFF' : '#1A2318' },
                        ]}
                      >
                        {size.title}
                      </Text>
                      <Text style={[styles.sizeDesc, { color: isDark ? '#7A9182' : '#8CA093' }]}>
                        {size.desc}
                      </Text>

                      {isSelected && (
                        <View style={styles.activeCheckPill}>
                          <Text style={styles.activeCheckText}>SELECTED</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Section: Entry Stake & Prize Pool */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SELECT ENTRY STAKE</Text>
                {selectedStake.fee > 0 && (
                  <View style={styles.prizePoolTag}>
                    <Text style={styles.prizePoolTagText}>
                      WINNER PRIZE: {prizePool.toLocaleString()} 🪙
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.stakeGrid}>
                {STAKE_OPTIONS.map((stake) => {
                  const isSelected = selectedStake.id === stake.id;
                  const isAffordable = stake.fee <= userCoins;

                  return (
                    <TouchableOpacity
                      key={stake.id}
                      activeOpacity={0.8}
                      style={[
                        styles.stakeCard,
                        {
                          backgroundColor: isDark ? '#101C14' : '#FFFFFF',
                          borderColor: isSelected ? '#F1C40F' : isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
                          opacity: isAffordable ? 1 : 0.6,
                        },
                        isSelected && styles.stakeCardActive,
                      ]}
                      onPress={() => setSelectedStake(stake)}
                    >
                      <View style={styles.stakeTopRow}>
                        <Text style={styles.stakeBadgeText}>{stake.tag}</Text>
                        {isSelected && <Text style={{ color: '#F1C40F' }}>✓</Text>}
                      </View>
                      <Text
                        style={[
                          styles.stakeLabel,
                          { color: isSelected ? '#F1C40F' : isDark ? '#FFF' : '#1A2318' },
                        ]}
                      >
                        {stake.label}
                      </Text>
                      <Text style={[styles.stakePrizeSub, { color: isDark ? '#7A9182' : '#8CA093' }]}>
                        {stake.fee === 0 ? 'Practice XP' : `Win ${(stake.fee * selectedTableSize).toLocaleString()} 🪙`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Start Matchmaking Action Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.startSearchBtn}
                onPress={handleStartSearching}
              >
                <LinearGradient
                  colors={['#E74C3C', '#C0392B', '#922B21']}
                  style={styles.startSearchGradient}
                >
                  <Text style={styles.startSearchBtnText}>
                    ⚡ FIND {selectedTableSize}P MATCH NOW
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )
        ) : (
          /* ─── PLAY WITH FRIENDS VIEW ─── */
          privateTab === 'create' ? (
            /* CREATE ROOM VIEW */
            <View style={styles.privateCard}>
              <Text style={styles.privateHeaderIcon}>👑</Text>
              <Text style={styles.privateTitle}>Host Custom Uno Room</Text>
              <Text style={styles.privateSub}>
                Share this code with your friends or send direct invites below
              </Text>

              {/* Room Code Display Box */}
              <View style={styles.codeDisplayBox}>
                <Text style={styles.codeLabel}>YOUR ROOM CODE</Text>
                <Text style={styles.codeLargeText}>{roomCode}</Text>

                <View style={styles.codeActionsRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.codeActionBtn}
                    onPress={handleCopyRoomCode}
                  >
                    <Text style={styles.codeActionText}>📋 Copy Code</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.codeActionBtn, { backgroundColor: '#2980B9' }]}
                    onPress={handleShareRoomCode}
                  >
                    <Text style={styles.codeActionText}>↗ Share</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Table Capacity Selector */}
              <View style={[styles.sectionHeader, { width: '100%', marginTop: 8 }]}>
                <Text style={styles.sectionTitle}>ROOM CAPACITY</Text>
              </View>

              <View style={[styles.tableSizesRow, { width: '100%', marginBottom: 16 }]}>
                {TABLE_SIZES.map((size) => {
                  const isSelected = selectedTableSize === size.count;
                  return (
                    <TouchableOpacity
                      key={size.count}
                      activeOpacity={0.8}
                      style={[
                        styles.sizeCard,
                        {
                          backgroundColor: isDark ? '#141E18' : '#FFFFFF',
                          borderColor: isSelected ? '#2ECC71' : isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
                        },
                        isSelected && { borderColor: '#2ECC71', borderWidth: 2 },
                      ]}
                      onPress={() => setSelectedTableSize(size.count)}
                    >
                      <Text style={styles.sizeIcon}>{size.icon}</Text>
                      <Text style={[styles.sizeTitle, { color: isSelected ? '#2ECC71' : isDark ? '#FFF' : '#1A2318' }]}>
                        {size.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Friends Invite Strip */}
              {friendsList.length > 0 && (
                <View style={{ width: '100%', marginBottom: 18 }}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>INVITE ONLINE FRIENDS</Text>
                  </View>

                  {friendsList.map((f) => {
                    const isInvited = invitedFriends.has(f.id);
                    return (
                      <View
                        key={f.id}
                        style={[
                          styles.friendRow,
                          {
                            backgroundColor: isDark ? '#141E18' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
                          },
                        ]}
                      >
                        <Text style={styles.friendAvatar}>😎</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.friendName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                            {f.name || f.username}
                          </Text>
                          <Text style={[styles.friendStatus, { color: f.isOnline ? '#2ECC71' : '#7A9182' }]}>
                            {f.isOnline ? '🟢 Online' : 'Offline'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          disabled={isInvited}
                          style={[
                            styles.inviteBtn,
                            isInvited && { backgroundColor: 'rgba(255,255,255,0.1)' },
                          ]}
                          onPress={() => handleInviteFriend(f)}
                        >
                          <Text style={styles.inviteBtnText}>
                            {isInvited ? 'INVITED' : 'INVITE +'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Start Room Match Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.startSearchBtn}
                onPress={handleStartPrivateRoomMatch}
              >
                <LinearGradient
                  colors={['#27AE60', '#1E8449', '#145A32']}
                  style={styles.startSearchGradient}
                >
                  <Text style={styles.startSearchBtnText}>🎮 START ROOM MATCH</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            /* JOIN ROOM VIEW */
            <View style={styles.privateCard}>
              <Text style={styles.privateHeaderIcon}>🔑</Text>
              <Text style={styles.privateTitle}>Enter Room Code</Text>
              <Text style={styles.privateSub}>
                Type the 6-character room code provided by the room host
              </Text>

              <TextInput
                style={[
                  styles.codeInput,
                  {
                    color: isDark ? '#FFF' : '#1A2318',
                    borderColor: '#E74C3C',
                    backgroundColor: isDark ? '#101C14' : '#FFFFFF',
                  },
                ]}
                value={inputJoinCode}
                onChangeText={setInputJoinCode}
                placeholder="e.g. UNO-8492"
                placeholderTextColor="#7A9182"
                autoCapitalize="characters"
              />

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.startSearchBtn}
                onPress={handleJoinByCode}
              >
                <LinearGradient
                  colors={['#E74C3C', '#C0392B', '#922B21']}
                  style={styles.startSearchGradient}
                >
                  <Text style={styles.startSearchBtnText}>🚀 JOIN UNO ROOM</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )
        )}
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
    fontSize: 16,
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
  tabPillWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 3,
    marginTop: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeTabBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  setupContainer: {
    width: '100%',
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroLeft: {
    flex: 1,
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
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#FFD2D2',
    lineHeight: 16,
  },
  heroIcon: {
    fontSize: 42,
    marginLeft: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#E74C3C',
    letterSpacing: 0.8,
  },
  prizePoolTag: {
    backgroundColor: 'rgba(241, 196, 15, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  prizePoolTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#F1C40F',
  },
  tableSizesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  sizeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  sizeCardActive: {
    borderColor: '#E74C3C',
    borderWidth: 2,
  },
  sizeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  sizeTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  sizeDesc: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  activeCheckPill: {
    marginTop: 6,
    backgroundColor: '#E74C3C',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeCheckText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stakeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  stakeCard: {
    width: (width - 32 - 10) / 2,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
  },
  stakeCardActive: {
    borderColor: '#F1C40F',
    borderWidth: 2,
  },
  stakeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stakeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#7A9182',
  },
  stakeLabel: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 2,
  },
  stakePrizeSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  startSearchBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  startSearchGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startSearchBtnText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  searchingContainer: {
    alignItems: 'center',
  },
  radarSection: {
    alignItems: 'center',
    marginVertical: 16,
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
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
  },
  orbitCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitBadge: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  orbitBadgeGlyph: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  centerRadarHub: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF7675',
  },
  centerRadarIcon: {
    fontSize: 26,
  },
  matchFoundBanner: {
    marginVertical: 14,
    borderRadius: 18,
    overflow: 'hidden',
    width: width - 48,
  },
  matchFoundGradient: {
    padding: 16,
    alignItems: 'center',
  },
  matchFoundEmblem: {
    fontSize: 32,
    marginBottom: 4,
  },
  matchFoundHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  matchFoundSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E8F8F0',
    marginTop: 2,
  },
  statusBox: {
    alignItems: 'center',
    marginTop: 10,
  },
  timerBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E74C3C',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableInfoStrip: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 14,
  },
  tableInfoText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#A0B2A6',
  },
  slotsContainer: {
    width: '100%',
    gap: 8,
    marginBottom: 18,
  },
  playerSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  slotAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotAvatarText: {
    fontSize: 20,
  },
  slotNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotPlayerName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  youBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#2ECC71',
  },
  slotSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  readyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  readyPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  searchingSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  searchingSlotIcon: {
    fontSize: 18,
  },
  searchingSlotText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    borderWidth: 1.5,
    borderColor: '#E74C3C',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E74C3C',
    letterSpacing: 0.8,
  },
  privateCard: {
    alignItems: 'center',
    width: '100%',
  },
  privateHeaderIcon: {
    fontSize: 38,
    marginBottom: 6,
  },
  privateTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  privateSub: {
    fontSize: 12,
    color: '#8CA093',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  codeDisplayBox: {
    width: '100%',
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E74C3C',
    marginBottom: 18,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#E74C3C',
    letterSpacing: 1,
  },
  codeLargeText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F1C40F',
    letterSpacing: 4,
    marginVertical: 6,
  },
  codeActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  codeActionBtn: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  codeActionText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  codeInput: {
    width: '100%',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 16,
    letterSpacing: 2,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  friendAvatar: {
    fontSize: 22,
  },
  friendName: {
    fontSize: 13,
    fontWeight: '800',
  },
  friendStatus: {
    fontSize: 10,
    fontWeight: '600',
  },
  inviteBtn: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inviteBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});

export default UnoLobbyScreen;
