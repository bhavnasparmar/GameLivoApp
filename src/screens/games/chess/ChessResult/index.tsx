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
import { ChessGameState } from '../../../../gameEngine/chess/chessTypes';

const { width } = Dimensions.get('window');

export const ChessResultScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useTheme();

  const gameState: ChessGameState = route.params?.gameState || {};
  const mode = route.params?.mode || 'computer';
  const difficulty = route.params?.difficulty || 'medium';

  const isDraw = gameState.winner === 'draw';
  const isWhiteWin = gameState.winner === 'white';
  const isPlayerWin = isWhiteWin; // Player is always White in computer/random modes

  const handleRematch = () => {
    navigation.replace(ROUTES.CHESS_GAME, {
      matchId: `rematch_${Date.now()}`,
      mode,
      difficulty,
    });
  };

  const handleGoHome = () => {
    navigation.navigate(ROUTES.GAME_HUB);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#08100C' : '#F2F7F4' }]}>
      <StatusBar barStyle="light-content" />

      {/* Top Banner Gradient */}
      <LinearGradient
        colors={
          isPlayerWin
            ? ['#1F9D55', '#0D5230', '#08100C']
            : isDraw
            ? ['#2668D9', '#123A80', '#08100C']
            : ['#8F1D13', '#4A110B', '#08100C']
        }
        style={[styles.headerBanner, { paddingTop: Math.max(insets.top + 20, 44) }]}
      >
        <Text style={styles.trophyIcon}>
          {isPlayerWin ? '👑' : isDraw ? '🤝' : '⚔️'}
        </Text>
        <Text style={styles.outcomeTitle}>
          {isPlayerWin ? 'VICTORY!' : isDraw ? 'DRAW MATCH' : 'DEFEAT'}
        </Text>
        <Text style={styles.outcomeSub}>
          {gameState.winReason || (isPlayerWin ? 'You won by Checkmate!' : 'Game Over')}
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Rewards & Rating Gain Card */}
        <LinearGradient
          colors={isDark ? ['#202A22', '#121A14'] : ['#FFFFFF', '#EDF5F0']}
          style={[
            styles.rewardCard,
            { borderColor: isDark ? 'rgba(212,160,23,0.3)' : '#D0E5D8' },
          ]}
        >
          <Text style={[styles.cardHeader, { color: isDark ? '#F0C64A' : '#A6740C' }]}>
            MATCH REWARDS & RATING
          </Text>

          <View style={styles.rewardsRow}>
            {/* Rating Box */}
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>🏆</Text>
              <Text style={[styles.rewardVal, { color: '#5CF27A' }]}>
                {isPlayerWin ? '+18' : isDraw ? '+2' : '-12'} ELO
              </Text>
              <Text style={styles.rewardLabel}>Rating (1,438)</Text>
            </View>

            <View style={styles.rewardDivider} />

            {/* Coins Box */}
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>🪙</Text>
              <Text style={[styles.rewardVal, { color: '#F0C64A' }]}>
                {isPlayerWin ? '+250' : isDraw ? '+50' : '+15'}
              </Text>
              <Text style={styles.rewardLabel}>Coins Earned</Text>
            </View>

            <View style={styles.rewardDivider} />

            {/* XP Box */}
            <View style={styles.rewardItem}>
              <Text style={styles.rewardIcon}>⚡</Text>
              <Text style={[styles.rewardVal, { color: '#68B8FF' }]}>
                {isPlayerWin ? '+120' : '+40'} XP
              </Text>
              <Text style={styles.rewardLabel}>Player Level</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Match Breakdown Stats */}
        <View
          style={[
            styles.breakdownCard,
            {
              backgroundColor: isDark ? '#111713' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E6EFEA',
            },
          ]}
        >
          <Text style={[styles.cardHeader, { color: isDark ? '#B4C5BB' : '#5C7A6A' }]}>
            GAMEPLAY SUMMARY
          </Text>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
              Game Mode
            </Text>
            <Text style={[styles.summaryVal, { color: isDark ? '#FFF' : '#1A2318' }]}>
              {mode === 'computer' ? `VS AI Bot (${difficulty})` : '1v1 Match'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
              Total Moves
            </Text>
            <Text style={[styles.summaryVal, { color: isDark ? '#FFF' : '#1A2318' }]}>
              {gameState.moveHistory?.length || 0} moves
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
              Ending Reason
            </Text>
            <Text style={[styles.summaryVal, { color: '#F0C64A' }]}>
              {gameState.gameStatus?.toUpperCase() || 'COMPLETED'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
              Captured Pieces
            </Text>
            <Text style={[styles.summaryVal, { color: isDark ? '#FFF' : '#1A2318' }]}>
              {gameState.capturedPieces?.white?.length || 0} White ·{' '}
              {gameState.capturedPieces?.black?.length || 0} Black
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsCol}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.rematchBtn}
            onPress={handleRematch}
          >
            <LinearGradient
              colors={['#F0C64A', '#D4A017', '#9C6C0C']}
              style={styles.btnGradient}
            >
              <Text style={styles.rematchText}>🔄 Play Rematch</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: isDark ? '#16221A' : '#E8F3EC',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#C8DED0',
              },
            ]}
            onPress={() => navigation.navigate(ROUTES.CHESS_HOME)}
          >
            <Text style={[styles.secondaryText, { color: isDark ? '#F1F4F7' : '#1A2318' }]}>
              🎮 Change Mode
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: isDark ? '#141A16' : '#F5F5F5',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E0E0E0',
              },
            ]}
            onPress={handleGoHome}
          >
            <Text style={[styles.secondaryText, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
              🏠 Back to Game Hub
            </Text>
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
  headerBanner: {
    alignItems: 'center',
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  trophyIcon: {
    fontSize: 54,
    marginBottom: 8,
  },
  outcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  outcomeSub: {
    fontSize: 13.5,
    color: '#DCE8DF',
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  rewardCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    marginTop: -16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 14,
    textAlign: 'center',
  },
  rewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  rewardVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  rewardLabel: {
    fontSize: 10.5,
    color: '#7A9485',
    fontWeight: '700',
    marginTop: 2,
  },
  rewardDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  breakdownCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  summaryKey: {
    fontSize: 13,
  },
  summaryVal: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  actionButtonsCol: {
    gap: 12,
  },
  rematchBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  btnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rematchText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2B1C04',
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  secondaryText: {
    fontSize: 14.5,
    fontWeight: '800',
  },
});

export default ChessResultScreen;
