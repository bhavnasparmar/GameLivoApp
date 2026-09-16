import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { UnoGameState, UnoPlayer } from '../../../../gameEngine/uno/unoTypes';
import { UnoRules } from '../../../../gameEngine/uno/unoRules';
import { useAppSelector } from '../../../../redux/hooks';

const { width } = Dimensions.get('window');

export const UnoResultScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const currentUserId = useAppSelector((state) => state.auth.userId) || 'player_me';

  const gameState: UnoGameState = route.params?.gameState;
  const winnerId: string = route.params?.winnerId || gameState?.winnerId || '';
  const mode = route.params?.mode || gameState?.mode || 'computer';
  const difficulty = route.params?.difficulty || gameState?.difficulty || 'medium';

  const players: UnoPlayer[] = gameState?.players || [];
  const winner = players.find((p) => p.id === winnerId) || players[0];
  const isMeWinner = winner?.id === currentUserId || winner?.id === 'p1';

  // Calculate points gained
  const pointsWon = gameState ? UnoRules.calculateWinnerPoints(players, winnerId) : 120;
  const coinsEarned = isMeWinner ? 250 : 50;

  const handleRematch = () => {
    navigation.replace(ROUTES.UNO_GAME, {
      matchId: `uno_${Date.now()}`,
      mode,
      difficulty,
      playerCount: players.length,
      player1Name: players[0]?.name,
      player2Name: players[1]?.name,
    });
  };

  const handleReturnHome = () => {
    navigation.navigate(ROUTES.UNO_HOME);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#060D09' : '#F0F7F2' }]}>
      <StatusBar barStyle="light-content" />

      {/* Top App Bar */}
      <LinearGradient
        colors={isMeWinner ? ['#27AE60', '#1E8449', '#145A32'] : ['#C0392B', '#922B21', '#641E16']}
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 8, 26) }]}
      >
        <Text style={styles.appBarTitle}>MATCH RESULTS</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Victory/Defeat Hero Card */}
        <LinearGradient
          colors={
            isMeWinner
              ? ['#2ECC71', '#27AE60', '#1E8449']
              : ['#E74C3C', '#C0392B', '#781515']
          }
          style={styles.heroCard}
        >
          <View style={styles.trophyCircle}>
            <Text style={styles.trophyEmoji}>{isMeWinner ? '🏆' : '🥈'}</Text>
          </View>

          <Text style={styles.winnerHeadline}>
            {isMeWinner ? 'VICTORY! YOU WON!' : `${winner?.name || 'Opponent'} Won!`}
          </Text>

          <Text style={styles.pointsSub}>
            +{pointsWon} Points Scored from Opponents' Hands
          </Text>

          {/* Reward Pill */}
          <View style={styles.rewardPill}>
            <Text style={styles.coinEmoji}>🪙</Text>
            <Text style={styles.rewardText}>+{coinsEarned} Coins Earned</Text>
          </View>
        </LinearGradient>

        {/* Players Standings Breakdown Table */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PLAYERS BREAKDOWN</Text>
        </View>

        <View style={styles.standingsCol}>
          {players.map((player, idx) => {
            const isPlayerWinner = player.id === winnerId;
            const penaltyScore = UnoRules.calculateHandScore(player.hand);

            return (
              <View
                key={player.id}
                style={[
                  styles.playerRowCard,
                  {
                    backgroundColor: isDark ? '#121D16' : '#FFFFFF',
                    borderColor: isPlayerWinner ? '#2ECC71' : isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
                  },
                  isPlayerWinner && styles.winnerRowGlow,
                ]}
              >
                <View style={styles.playerRowLeft}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{idx + 1}</Text>
                  </View>
                  <Text style={styles.avatarEmoji}>{player.avatar || (player.isBot ? '🤖' : '😎')}</Text>
                  <View>
                    <View style={styles.nameRow}>
                      <Text style={[styles.playerName, { color: isDark ? '#FFF' : '#1A2318' }]}>
                        {player.name}
                      </Text>
                      {isPlayerWinner && (
                        <View style={styles.winnerBadge}>
                          <Text style={styles.winnerBadgeText}>WINNER</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardsLeftText}>
                      {isPlayerWinner ? '0 cards remaining' : `${player.hand.length} cards left`}
                    </Text>
                  </View>
                </View>

                <View style={styles.playerRowRight}>
                  <Text
                    style={[
                      styles.scoreNumber,
                      { color: isPlayerWinner ? '#2ECC71' : '#E74C3C' },
                    ]}
                  >
                    {isPlayerWinner ? `+${pointsWon} pts` : `-${penaltyScore} pts`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Footer Actions */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.rematchBtn}
          onPress={handleRematch}
        >
          <LinearGradient
            colors={['#F1C40F', '#F39C12', '#D35400']}
            style={styles.btnGradient}
          >
            <Text style={styles.rematchBtnText}>⚡ PLAY AGAIN (REMATCH)</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.homeBtn}
          onPress={handleReturnHome}
        >
          <Text style={styles.homeBtnText}>Return to Game Hub</Text>
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
    paddingBottom: 14,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  appBarTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  content: {
    padding: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  trophyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  trophyEmoji: {
    fontSize: 40,
  },
  winnerHeadline: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pointsSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    marginBottom: 14,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  coinEmoji: {
    fontSize: 16,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFD700',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#E74C3C',
    letterSpacing: 1,
  },
  standingsCol: {
    gap: 10,
  },
  playerRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  winnerRowGlow: {
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  playerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankBadge: {
    width: 24,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#A0B2A6',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '800',
  },
  winnerBadge: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  winnerBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2ECC71',
  },
  cardsLeftText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A9182',
    marginTop: 2,
  },
  playerRowRight: {
    alignItems: 'flex-end',
  },
  scoreNumber: {
    fontSize: 14,
    fontWeight: '900',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(10, 18, 14, 0.95)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  rematchBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rematchBtnText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#1C1204',
    letterSpacing: 0.8,
  },
  homeBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  homeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A0B2A6',
  },
});

export default UnoResultScreen;
