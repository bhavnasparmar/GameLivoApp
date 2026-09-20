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
import { UNO_ROBOT_PROFILES } from '../../../../gameEngine/uno/unoConstants';

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

export const TABLE_CAPACITY_OPTIONS = [
  { count: 2, label: '2 Players', title: '1v1 Duel', icon: '⚔️', desc: 'Fast & Intense', color: '#E74C3C' },
  { count: 3, label: '3 Players', title: '3-Way Trio', icon: '⚡', desc: 'Triangle Clash', color: '#E67E22' },
  { count: 4, label: '4 Players', title: 'Classic 4P', icon: '🎯', desc: 'Official Match', color: '#F1C40F' },
  { count: 5, label: '5 Players', title: 'Squad 5P', icon: '🌟', desc: '5-Way Battle', color: '#2ECC71' },
  { count: 6, label: '6 Players', title: 'Hexa 6P', icon: '🔥', desc: 'Multi-Side Action', color: '#1ABC9C' },
  { count: 7, label: '7 Players', title: 'Epic 7P', icon: '💥', desc: 'Party Clash', color: '#3498DB' },
  { count: 8, label: '8 Players', title: 'Party Arena', icon: '👑', desc: 'Max Uno Mayhem', color: '#9B59B6' },
];

export const TURN_TIME_OPTIONS = [
  { seconds: 10, label: '10s Blitz', tag: 'Fast' },
  { seconds: 15, label: '15s Standard', tag: 'Recommended' },
  { seconds: 30, label: '30s Relaxed', tag: 'Casual' },
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
}

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
  const [selectedTurnTime, setSelectedTurnTime] = useState<typeof TURN_TIME_OPTIONS[0]>(TURN_TIME_OPTIONS[1]); // default 15s

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
    return `UNO-${res}`;
  });
  const [inputJoinCode, setInputJoinCode] = useState<string>('');
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [invitedFriends, setInvitedFriends] = useState<Set<string>>(new Set());
  const [dbUsers, setDbUsers] = useState<any[]>([]);

  // Live Room Players List (Host + Joined Players / Bots)
  const [roomPlayers, setRoomPlayers] = useState<LobbyRoomPlayer[]>([
    {
      id: currentUserId,
      name: playerName,
      avatar: userAvatar,
      isHost: true,
      isBot: false,
      isReady: true,
      rating: userRating,
      ping: '20ms',
    },
  ]);

  // Toast State
  const [toastMsg, setToastMsg] = useState<string>('');
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2200);
  };

  // Animations
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const matchPopScale = useRef(new Animated.Value(0.7)).current;
  const matchPopOpacity = useRef(new Animated.Value(0.7)).current;

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
          .filter(
            (u: any) =>
              u &&
              (u.id || u._id || u.userId) &&
              u.id !== currentUserId &&
              u._id !== currentUserId &&
              u.userId !== currentUserId &&
              u.name !== playerName &&
              u.username !== playerName,
          )
          .map((u: any, idx: number) => ({
            id: u.id || u._id || u.userId || `db_${idx + 1}`,
            name: u.name || u.username || `Player ${idx + 1}`,
            avatar: u.avatar || '😎',
            rating: typeof u.rank === 'number' ? (u.rank > 200 ? u.rank : 1400 + u.rank * 10) : u.rating || 1450,
            level: typeof u.level === 'number' ? u.level : (idx % 15) + 5,
            country: u.country || '🌐',
            ping: `${18 + ((idx * 3) % 24)}ms`,
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
      friendsService
        .getFriends()
        .then((res) => {
          if (res && res.length > 0) {
            setFriendsList(res);
          }
        })
        .catch(() => {});
    }
  }, [mode]);

  // Radar Animation Loop
  useEffect(() => {
    if (!isSearching && !isRoomCreated) return;

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
  }, [isSearching, isRoomCreated, pulseAnim1, pulseAnim2, rotateAnim]);

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

  // Handle Socket Events for Quick Match and Private Lobby
  useEffect(() => {
    if (!socketService.isConnected()) {
      socketService.connect();
    }

    if (mode === 'random' && isSearching) {
      socketService.emit(SOCKET_EVENTS.MATCH_QUEUE_JOIN, {
        gameId: 'uno',
        playerCount: selectedTableSize,
        entryFee: 0,
        timeSeconds: selectedTurnTime.seconds,
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
          setMatchedOpponents(
            others.map((p: any, idx: number) => ({
              id: p.id || p.userId || `opp_${idx + 1}`,
              name: p.name || p.username || `Player ${idx + 2}`,
              avatar: p.avatar || '😎',
              rating: p.rating || 1450,
              level: p.level || 12,
              country: p.country || '🌐',
              ping: '28ms',
              isBot: Boolean(p.isBot),
            })),
          );
          setIsMatchReady(true);
          soundService.play('notification');
          vibrationService.vibrateSuccess();
        }
      }
    };

    const handleLobbyUpdate = (lobby: any) => {
      if (lobby && lobby.players) {
        console.log('[Uno Socket] Lobby update received:', lobby);
        if (Array.isArray(lobby.players) && lobby.players.length > 0) {
          const mapped: LobbyRoomPlayer[] = lobby.players.map((p: any) => ({
            id: p.userId || p.id,
            name: p.username || p.name,
            avatar: p.avatar || '😎',
            isHost: Boolean(p.isHost),
            isBot: Boolean(p.isBot),
            isReady: Boolean(p.isReady),
            rating: p.rating || 1450,
            ping: '24ms',
          }));
          setRoomPlayers(mapped);
        }
      }
    };

    const handleServerGameStart = (data: any) => {
      soundService.play('card_flip');
      vibrationService.vibrateSuccess();
      navigation.replace(ROUTES.UNO_GAME, {
        matchId: data.matchId || `uno_room_${roomCode}`,
        mode: 'private',
        difficulty: 'medium',
        playerCount: selectedTableSize,
        stake: 0,
        prizePool: 0,
        players: data.players || roomPlayers,
        player1Name: playerName,
        userAvatar,
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
    selectedTurnTime.seconds,
    currentUserId,
    playerName,
    userAvatar,
    userRating,
    navigation,
    roomCode,
    roomPlayers,
  ]);

  // Quick Match Real & Online Opponents Matching Simulation
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
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    for (let i = 0; i < requiredOpponents; i++) {
      const delay = (i + 1) * 750 + Math.random() * 350;
      const t = setTimeout(() => {
        const opp = shuffledPool[i % shuffledPool.length];
        matched.push({
          id: opp.id || `opp_${i + 1}_${Date.now()}`,
          name: opp.name,
          avatar: opp.avatar || '😎',
          rating: opp.rating || 1450,
          level: opp.level || 12,
          country: opp.country || '🌐',
          ping: '24ms',
          isBot: false,
        });
        setMatchedOpponents([...matched]);
        soundService.play('button_tap');
        vibrationService.vibrateTap();

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
  }, [isSearching, selectedTableSize, isMatchReady, matchPopScale, matchPopOpacity, dbUsers]);

  // Quick Match Countdown & Launch
  useEffect(() => {
    if (!isMatchReady) return;

    if (matchCountdown > 0) {
      const cd = setTimeout(() => {
        setMatchCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(cd);
    }

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
        isBot: true,
      })),
    ];

    navigation.replace(ROUTES.UNO_GAME, {
      matchId: `uno_qm_${Date.now()}`,
      mode: 'random',
      difficulty: 'medium',
      playerCount: selectedTableSize,
      stake: 0,
      prizePool: 0,
      players: finalPlayers,
      player1Name: playerName,
      userAvatar,
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
  ]);

  // ─── Play with Friends Actions ───

  // Host creates room
  const handleHostCreateRoom = () => {
    soundService.play('button_tap');
    vibrationService.vibrateTap();

    // Reset room players to host only
    const hostPlayer: LobbyRoomPlayer = {
      id: currentUserId,
      name: playerName,
      avatar: userAvatar,
      isHost: true,
      isBot: false,
      isReady: true,
      rating: userRating,
      ping: '16ms',
    };
    setRoomPlayers([hostPlayer]);
    setIsRoomCreated(true);

    // Emit lobby create event to backend socket
    socketService.emit(SOCKET_EVENTS.LOBBY_CREATE, {
      gameId: 'uno',
      code: roomCode,
      maxPlayers: selectedTableSize,
      entryFee: 0,
      timeSeconds: selectedTurnTime.seconds,
      isPrivate: true,
    });

    showToast(`Room #${roomCode} Created!`);
  };

  // Add a bot into empty slot
  const handleAddBotSlot = () => {
    if (roomPlayers.length >= selectedTableSize) {
      Alert.alert('Room Full', `This room has reached maximum capacity of ${selectedTableSize} players.`);
      return;
    }

    const availableBots = UNO_ROBOT_PROFILES.filter(
      (b) => !roomPlayers.some((p) => p.name.toLowerCase() === b.name.toLowerCase()),
    );

    const botToAdd = availableBots[0] || UNO_ROBOT_PROFILES[0];
    const newBotPlayer: LobbyRoomPlayer = {
      id: `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${botToAdd.name} (AI)`,
      avatar: botToAdd.avatar,
      isHost: false,
      isBot: true,
      isReady: true,
      rating: 1450,
      ping: '12ms',
    };

    soundService.play('button_tap');
    vibrationService.vibrateTap();
    setRoomPlayers((prev) => [...prev, newBotPlayer]);
    showToast(`Added ${botToAdd.name} to room`);
  };

  // Fill all remaining empty slots with bots
  const handleFillAllWithBots = () => {
    const slotsNeeded = selectedTableSize - roomPlayers.length;
    if (slotsNeeded <= 0) return;

    soundService.play('button_tap');
    vibrationService.vibrateTap();

    const currentNames = new Set(roomPlayers.map((p) => p.name.toLowerCase()));
    const botsPool = UNO_ROBOT_PROFILES.filter((b) => !currentNames.has(b.name.toLowerCase()));

    const newBots: LobbyRoomPlayer[] = [];
    for (let i = 0; i < slotsNeeded; i++) {
      const b = botsPool[i % botsPool.length];
      newBots.push({
        id: `bot_${Date.now()}_${i}`,
        name: `${b.name} (AI)`,
        avatar: b.avatar,
        isHost: false,
        isBot: true,
        isReady: true,
        rating: 1420 + i * 20,
        ping: '15ms',
      });
    }

    setRoomPlayers((prev) => [...prev, ...newBots]);
    showToast(`Filled ${slotsNeeded} seats with AI Bots!`);
  };

  // Remove a player/bot from room
  const handleRemovePlayer = (playerId: string) => {
    if (playerId === currentUserId) return; // Cannot remove self
    setRoomPlayers((prev) => prev.filter((p) => p.id !== playerId));
    socketService.emit(SOCKET_EVENTS.LOBBY_KICK_PLAYER, { targetUserId: playerId });
    showToast('Player removed from room');
  };

  // Copy Room Code
  const handleCopyRoomCode = () => {
    Clipboard.setString(roomCode);
    soundService.play('button_tap');
    showToast(`Code ${roomCode} copied to clipboard! 📋`);
  };

  // Share Room Code
  const handleShareRoomCode = async () => {
    try {
      soundService.play('button_tap');
      await Share.share({
        message: `🔥 Join my UNO Match on GameLivo!\nRoom Code: ${roomCode}\nCapacity: ${selectedTableSize} Players\nLet's play and shout UNO! 🂡`,
      });
    } catch (e) {}
  };

  // Invite Friend
  const handleInviteFriend = (friend: Friend) => {
    setInvitedFriends((prev) => new Set(prev).add(friend.id));
    soundService.play('notification');
    vibrationService.vibrateTap();

    socketService.emit(SOCKET_EVENTS.FRIEND_GAME_INVITE, {
      friendUserId: friend.id,
      gameId: 'uno',
      roomCode,
      timeSeconds: selectedTurnTime.seconds,
    });

    showToast(`Invitation sent to ${friend.name || friend.username}! ✉️`);
  };

  // Host starts private room match
  const handleStartPrivateRoomMatch = () => {
    if (roomPlayers.length < 2) {
      Alert.alert(
        'Need More Players',
        `At least 2 players are required to start the match. You can tap "+ Add Bot" to fill empty seats with AI.`,
        [
          { text: '+ Add Bot Now', onPress: handleAddBotSlot },
          { text: 'OK', style: 'cancel' },
        ],
      );
      return;
    }

    soundService.play('card_flip');
    vibrationService.vibrateSuccess();

    socketService.emit(SOCKET_EVENTS.LOBBY_START_GAME, {
      roomCode,
      timeSeconds: selectedTurnTime.seconds,
      players: roomPlayers,
    });

    navigation.replace(ROUTES.UNO_GAME, {
      matchId: `uno_room_${roomCode}`,
      mode: 'private',
      difficulty: 'medium',
      playerCount: selectedTableSize,
      stake: 0,
      prizePool: 0,
      players: roomPlayers,
      player1Name: playerName,
      userAvatar,
    });
  };

  // Join Room by Code
  const handleJoinByCode = () => {
    const clean = inputJoinCode.trim().toUpperCase();
    if (clean.length < 4) {
      Alert.alert('Invalid Code', 'Please enter a valid 4-8 character room code (e.g. UNO-8492).');
      return;
    }

    soundService.play('button_tap');
    vibrationService.vibrateTap();

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
      userAvatar,
    });
  };

  const handlePasteCode = async () => {
    try {
      const text = await Clipboard.getString();
      if (text) {
        const clean = text.trim().toUpperCase();
        setInputJoinCode(clean);
        showToast('Pasted code from clipboard');
      }
    } catch (e) {}
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

      {/* ─── Top App Bar ─── */}
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
                socketService.emit(SOCKET_EVENTS.MATCH_QUEUE_LEAVE, { gameId: 'uno' });
                setIsSearching(false);
              } else if (isRoomCreated) {
                setIsRoomCreated(false);
              } else {
                navigation.goBack();
              }
            }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.appBarTitle}>
              {mode === 'random'
                ? '⚡ QUICK MATCH'
                : isRoomCreated
                ? `👑 ROOM #${roomCode}`
                : '🔒 PLAY WITH FRIENDS'}
            </Text>
          </View>

          <View style={styles.coinPill}>
            <Text style={styles.coinDot}>🪙</Text>
            <Text style={styles.coinText}>{userCoins.toLocaleString()}</Text>
          </View>
        </View>

        {/* Sub-tab Switcher for Private Mode (When room is not yet created) */}
        {mode === 'private' && !isRoomCreated && (
          <View style={styles.tabPillWrap}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.tabBtn, privateTab === 'create' && styles.activeTabBtn]}
              onPress={() => setPrivateTab('create')}
            >
              <Text style={[styles.tabText, privateTab === 'create' && styles.activeTabText]}>
                👑 Host Room
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

      {/* Floating Toast Notification */}
      {toastMsg ? (
        <View style={styles.toastContainer} pointerEvents="none">
          <LinearGradient colors={['#2D3436', '#1E272E']} style={styles.toastGradient}>
            <Text style={styles.toastText}>{toastMsg}</Text>
          </LinearGradient>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {mode === 'random' ? (
          /* ════════════════════ QUICK MATCH VIEW ════════════════════ */
          isSearching ? (
            /* ACTIVE RADAR MATCHMAKING */
            <View style={styles.searchingContainer}>
              <View style={styles.radarSection}>
                {!isMatchReady ? (
                  <View style={styles.radarWrapper}>
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

                    <LinearGradient colors={['#E74C3C', '#C0392B', '#781515']} style={styles.centerRadarHub}>
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
                    <LinearGradient colors={['#27AE60', '#1E8449', '#145A32']} style={styles.matchFoundGradient}>
                      <Text style={styles.matchFoundEmblem}>🎉</Text>
                      <Text style={styles.matchFoundHeading}>ALL PLAYERS FOUND!</Text>
                      <Text style={styles.matchFoundSub}>Dealing cards in {matchCountdown}s...</Text>
                    </LinearGradient>
                  </Animated.View>
                )}

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
                  {selectedTableSize}-Player Tournament Arena · Turn Timer: {selectedTurnTime.label}
                </Text>
              </View>

              {/* Player Slots */}
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

              {!isMatchReady && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.cancelBtn}
                  onPress={() => {
                    socketService.emit(SOCKET_EVENTS.MATCH_QUEUE_LEAVE, { gameId: 'uno' });
                    setIsSearching(false);
                  }}
                >
                  <Text style={styles.cancelBtnText}>✕ CANCEL SEARCH</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            /* QUICK MATCH SETUP SELECTION */
            <View style={styles.setupContainer}>
              <LinearGradient colors={['#E74C3C', '#C0392B', '#922B21']} style={styles.heroCard}>
                <View style={styles.heroLeft}>
                  <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>SPEED 3-CARD UNO</Text>
                  </View>
                  <Text style={styles.heroTitle}>Live Online Quick Match</Text>
                  <Text style={styles.heroSub}>
                    Instant matchmaking with real champions worldwide. Select table size & jump right in!
                  </Text>
                </View>
                <Text style={styles.heroIcon}>⚡</Text>
              </LinearGradient>

              {/* Table Size (2 to 8 Players) */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>SELECT TABLE CAPACITY (2 - 8 PLAYERS)</Text>
              </View>

              <View style={styles.capacityGrid}>
                {TABLE_CAPACITY_OPTIONS.map((cap) => {
                  const isSelected = selectedTableSize === cap.count;
                  return (
                    <TouchableOpacity
                      key={cap.count}
                      activeOpacity={0.8}
                      style={[
                        styles.capacityCard,
                        {
                          backgroundColor: isDark ? '#101C14' : '#FFFFFF',
                          borderColor: isSelected ? cap.color : isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
                        },
                        isSelected && { borderWidth: 2, borderColor: cap.color },
                      ]}
                      onPress={() => setSelectedTableSize(cap.count)}
                    >
                      <Text style={styles.capacityIcon}>{cap.icon}</Text>
                      <Text
                        style={[
                          styles.capacityCountText,
                          { color: isSelected ? cap.color : isDark ? '#FFF' : '#1A2318' },
                        ]}
                      >
                        {cap.title}
                      </Text>
                      <Text style={[styles.capacityDescText, { color: isDark ? '#7A9182' : '#8CA093' }]}>
                        {cap.desc}
                      </Text>
                      {isSelected && (
                        <View style={[styles.activePill, { backgroundColor: cap.color }]}>
                          <Text style={styles.activePillText}>SELECTED</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Turn Timer Selector */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>TURN TIMER</Text>
              </View>

              <View style={styles.timerRow}>
                {TURN_TIME_OPTIONS.map((t) => {
                  const isSelected = selectedTurnTime.seconds === t.seconds;
                  return (
                    <TouchableOpacity
                      key={t.seconds}
                      activeOpacity={0.8}
                      style={[
                        styles.timerCard,
                        {
                          backgroundColor: isDark ? '#101C14' : '#FFFFFF',
                          borderColor: isSelected ? '#E74C3C' : isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
                        },
                        isSelected && { borderColor: '#E74C3C', borderWidth: 2 },
                      ]}
                      onPress={() => setSelectedTurnTime(t)}
                    >
                      <Text
                        style={[
                          styles.timerLabelText,
                          { color: isSelected ? '#E74C3C' : isDark ? '#FFF' : '#1A2318' },
                        ]}
                      >
                        {t.label}
                      </Text>
                      <Text style={[styles.timerTagText, { color: isDark ? '#7A9182' : '#8CA093' }]}>
                        {t.tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Start Search Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.startSearchBtn}
                onPress={() => {
                  setMatchedOpponents([]);
                  setIsMatchReady(false);
                  setElapsedSeconds(0);
                  setMatchCountdown(3);
                  setIsSearching(true);
                  soundService.play('button_tap');
                  vibrationService.vibrateTap();
                }}
              >
                <LinearGradient colors={['#E74C3C', '#C0392B', '#922B21']} style={styles.startSearchGradient}>
                  <Text style={styles.startSearchBtnText}>⚡ FIND {selectedTableSize}P MATCH NOW</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )
        ) : (
          /* ════════════════════ PLAY WITH FRIENDS VIEW ════════════════════ */
          privateTab === 'create' ? (
            !isRoomCreated ? (
              /* ─── 1. HOST ROOM CONFIGURATION SCREEN ─── */
              <View style={styles.setupContainer}>
                {/* Hero Card */}
                <LinearGradient colors={['#27AE60', '#1E8449', '#145A32']} style={styles.heroCard}>
                  <View style={styles.heroLeft}>
                    <View style={[styles.heroBadge, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                      <Text style={[styles.heroBadgeText, { color: '#2ECC71' }]}>CUSTOM MULTIPLAYER ARENA</Text>
                    </View>
                    <Text style={styles.heroTitle}>Host Private Uno Table</Text>
                    <Text style={styles.heroSub}>
                      Select table capacity (2 to 8 players), timer, and invite your friends with your custom room code!
                    </Text>
                  </View>
                  <Text style={styles.heroIcon}>👑</Text>
                </LinearGradient>

                {/* Section: Select Player Capacity (2 to 8 Players) */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: '#2ECC71' }]}>
                    SELECT ROOM CAPACITY (2 - 8 PLAYERS)
                  </Text>
                  <View style={[styles.prizePoolTag, { backgroundColor: 'rgba(46, 204, 113, 0.15)' }]}>
                    <Text style={[styles.prizePoolTagText, { color: '#2ECC71' }]}>
                      {selectedTableSize} PLAYERS TABLE
                    </Text>
                  </View>
                </View>

                {/* 2 to 8 Players Capacity Grid */}
                <View style={styles.capacityGrid}>
                  {TABLE_CAPACITY_OPTIONS.map((cap) => {
                    const isSelected = selectedTableSize === cap.count;
                    return (
                      <TouchableOpacity
                        key={cap.count}
                        activeOpacity={0.8}
                        style={[
                          styles.capacityCard,
                          {
                            backgroundColor: isDark ? '#101C14' : '#FFFFFF',
                            borderColor: isSelected ? cap.color : isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
                          },
                          isSelected && { borderWidth: 2, borderColor: cap.color },
                        ]}
                        onPress={() => setSelectedTableSize(cap.count)}
                      >
                        <Text style={styles.capacityIcon}>{cap.icon}</Text>
                        <Text
                          style={[
                            styles.capacityCountText,
                            { color: isSelected ? cap.color : isDark ? '#FFF' : '#1A2318' },
                          ]}
                        >
                          {cap.title}
                        </Text>
                        <Text style={[styles.capacityDescText, { color: isDark ? '#7A9182' : '#8CA093' }]}>
                          {cap.desc}
                        </Text>
                        {isSelected && (
                          <View style={[styles.activePill, { backgroundColor: cap.color }]}>
                            <Text style={styles.activePillText}>SELECTED</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Section: Turn Timer */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: '#2ECC71' }]}>TURN TIMER</Text>
                </View>

                <View style={styles.timerRow}>
                  {TURN_TIME_OPTIONS.map((t) => {
                    const isSelected = selectedTurnTime.seconds === t.seconds;
                    return (
                      <TouchableOpacity
                        key={t.seconds}
                        activeOpacity={0.8}
                        style={[
                          styles.timerCard,
                          {
                            backgroundColor: isDark ? '#101C14' : '#FFFFFF',
                            borderColor: isSelected ? '#2ECC71' : isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
                          },
                          isSelected && { borderColor: '#2ECC71', borderWidth: 2 },
                        ]}
                        onPress={() => setSelectedTurnTime(t)}
                      >
                        <Text
                          style={[
                            styles.timerLabelText,
                            { color: isSelected ? '#2ECC71' : isDark ? '#FFF' : '#1A2318' },
                          ]}
                        >
                          {t.label}
                        </Text>
                        <Text style={[styles.timerTagText, { color: isDark ? '#7A9182' : '#8CA093' }]}>
                          {t.tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Create Room Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.startSearchBtn}
                  onPress={handleHostCreateRoom}
                >
                  <LinearGradient colors={['#27AE60', '#1E8449', '#145A32']} style={styles.startSearchGradient}>
                    <Text style={styles.startSearchBtnText}>
                      👑 CREATE & OPEN {selectedTableSize}P LOBBY
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* ─── 2. LIVE INTERACTIVE WAITING ROOM (LOBBY) ─── */
              <View style={styles.setupContainer}>
                {/* Glowing Room Code Hero Card */}
                <View style={styles.roomCodeBox}>
                  <View style={styles.roomCodeTopRow}>
                    <View style={styles.roomCodeBadge}>
                      <Text style={styles.roomCodeBadgeText}>OFFICIAL UNO ROOM</Text>
                    </View>
                    <Text style={styles.roomCapacityBadge}>
                      👥 {roomPlayers.length} / {selectedTableSize} Players
                    </Text>
                  </View>

                  <Text style={styles.roomCodeLabel}>SHARE ROOM CODE WITH FRIENDS</Text>
                  <Text style={styles.roomCodeLarge}>{roomCode}</Text>

                  {/* Copy & Share Buttons */}
                  <View style={styles.roomCodeBtnRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.roomActionBtn}
                      onPress={handleCopyRoomCode}
                    >
                      <Text style={styles.roomActionBtnText}>📋 Copy Code</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[styles.roomActionBtn, { backgroundColor: '#2980B9' }]}
                      onPress={handleShareRoomCode}
                    >
                      <Text style={styles.roomActionBtnText}>↗ Share Link</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Host Control Buttons: Add Bot & Fill Remaining */}
                <View style={styles.hostBotControlRow}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.addBotBtn}
                    onPress={handleAddBotSlot}
                  >
                    <Text style={styles.addBotBtnText}>+ Add Single Bot</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.addBotBtn, { backgroundColor: '#D35400' }]}
                    onPress={handleFillAllWithBots}
                  >
                    <Text style={styles.addBotBtnText}>⚡ Fill All with Bots</Text>
                  </TouchableOpacity>
                </View>

                {/* Section: Table Seats Grid (2 to 8 Slots) */}
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: '#2ECC71' }]}>
                    TABLE SEATS ({roomPlayers.length}/{selectedTableSize})
                  </Text>
                  <Text style={[styles.sectionSub, { color: isDark ? '#7A9182' : '#8CA093' }]}>
                    {roomPlayers.length >= 2 ? 'Ready to launch!' : 'Waiting for at least 2 players...'}
                  </Text>
                </View>

                <View style={styles.slotsContainer}>
                  {/* Render Occupied Slots */}
                  {roomPlayers.map((player, idx) => (
                    <View
                      key={player.id}
                      style={[
                        styles.playerSlotCard,
                        {
                          backgroundColor: isDark ? '#101C14' : '#FFFFFF',
                          borderColor: player.isHost ? '#F1C40F' : '#2ECC71',
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={player.isHost ? ['#F1C40F', '#D68910'] : ['#2ECC71', '#27AE60']}
                        style={styles.slotAvatarWrap}
                      >
                        <Text style={styles.slotAvatarText}>{player.avatar}</Text>
                      </LinearGradient>

                      <View style={{ flex: 1 }}>
                        <View style={styles.slotNameRow}>
                          <Text style={[styles.slotPlayerName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                            {player.name}
                          </Text>
                          {player.isHost && (
                            <View style={[styles.youBadge, { backgroundColor: 'rgba(241, 196, 15, 0.2)' }]}>
                              <Text style={[styles.youBadgeText, { color: '#F1C40F' }]}>👑 HOST</Text>
                            </View>
                          )}
                          {player.isBot && (
                            <View style={[styles.youBadge, { backgroundColor: 'rgba(52, 152, 219, 0.2)' }]}>
                              <Text style={[styles.youBadgeText, { color: '#3498DB' }]}>AI BOT</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.slotSub, { color: isDark ? '#8CA093' : '#5C7A6A' }]}>
                          Seat #{idx + 1} · 🟢 {player.ping || '18ms'}
                        </Text>
                      </View>

                      {/* Remove Button for Host */}
                      {!player.isHost && (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={styles.removeSlotBtn}
                          onPress={() => handleRemovePlayer(player.id)}
                        >
                          <Text style={styles.removeSlotText}>✕</Text>
                        </TouchableOpacity>
                      )}

                      <View
                        style={[
                          styles.readyPill,
                          { backgroundColor: player.isReady ? '#2ECC71' : '#E67E22' },
                        ]}
                      >
                        <Text style={styles.readyPillText}>
                          {player.isReady ? 'READY ✓' : 'WAITING'}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* Render Remaining Empty Slots */}
                  {Array.from({ length: Math.max(0, selectedTableSize - roomPlayers.length) }).map(
                    (_, index) => {
                      const seatNum = roomPlayers.length + index + 1;
                      return (
                        <View
                          key={`empty_${index}`}
                          style={[
                            styles.emptySlotCard,
                            {
                              backgroundColor: isDark ? '#0A140E' : '#F9FCFA',
                              borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#D0E0D6',
                            },
                          ]}
                        >
                          <View style={styles.emptySlotLeft}>
                            <Text style={styles.emptySlotIcon}>🪑</Text>
                            <View>
                              <Text style={[styles.emptySlotTitle, { color: isDark ? '#FFF' : '#1A2318' }]}>
                                Seat #{seatNum} (Open)
                              </Text>
                              <Text style={[styles.emptySlotSub, { color: isDark ? '#7A9182' : '#8CA093' }]}>
                                Waiting for friend or bot...
                              </Text>
                            </View>
                          </View>

                          <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.emptySlotAddBotBtn}
                            onPress={handleAddBotSlot}
                          >
                            <Text style={styles.emptySlotAddBotText}>+ Add Bot</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    },
                  )}
                </View>

                {/* Section: Invite Online Friends */}
                {friendsList.length > 0 && (
                  <View style={{ width: '100%', marginBottom: 18 }}>
                    <View style={styles.sectionHeader}>
                      <Text style={[styles.sectionTitle, { color: '#2ECC71' }]}>
                        INVITE ONLINE FRIENDS
                      </Text>
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
                          <Text style={styles.friendAvatar}>{f.avatar || '😎'}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.friendName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                              {f.name || f.username}
                            </Text>
                            <Text
                              style={[
                                styles.friendStatus,
                                { color: f.isOnline ? '#2ECC71' : '#7A9182' },
                              ]}
                            >
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
                              {isInvited ? 'INVITED ✓' : 'INVITE +'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Launch Match Button */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.startSearchBtn}
                  onPress={handleStartPrivateRoomMatch}
                >
                  <LinearGradient
                    colors={
                      roomPlayers.length >= 2
                        ? ['#27AE60', '#1E8449', '#145A32']
                        : ['#7F8C8D', '#515A5A', '#34495E']
                    }
                    style={styles.startSearchGradient}
                  >
                    <Text style={styles.startSearchBtnText}>
                      🎮 START UNO MATCH ({roomPlayers.length}/{selectedTableSize} PLAYERS)
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Leave / Close Room */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.leaveRoomBtn}
                  onPress={() => {
                    socketService.emit(SOCKET_EVENTS.LOBBY_LEAVE);
                    setIsRoomCreated(false);
                    showToast('Room Closed');
                  }}
                >
                  <Text style={styles.leaveRoomText}>✕ Close & Leave Room</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            /* ─── 3. JOIN ROOM VIEW ─── */
            <View style={styles.setupContainer}>
              <View style={styles.privateCard}>
                <Text style={styles.privateHeaderIcon}>🔑</Text>
                <Text style={styles.privateTitle}>Enter Uno Room Code</Text>
                <Text style={styles.privateSub}>
                  Type the room code shared by your friend to jump into their private lobby!
                </Text>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[
                      styles.codeInput,
                      {
                        color: isDark ? '#FFF' : '#1A2318',
                        borderColor: '#2ECC71',
                        backgroundColor: isDark ? '#101C14' : '#FFFFFF',
                      },
                    ]}
                    value={inputJoinCode}
                    onChangeText={setInputJoinCode}
                    placeholder="e.g. UNO-8492"
                    placeholderTextColor="#7A9182"
                    autoCapitalize="characters"
                    maxLength={10}
                  />

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.pasteBtn}
                    onPress={handlePasteCode}
                  >
                    <Text style={styles.pasteBtnText}>📋 Paste</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.startSearchBtn}
                  onPress={handleJoinByCode}
                >
                  <LinearGradient colors={['#27AE60', '#1E8449', '#145A32']} style={styles.startSearchGradient}>
                    <Text style={styles.startSearchBtnText}>🚀 JOIN UNO ROOM</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
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
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#E74C3C',
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontSize: 10,
    fontWeight: '600',
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
  capacityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  capacityCard: {
    width: (width - 32 - 16) / 3,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  capacityIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  capacityCountText: {
    fontSize: 11.5,
    fontWeight: '900',
    marginBottom: 2,
  },
  capacityDescText: {
    fontSize: 8.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  activePill: {
    marginTop: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activePillText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  timerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  timerCard: {
    flex: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  timerLabelText: {
    fontSize: 12,
    fontWeight: '800',
  },
  timerTagText: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 2,
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
    fontSize: 14,
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
  // Waiting Room Styles
  roomCodeBox: {
    width: '100%',
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2ECC71',
    marginBottom: 14,
  },
  roomCodeTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomCodeBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roomCodeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2ECC71',
  },
  roomCapacityBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F1C40F',
  },
  roomCodeLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#2ECC71',
    letterSpacing: 1,
    marginTop: 4,
  },
  roomCodeLarge: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F1C40F',
    letterSpacing: 4,
    marginVertical: 4,
  },
  roomCodeBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  roomActionBtn: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  roomActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  hostBotControlRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  addBotBtn: {
    flex: 1,
    backgroundColor: '#8E44AD',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBotBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptySlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptySlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptySlotIcon: {
    fontSize: 22,
    opacity: 0.6,
  },
  emptySlotTitle: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  emptySlotSub: {
    fontSize: 9.5,
    fontWeight: '500',
    marginTop: 1,
  },
  emptySlotAddBotBtn: {
    backgroundColor: 'rgba(142, 68, 173, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8E44AD',
  },
  emptySlotAddBotText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9B59B6',
  },
  removeSlotBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  removeSlotText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#E74C3C',
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
  leaveRoomBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  leaveRoomText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E74C3C',
  },
  // Join Room Card
  privateCard: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
  },
  privateHeaderIcon: {
    fontSize: 42,
    marginBottom: 8,
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
    marginBottom: 20,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 16,
  },
  codeInput: {
    width: '100%',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    letterSpacing: 3,
  },
  pasteBtn: {
    position: 'absolute',
    right: 12,
    top: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pasteBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  toastContainer: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastGradient: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2ECC71',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  toastText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default UnoLobbyScreen;
