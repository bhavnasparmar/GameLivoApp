import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { UnoActiveColor, UnoCard } from '../../../../gameEngine/uno/unoTypes';
import { UnoRules } from '../../../../gameEngine/uno/unoRules';
import UnoCardView from './UnoCardView';

const { width } = Dimensions.get('window');

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
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>YOUR HAND</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{hand.length} Cards</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {hand.map((card, index) => {
          // Playable determination
          let isPlayable = false;
          if (isMyTurn && !disabled) {
            if (isDrawPhase) {
              // Can only play the drawn card if playable
              isPlayable = card.id === drawnCardId && UnoRules.canPlayCard(topCard, activeColor, card);
            } else {
              isPlayable = UnoRules.canPlayCard(topCard, activeColor, card);
            }
          }

          // Fan rotation calculations
          const total = hand.length;
          const mid = (total - 1) / 2;
          const offsetFromMid = index - mid;
          const rotationDeg = total > 4 ? Math.max(-10, Math.min(10, offsetFromMid * 1.8)) : 0;
          const yOffset = total > 4 ? Math.abs(offsetFromMid) * 2 : 0;

          return (
            <View
              key={card.id}
              style={[
                styles.cardWrapper,
                {
                  marginLeft: index === 0 ? 0 : -22,
                  transform: [
                    { rotate: `${rotationDeg}deg` },
                    { translateY: yOffset },
                  ],
                  zIndex: isPlayable ? 50 + index : index,
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
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#B0C2B6',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F1F5F2',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UnoHandView;
