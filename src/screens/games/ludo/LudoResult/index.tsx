import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { useAppSelector } from '../../../../redux/hooks';
import { LudoGameState } from '../../../../gameEngine/ludo/ludoTypes';
import { LUDO_COLOR_THEMES } from '../../../../gameEngine/ludo/ludoConstants';
import { soundService } from '../../../../services/sound/soundService';

const { width } = Dimensions.get('window');

export const LudoResultScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const currentUserId = useAppSelector((state) => state.auth.userId) || 'player_me';

  const matchId = route.params?.matchId || 'LUDO-MATCH';
  const gameState: LudoGameState | undefined = route.params?.gameState;
  const winnerId = route.params?.winnerId || gameState?.winnerId;

  const winner = gameState?.players.find((p) => p.id === winnerId) || gameState?.players[0];
  const isUserWinner = winner?.id === currentUserId || (!winner?.isBot && winner?.name === 'You');

  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    soundService.play(isUserWinner ? 'game_win' : 'game_lose');

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isUserWinner]);

  // Rank ordered players list
  const rankedPlayers = React.useMemo(() => {
    if (!gameState?.players) return [];
    return [...gameState.players].sort((a, b) => {
      const rankA = a.rank || 99;
      const rankB = b.rank || 99;
      return rankA - rankB;
    });
  }, [gameState]);

  const xpEarned = isUserWinner ? 120 : 35;

  const handlePlayAgain = () => {
    navigation.replace(ROUTES.LUDO_MODE, {
      initialMode: gameState?.mode === 'computer' ? 'computer' : 'private',
    });
  };

  const handleGoHome = () => {
    navigation.navigate(ROUTES.LUDO_HOME);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#08120D' : '#F2F8F4' }]}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <LinearGradient
        colors={['#1E272E', '#2C3E50', '#17202A']}
        style={[styles.headerBar, { paddingTop: Math.max(insets.top + 8, 26) }]}
      >
        <Text style={styles.headerTitle}>MATCH RESULTS</Text>
        <Text style={styles.matchIdSub}>#{matchId}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Victory Celebration Card */}
        <Animated.View
          style={[
            styles.celebrationCard,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={
              isUserWinner
                ? ['#F1C40F', '#D4AC0D', '#B7950B']
                : ['#34495E', '#2C3E50', '#1A252F']
            }
            style={styles.celebrationGrad}
          >
            <Text style={styles.trophyEmoji}>
              {isUserWinner ? '🏆' : '🎖️'}
            </Text>
            <Text style={styles.congratsTitle}>
              {isUserWinner ? 'VICTORY!' : `${winner?.name || 'Player'} Won!`}
            </Text>
            <Text style={styles.congratsSub}>
              {isUserWinner
                ? 'You are the champion of the board!'
                : 'Great match! Better luck next time.'}
            </Text>

            {/* XP Reward Badge */}
            <View style={styles.rewardPillsRow}>
              <View style={[styles.rewardPill, { backgroundColor: 'rgba(52, 152, 219, 0.35)' }]}>
                <Text style={styles.rewardEmoji}>⚡</Text>
                <Text style={[styles.rewardText, { color: '#FFFFFF' }]}>
                  +{xpEarned} XP Earned
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Final Standings / Leaderboard (1st to 6th) */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#1A252F' }]}>
          Final Standings
        </Text>

        <View style={styles.standingsCard}>
          {rankedPlayers.map((player, idx) => {
            const theme = LUDO_COLOR_THEMES[player.color];
            const rank = player.rank || idx + 1;
            const isMe = player.id === currentUserId || (!player.isBot && player.name === 'You');

            return (
              <View
                key={player.id}
                style={[
                  styles.standingRow,
                  isMe && styles.myStandingRow,
                  idx < rankedPlayers.length - 1 && styles.rowDivider,
                ]}
              >
                {/* Rank Badge */}
                <View
                  style={[
                    styles.rankBadge,
                    rank === 1
                      ? { backgroundColor: '#F1C40F' }
                      : rank === 2
                      ? { backgroundColor: '#BDC3C7' }
                      : rank === 3
                      ? { backgroundColor: '#E67E22' }
                      : { backgroundColor: 'rgba(255,255,255,0.1)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.rankText,
                      rank <= 3 ? { color: '#000000' } : { color: '#FFFFFF' },
                    ]}
                  >
                    #{rank}
                  </Text>
                </View>

                {/* Avatar with Color Indicator */}
                <View style={[styles.playerAvatarRing, { borderColor: theme.primary }]}>
                  <Text style={styles.avatarText}>{player.avatar}</Text>
                </View>

                {/* Name & Theme */}
                <View style={styles.playerMeta}>
                  <View style={styles.nameRow}>
                    <Text style={styles.standingName}>{player.name}</Text>
                    {isMe && <Text style={styles.youBadge}>(You)</Text>}
                  </View>
                  <Text style={styles.themeBadgeText}>
                    {theme.badge} {theme.name}
                  </Text>
                </View>

                {/* Status / Win Badge */}
                <View style={styles.statusCol}>
                  {rank === 1 ? (
                    <View style={styles.winnerPill}>
                      <Text style={styles.winnerPillText}>WINNER 👑</Text>
                    </View>
                  ) : (
                    <Text style={styles.tokensFinishedText}>
                      {player.tokens.filter((t) => t.status === 'finished').length}/4 Home
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Action Buttons: Rematch & Lobby */}
        <View style={styles.actionButtonsCol}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.playAgainBtn}
            onPress={handlePlayAgain}
          >
            <LinearGradient
              colors={['#E74C3C', '#C0392B', '#922B21']}
              style={styles.btnGrad}
            >
              <Text style={styles.playAgainText}>PLAY AGAIN 🔄</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.homeBtn}
            onPress={handleGoHome}
          >
            <Text style={styles.homeBtnText}>Return to Ludo Lobby 🏠</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  matchIdSub: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  celebrationCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  celebrationGrad: {
    padding: 22,
    alignItems: 'center',
  },
  trophyEmoji: {
    fontSize: 56,
    marginBottom: 6,
  },
  congratsTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  congratsSub: {
    fontSize: 13,
    color: '#ECF0F1',
    textAlign: 'center',
    marginBottom: 16,
  },
  rewardPillsRow: {
    flexDirection: 'row',
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  rewardEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  rewardText: {
    fontWeight: '900',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  standingsCard: {
    backgroundColor: '#1E272E',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  standingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  myStandingRow: {
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: {
    fontWeight: '900',
    fontSize: 13,
  },
  playerAvatarRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    backgroundColor: '#2C3E50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 20,
  },
  playerMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  standingName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginRight: 4,
  },
  youBadge: {
    color: '#E74C3C',
    fontSize: 12,
    fontWeight: '800',
  },
  themeBadgeText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  winnerPill: {
    backgroundColor: 'rgba(241, 196, 15, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1C40F',
  },
  winnerPillText: {
    color: '#F1C40F',
    fontWeight: '900',
    fontSize: 10,
  },
  tokensFinishedText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionButtonsCol: {
    marginTop: 4,
  },
  playAgainBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  btnGrad: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playAgainText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  homeBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  homeBtnText: {
    color: '#ECF0F1',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default LudoResultScreen;
