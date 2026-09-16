import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { UnoPlayer } from '../../../../gameEngine/uno/unoTypes';
import UnoCardView from './UnoCardView';

interface UnoOpponentHandProps {
  player: UnoPlayer;
  isCurrentTurn: boolean;
  position?: 'top' | 'left' | 'right';
  onCatchUno?: (playerId: string) => void;
  canCatchUno?: boolean;
}

export const UnoOpponentHand: React.FC<UnoOpponentHandProps> = ({
  player,
  isCurrentTurn,
  position = 'top',
  onCatchUno,
  canCatchUno = false,
}) => {
  // Show up to 6 visual card backs in the fan stack
  const visibleCardsCount = Math.min(6, Math.max(1, player.hand.length));
  const dummyCards = Array.from({ length: visibleCardsCount });

  const isVertical = position === 'left' || position === 'right';

  return (
    <View
      style={[
        styles.container,
        position === 'top' && styles.topLayout,
        position === 'left' && styles.leftLayout,
        position === 'right' && styles.rightLayout,
      ]}
    >
      {/* Player Header Avatar Bar */}
      <View
        style={[
          styles.playerInfoCard,
          isCurrentTurn && styles.activePlayerCardGlow,
        ]}
      >
        <LinearGradient
          colors={
            isCurrentTurn
              ? ['#F1C40F', '#D35400']
              : ['#2C3E50', '#1A252F']
          }
          style={styles.avatarCircle}
        >
          <Text style={styles.avatarText}>{player.avatar || '🤖'}</Text>
        </LinearGradient>

        <View style={styles.nameBlock}>
          <Text style={styles.playerNameText} numberOfLines={1}>
            {player.name}
          </Text>
          <Text style={styles.cardCountText}>
            {player.hand.length} {player.hand.length === 1 ? 'card' : 'cards'}
          </Text>
        </View>

        {/* UNO Called / Warning Badge */}
        {player.hand.length === 1 && (
          <View
            style={[
              styles.unoTag,
              player.hasCalledUno ? styles.unoCalledTag : styles.unoVulnerableTag,
            ]}
          >
            <Text style={styles.unoTagText}>
              {player.hasCalledUno ? 'UNO! 🔥' : 'NO UNO ⚠️'}
            </Text>
          </View>
        )}
      </View>

      {/* Opponent Card Stack */}
      <View
        style={[
          styles.cardsStack,
          isVertical ? styles.verticalStack : styles.horizontalStack,
        ]}
      >
        {dummyCards.map((_, idx) => (
          <View
            key={`opp_card_${idx}`}
            style={[
              styles.cardStackItem,
              !isVertical && { marginLeft: idx === 0 ? 0 : -28 },
              isVertical && { marginTop: idx === 0 ? 0 : -32 },
            ]}
          >
            <UnoCardView isBack size="small" />
          </View>
        ))}
      </View>

      {/* Catch Uno Button (Appears if opponent holds 1 card without shouting UNO!) */}
      {canCatchUno && onCatchUno && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.catchUnoBtn}
          onPress={() => onCatchUno(player.id)}
        >
          <LinearGradient
            colors={['#E74C3C', '#C0392B']}
            style={styles.catchUnoGradient}
          >
            <Text style={styles.catchUnoBtnText}>⚡ CATCH UNO!</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  topLayout: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  leftLayout: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  rightLayout: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  playerInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 19, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    gap: 8,
    marginBottom: 6,
  },
  activePlayerCardGlow: {
    borderColor: '#F1C40F',
    shadowColor: '#F1C40F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  nameBlock: {
    maxWidth: 90,
  },
  playerNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A2B4A7',
  },
  unoTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unoCalledTag: {
    backgroundColor: 'rgba(230, 57, 70, 0.3)',
    borderColor: '#E63946',
    borderWidth: 1,
  },
  unoVulnerableTag: {
    backgroundColor: 'rgba(241, 196, 15, 0.3)',
    borderColor: '#F1C40F',
    borderWidth: 1,
  },
  unoTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardsStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalStack: {
    flexDirection: 'row',
  },
  verticalStack: {
    flexDirection: 'column',
  },
  cardStackItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  catchUnoBtn: {
    marginTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  catchUnoGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catchUnoBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export default UnoOpponentHand;
