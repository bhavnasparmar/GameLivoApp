import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { MultiplayerService } from '../../../../core/multiplayer/MultiplayerService';
import { GameAnalytics } from '../../../../core/analytics/GameAnalytics';
import { RoomPlayer } from '../../../../types/multiplayer';
import { useAppSelector } from '../../../../redux/hooks';

// ─── Types ────────────────────────────────────────────────────────────────────

type RouteParams = { isHost?: boolean; mode?: string; roomId?: string };

// ─── Screen ───────────────────────────────────────────────────────────────────

const ChidiyaLobbyScreen: React.FC = () => {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const { isDark } = useTheme();

  const { isHost = false, mode = 'quick', roomId: paramRoomId } = route.params ?? {};
  const userProfile = useAppSelector(s => s.user.profile);

  const [players, setPlayers]   = useState<RoomPlayer[]>([
    { userId: userProfile?.id ?? 'me', username: userProfile?.name ?? 'You',
      isReady: false, isHost: isHost, isConnected: true, seatIndex: 0 },
  ]);
  const [roomId, setRoomId]     = useState(paramRoomId ?? '');
  const [isReady, setIsReady]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  // ─── Setup room ────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const setupRoom = async () => {
      setLoading(true);
      try {
        if (isHost) {
          const room = await MultiplayerService.createRoom('chidiyaUdd', { maxPlayers: 8 });
          if (!cancelled) {
            setRoomId(room.roomId);
            setInviteCode(room.inviteCode ?? room.roomId.slice(0, 6).toUpperCase());
            setPlayers(room.players);
          }
        } else if (paramRoomId) {
          const room = await MultiplayerService.joinRoom(paramRoomId);
          if (!cancelled) { setPlayers(room.players); setRoomId(room.roomId); }
        }
      } catch {
        // Quick match: show mock players for demo
        if (!cancelled) {
          setRoomId('DEMO-' + Math.random().toString(36).slice(2, 6).toUpperCase());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setupRoom();

    // Subscribe to room events
    const unsubJoin   = MultiplayerService.onPlayerJoined(p => setPlayers(prev => [...prev, p]));
    const unsubLeft   = MultiplayerService.onPlayerLeft(({ userId }) =>
      setPlayers(prev => prev.filter(p => p.userId !== userId)));
    const unsubStatus = MultiplayerService.onRoomStatus(status => {
      if (status === 'in_progress') navigateToGame();
    });

    return () => {
      cancelled = true;
      unsubJoin();
      unsubLeft();
      unsubStatus();
    };
  }, [isHost, paramRoomId]);

  const navigateToGame = useCallback(() => {
    try {
      navigation.replace(ROUTES.CHIDIYA_GAME, { roomId });
    } catch {
      navigation.replace('ChidiyaGame', { roomId });
    }
  }, [navigation, roomId]);

  const handleReady = () => {
    MultiplayerService.setReady(true);
    setIsReady(true);
    setPlayers(prev => prev.map(p =>
      p.userId === (userProfile?.id ?? 'me') ? { ...p, isReady: true } : p,
    ));
  };

  const handleStartGame = () => {
    // For demo: navigate directly
    navigateToGame();
  };

  const handleLeave = () => {
    Alert.alert('Leave Lobby?', 'Are you sure?', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          MultiplayerService.leaveRoom(roomId);
          navigation.goBack();
        },
      },
    ]);
  };

  const bg = isDark ? '#1A1408' : '#FFF8E7';
  const allReady = players.every(p => p.isReady) && players.length >= 2;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#F2B705', '#D49A00', '#A67200']}
        style={[styles.header, { paddingTop: Math.max(insets.top + 12, 32) }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={handleLeave}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🐦 Chidiya Udd</Text>
          <Text style={styles.headerSub}>
            {mode === 'private' ? `Room: ${inviteCode || roomId}` : 'Quick Match Lobby'}
          </Text>
        </View>
        {mode === 'private' && inviteCode ? (
          <View style={styles.inviteChip}>
            <Text style={styles.inviteText}>🔗 {inviteCode}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <View style={[styles.body, { paddingBottom: insets.bottom + 16 }]}>
        {loading ? (
          <ActivityIndicator color="#F2B705" size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: isDark ? '#CCC' : '#555' }]}>
              Players ({players.length}/8)
            </Text>

            <FlatList
              data={players}
              keyExtractor={p => p.userId}
              style={styles.playerList}
              renderItem={({ item }) => (
                <LinearGradient
                  colors={isDark ? ['#222', '#1A1408'] : ['#FFF3CC', '#FFF']}
                  style={styles.playerRow}
                >
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>
                      {item.username.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.playerName, { color: isDark ? '#FFF' : '#2B1C04' }]}>
                      {item.username} {item.isHost ? '👑' : ''}
                    </Text>
                    <Text style={[styles.playerStatus, { color: isDark ? '#888' : '#666' }]}>
                      {item.isReady ? '✅ Ready' : 'Waiting…'}
                    </Text>
                  </View>
                  {item.isConnected && <View style={styles.connectedDot} />}
                </LinearGradient>
              )}
            />
          </>
        )}

        {/* CTA Buttons */}
        <View style={styles.ctaRow}>
          {isHost ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleStartGame}
              disabled={players.length < 2}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={players.length >= 2 ? ['#F2B705', '#D49A00'] : ['#444', '#333']}
                style={styles.ctaBtn}
              >
                <Text style={[styles.ctaBtnText, players.length < 2 && { color: '#666' }]}>
                  ▶ Start Game
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleReady}
              disabled={isReady}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={isReady ? ['#1F9D55', '#0D5230'] : ['#F2B705', '#D49A00']}
                style={styles.ctaBtn}
              >
                <Text style={styles.ctaBtnText}>{isReady ? '✅ Ready!' : 'I\'m Ready'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default ChidiyaLobbyScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 18, paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    alignItems: 'center',
    shadowColor: '#F2B705', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  backBtn: { position: 'absolute', left: 16, top: 48, padding: 8 },
  backBtnText: { fontSize: 22, color: '#2B1C04', fontWeight: '800' },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#2B1C04' },
  headerSub: { fontSize: 11.5, color: 'rgba(43,28,4,0.7)', marginTop: 2 },
  inviteChip: {
    position: 'absolute', right: 16, top: 52,
    backgroundColor: 'rgba(43,28,4,0.12)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  inviteText: { fontSize: 11, fontWeight: '800', color: '#2B1C04' },
  body: { flex: 1, padding: 18 },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 },
  playerList: { flex: 1 },
  playerRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 12, marginBottom: 8, gap: 12,
  },
  playerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#F2B705', alignItems: 'center', justifyContent: 'center',
  },
  playerAvatarText: { fontSize: 14, fontWeight: '900', color: '#2B1C04' },
  playerName: { fontSize: 14, fontWeight: '700' },
  playerStatus: { fontSize: 12, marginTop: 2 },
  connectedDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#4BD07A',
  },
  ctaRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  ctaBtn: {
    borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaBtnText: { fontSize: 16, fontWeight: '900', color: '#2B1C04' },
});
