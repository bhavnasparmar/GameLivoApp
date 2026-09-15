import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { socketService } from '../../../../services/socket/socketService';
import { SOCKET_EVENTS } from '../../../../constants/socketConstants';
import { useAppSelector } from '../../../../redux/hooks';

const { width } = Dimensions.get('window');

const SEARCH_STATUS_MESSAGES = [
  'Searching for Grandmaster Opponents...',
  'Connecting to GameLivo Chess Arena...',
  'Matching with similar ELO (1400 - 1450)...',
  'Setting up 1v1 Clock & Board...',
];

export const ChessLobbyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const currentUserId = useAppSelector((state) => state.auth.userId) || 'guest_me';
  const username = userProfile?.username || 'You';

  const isHost = route.params?.isHost ?? true;
  const mode = route.params?.mode || 'random'; // 'private' or 'random'

  const [roomCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [selectedTime, setSelectedTime] = useState(300); // 5 min
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMsgIndex, setStatusMsgIndex] = useState(0);

  // Matchmaking State
  const [isSearching, setIsSearching] = useState(mode === 'random');
  const [matchFoundData, setMatchFoundData] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(3);

  // Animation values
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const matchFoundScale = useRef(new Animated.Value(0.8)).current;
  const matchFoundOpacity = useRef(new Animated.Value(0)).current;

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

  // Status message cycler & elapsed timer
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

  // Matchmaking Socket Handler
  useEffect(() => {
    if (mode !== 'random') return;

    let isMounted = true;

    const startMatchmaking = async () => {
      try {
        if (!socketService.isConnected()) {
          await socketService.connect();
        }

        // Join backend matchmaking queue
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

  // Match Found Countdown & Navigation Trigger
  useEffect(() => {
    if (!matchFoundData) return;

    if (countdown > 0) {
      const cdTimer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(cdTimer);
    }

    // Determine user's color
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
  }, [matchFoundData, countdown, currentUserId, username, navigation, selectedTime]);

  const handleCancel = () => {
    socketService.emit(SOCKET_EVENTS.MATCH_QUEUE_LEAVE, { gameId: 'chess' });
    navigation.goBack();
  };

  const handleStartPrivateMatch = () => {
    navigation.navigate(ROUTES.CHESS_GAME, {
      matchId: `match_${roomCode}`,
      mode: 'private',
      timeSeconds: selectedTime,
      myColor: 'white',
      whitePlayer: username,
      blackPlayer: 'Player 2',
    });
  };

  const handleCopyCode = () => {
    Alert.alert('Room Code Copied!', `Share code #${roomCode} with your friend.`);
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
            {mode === 'random' ? 'Quick Matchmaking' : `Chess Room #${roomCode}`}
          </Text>
          <View style={{ width: 38 }} />
        </View>
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
      ) : (
        /* Private Room / Play with Friends Screen */
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Room Code Card */}
          <View
            style={[
              styles.codeCard,
              {
                backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                borderColor: '#D4A017',
              },
            ]}
          >
            <Text style={[styles.codeLabel, { color: isDark ? '#F0C64A' : '#A6740C' }]}>
              ROOM CODE
            </Text>
            <Text style={styles.codeNumber}>#{roomCode}</Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.copyBtn} onPress={handleCopyCode}>
              <Text style={styles.copyBtnText}>📋 Copy & Share Code</Text>
            </TouchableOpacity>
          </View>

          {/* Players Slot Cards */}
          <Text style={[styles.sectionTitle, { color: isDark ? '#D4A017' : '#9E740C' }]}>
            PLAYERS (2/2)
          </Text>

          <View style={styles.playersCol}>
            {/* Player 1 (You) */}
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
                    {username} (White ♔)
                  </Text>
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>HOST</Text>
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

            {/* Player 2 (Friend) */}
            <View
              style={[
                styles.playerCard,
                {
                  backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
                },
              ]}
            >
              <LinearGradient colors={['#3A4452', '#1E2530']} style={styles.avatar}>
                <Text style={styles.avatarText}>P2</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.playerName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                  Friend / Guest (Black ♚)
                </Text>
                <Text style={[styles.playerSub, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                  Waiting to join...
                </Text>
              </View>
              <View style={[styles.readyPill, { backgroundColor: 'rgba(212,160,23,0.3)' }]}>
                <Text style={styles.readyText}>INVITED</Text>
              </View>
            </View>
          </View>

          {/* Match Time Setting */}
          <Text style={[styles.sectionTitle, { color: isDark ? '#D4A017' : '#9E740C', marginTop: 18 }]}>
            MATCH TIME
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
        </ScrollView>
      )}

      {/* Private Room Footer */}
      {mode === 'private' && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity activeOpacity={0.85} style={styles.startBtn} onPress={handleStartPrivateMatch}>
            <LinearGradient colors={['#F0C64A', '#D4A017', '#9C6C0C']} style={styles.startBtnGradient}>
              <Text style={styles.startBtnText}>⚔️ Start Match Now</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchFoundEmblem: {
    fontSize: 40,
    marginBottom: 6,
  },
  matchFoundHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  matchFoundCountdown: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D4F5DE',
    marginTop: 4,
  },
  statusBox: {
    alignItems: 'center',
    marginTop: 14,
  },
  timerBadge: {
    backgroundColor: 'rgba(212, 160, 23, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.4)',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F0C64A',
    fontVariant: ['tabular-nums'],
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  playersSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  playersCol: {
    gap: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
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
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  youBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#5CF27A',
  },
  playerSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  readyPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
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
    flex: 1,
    justifyContent: 'center',
  },
  radarSearchIcon: {
    fontSize: 18,
  },
  searchingText: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 4,
  },
  timeIcon: {
    fontSize: 16,
  },
  activeTimeBtn: {
    borderColor: '#D4A017',
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
  },
  timeBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  activeTimeBtnText: {
    color: '#F0C64A',
  },
  codeCard: {
    padding: 20,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  codeNumber: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F0C64A',
    marginVertical: 6,
    letterSpacing: 3,
  },
  copyBtn: {
    backgroundColor: 'rgba(212, 160, 23, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.4)',
  },
  copyBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#F0C64A',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(10, 18, 14, 0.94)',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cancelBtn: {
    backgroundColor: 'rgba(230, 72, 58, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(230, 72, 58, 0.35)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#E6483A',
  },
  startBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  startBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2B1C04',
    letterSpacing: 0.5,
  },
});

export default ChessLobbyScreen;
