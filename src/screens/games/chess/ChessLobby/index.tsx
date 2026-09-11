import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { CHESS_TIME_PRESETS } from '../../../../gameEngine/chess/chessConstants';

export const ChessLobbyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useTheme();

  const isHost = route.params?.isHost ?? true;
  const mode = route.params?.mode || 'private'; // 'private' or 'random'

  const [roomCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [selectedTime, setSelectedTime] = useState(300); // 5 min
  const [isReady, setIsReady] = useState(true);
  const [isSearching, setIsSearching] = useState(mode === 'random');
  const [opponent, setOpponent] = useState<{ name: string; rating: number; ready: boolean } | null>(
    mode === 'random' ? null : { name: 'Player 2 (Waiting...)', rating: 1350, ready: false },
  );

  useEffect(() => {
    if (mode === 'random') {
      const timer = setTimeout(() => {
        setIsSearching(false);
        setOpponent({ name: 'Vikram Singh', rating: 1410, ready: true });
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const handleStartMatch = () => {
    navigation.navigate(ROUTES.CHESS_GAME, {
      matchId: `match_${roomCode}`,
      mode: mode,
      timeSeconds: selectedTime,
      whitePlayer: 'You',
      blackPlayer: opponent?.name || 'Opponent',
    });
  };

  const handleCopyCode = () => {
    Alert.alert('Room Code Copied!', `Share code #${roomCode} with your friend.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A120E' : '#F4F9F5' }]}>
      <StatusBar barStyle="light-content" />

      {/* App Bar */}
      <LinearGradient
        colors={isDark ? ['#0F3628', '#0A2019', '#061611'] : ['#155A3F', '#0F4530', '#0B3323']}
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 10, 28) }]}
      >
        <View style={styles.appBarRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>
            {mode === 'random' ? 'Matchmaking Room' : `Chess Room #${roomCode}`}
          </Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Room Code Card (for Private Mode) */}
        {mode === 'private' && (
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
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.copyBtn}
              onPress={handleCopyCode}
            >
              <Text style={styles.copyBtnText}>📋 Copy & Share Code</Text>
            </TouchableOpacity>
          </View>
        )}

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
                  You (White ♔)
                </Text>
                <View style={styles.hostBadge}>
                  <Text style={styles.hostText}>HOST</Text>
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

          {/* Player 2 (Opponent) */}
          <View
            style={[
              styles.playerCard,
              {
                backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
              },
            ]}
          >
            {isSearching ? (
              <View style={styles.searchingRow}>
                <ActivityIndicator size="small" color="#D4A017" />
                <Text style={[styles.searchingText, { color: isDark ? '#F0C64A' : '#A6740C' }]}>
                  Finding opponent…
                </Text>
              </View>
            ) : (
              <>
                <LinearGradient colors={['#3A4452', '#1E2530']} style={styles.avatar}>
                  <Text style={styles.avatarText}>VS</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.playerName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                    {opponent?.name || 'Guest'} (Black ♚)
                  </Text>
                  <Text style={[styles.playerSub, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                    Rating: {opponent?.rating || 1200} ELO
                  </Text>
                </View>
                <View
                  style={[
                    styles.readyPill,
                    { backgroundColor: opponent?.ready ? '#1F9D55' : 'rgba(212,160,23,0.3)' },
                  ]}
                >
                  <Text style={styles.readyText}>
                    {opponent?.ready ? 'READY ✓' : 'JOINED'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Time Limit Setting */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#D4A017' : '#9E740C', marginTop: 16 }]}>
          MATCH TIME
        </Text>
        <View style={styles.timeRow}>
          {[
            { label: '3m Blitz', sec: 180 },
            { label: '5m Rapid', sec: 300 },
            { label: '10m Classic', sec: 600 },
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

      {/* Footer Start Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.startBtn}
          disabled={isSearching}
          onPress={handleStartMatch}
        >
          <LinearGradient
            colors={isSearching ? ['#555', '#333'] : ['#F0C64A', '#D4A017', '#9C6C0C']}
            style={styles.startBtnGradient}
          >
            <Text style={styles.startBtnText}>
              {isSearching ? '⏳ Finding Opponent...' : '⚔️ Start Match Now'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  content: {
    padding: 16,
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
  hostBadge: {
    backgroundColor: 'rgba(31, 157, 85, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  hostText: {
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
    paddingVertical: 8,
    flex: 1,
    justifyContent: 'center',
  },
  searchingText: {
    fontSize: 14,
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
  },
  activeTimeBtn: {
    borderColor: '#D4A017',
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
  },
  timeBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  activeTimeBtnText: {
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
