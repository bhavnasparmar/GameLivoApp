import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { useAppSelector } from '../../../../redux/hooks';

export const UnoLobbyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const isHost = route.params?.isHost || false;
  const mode = route.params?.mode || 'private';

  const userProfile = useAppSelector((state) => state.user.profile);
  const playerName = userProfile?.name || userProfile?.username || 'Player 1';

  const [roomCode, setRoomCode] = useState(isHost ? 'UNO-8492' : '');

  const handleStartLobbyMatch = () => {
    navigation.navigate(ROUTES.UNO_GAME, {
      matchId: `uno_room_${roomCode || Date.now()}`,
      mode: 'random',
      difficulty: 'medium',
      playerCount: 4,
      player1Name: playerName,
      player2Name: 'Online Player 2',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#080E0B' : '#F2F8F4' }]}>
      <StatusBar barStyle="light-content" />

      {/* App Bar */}
      <LinearGradient
        colors={['#C0392B', '#922B21', '#641E16']}
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
          <Text style={styles.appBarTitle}>
            {mode === 'random' ? 'ONLINE MATCHMAKING' : 'UNO ROOM LOBBY'}
          </Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {mode === 'random' ? (
          <View style={styles.matchmakingCard}>
            <Text style={styles.spinnerEmoji}>⚡</Text>
            <Text style={styles.mmTitle}>Finding Opponents...</Text>
            <Text style={styles.mmSub}>Matching you with players of similar rating</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.actionBtn}
              onPress={handleStartLobbyMatch}
            >
              <LinearGradient
                colors={['#E74C3C', '#C0392B']}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>JOIN MATCH (4P TABLE)</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.roomCard}>
            <Text style={styles.roomIcon}>🔒</Text>
            <Text style={styles.roomTitle}>
              {isHost ? 'Your Private Room Code' : 'Enter Room Code'}
            </Text>

            {isHost ? (
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{roomCode}</Text>
              </View>
            ) : (
              <TextInput
                style={[
                  styles.codeInput,
                  {
                    color: isDark ? '#FFF' : '#1A2318',
                    borderColor: '#E74C3C',
                  },
                ]}
                value={roomCode}
                onChangeText={setRoomCode}
                placeholder="e.g. UNO-8492"
                placeholderTextColor="#7A9182"
                autoCapitalize="characters"
              />
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.actionBtn}
              onPress={handleStartLobbyMatch}
            >
              <LinearGradient
                colors={['#E74C3C', '#C0392B']}
                style={styles.btnGradient}
              >
                <Text style={styles.btnText}>
                  {isHost ? 'START ROOM MATCH' : 'JOIN ROOM'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
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
  appBarTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchmakingCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 30, 24, 0.9)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  spinnerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  mmTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  mmSub: {
    fontSize: 12,
    color: '#8CA093',
    textAlign: 'center',
    marginBottom: 24,
  },
  roomCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 30, 24, 0.9)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  roomIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  codeBox: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E74C3C',
    marginBottom: 20,
  },
  codeText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F1C40F',
    letterSpacing: 3,
  },
  codeInput: {
    width: '100%',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 20,
  },
  actionBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});

export default UnoLobbyScreen;
