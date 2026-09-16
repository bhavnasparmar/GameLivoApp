import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { UnoActiveColor, UnoCard } from '../../../../gameEngine/uno/unoTypes';
import { UnoRules } from '../../../../gameEngine/uno/unoRules';
import UnoCardView from './UnoCardView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface UnoHandViewProps {
  hand: UnoCard[];
  topCard: UnoCard;
  activeColor: UnoActiveColor;
  isMyTurn: boolean;
  isDrawPhase: boolean;
  drawnCardId?: string;
  onCardPress: (card: UnoCard) => void;
  disabled?: boolean;
}

export const UnoHandView: React.FC<UnoHandViewProps> = ({
  hand,
  topCard,
  activeColor,
  isMyTurn,
  isDrawPhase,
  drawnCardId,
  onCardPress,
  disabled = false,
}) => {
  const total = hand.length;
  const isFewCards = total <= 4;

  // Responsive overlap calculation based on screen width and card count
  const calculateCardLayout = (index: number) => {
    const mid = (total - 1) / 2;
    const offsetFromMid = index - mid;

    let rotationDeg = 0;
    let yOffset = 0;
    let marginLeft = 0;

    if (total === 1) {
      rotationDeg = 0;
      yOffset = 0;
      marginLeft = 0;
    } else if (total === 2) {
      rotationDeg = index === 0 ? -5 : 5;
      yOffset = 2;
      marginLeft = index === 0 ? 0 : -12;
    } else if (total === 3) {
      rotationDeg = index === 0 ? -8 : index === 1 ? 0 : 8;
      yOffset = index === 1 ? -4 : 3;
      marginLeft = index === 0 ? 0 : -16;
    } else if (total === 4) {
      rotationDeg = offsetFromMid * 5;
      yOffset = Math.abs(offsetFromMid) * 2.5;
      marginLeft = index === 0 ? 0 : -20;
    } else {
      // 5+ cards: Responsive overlap & parabolic fan
      const maxAngle = Math.min(18, Math.max(10, 40 / Math.sqrt(total)));
      rotationDeg = Math.max(-18, Math.min(18, (offsetFromMid / Math.max(1, mid)) * maxAngle));
      yOffset = Math.abs(offsetFromMid) * 2.8;

      // Calculate dynamic overlap to fit nicely
      const baseOverlap = Math.min(-22, Math.max(-36, -Math.round(20 + total * 1.4)));
      marginLeft = index === 0 ? 0 : baseOverlap;
    }

    return { rotationDeg, yOffset, marginLeft };
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isFewCards && styles.scrollContentCentered,
        ]}
      >
        {hand.map((card, index) => {
          let isPlayable = false;
          if (isMyTurn && !disabled) {
            if (isDrawPhase) {
              isPlayable = card.id === drawnCardId && UnoRules.canPlayCard(topCard, activeColor, card);
            } else {
              isPlayable = UnoRules.canPlayCard(topCard, activeColor, card);
            }
          }

          const { rotationDeg, yOffset, marginLeft } = calculateCardLayout(index);

          return (
            <View
              key={card.id}
              style={[
                styles.cardWrapper,
                { marginLeft },
                {
                  transform: [
                    { rotate: `${rotationDeg}deg` },
                    { translateY: isPlayable ? yOffset - 12 : yOffset },
                  ],
                  zIndex: isPlayable ? 60 + index : 10 + index,
                },
              ]}
            >
              <UnoCardView
                card={card}
                size="hand"
                isPlayable={isPlayable}
                onPress={() => onCardPress(card)}
                disabled={!isPlayable || disabled}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    height: 120,
  },
  scrollContentCentered: {
    justifyContent: 'center',
    flexGrow: 1,
  },
  cardWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
});

export default UnoHandView;
