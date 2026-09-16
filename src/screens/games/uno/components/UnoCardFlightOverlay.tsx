import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { UnoCard } from '../../../../gameEngine/uno/unoTypes';
import UnoCardView from './UnoCardView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface CardFlightItem {
  id: string;
  card?: UnoCard;
  isBack?: boolean;
  from: 'deck' | 'playerHand' | 'topOpponent' | 'leftOpponent' | 'rightOpponent' | 'discardPile';
  to: 'deck' | 'playerHand' | 'topOpponent' | 'leftOpponent' | 'rightOpponent' | 'discardPile';
  delayMs?: number;
  onComplete?: () => void;
}

interface UnoCardFlightOverlayProps {
  flights: CardFlightItem[];
  onFlightFinished?: (id: string) => void;
}

const getPositionCoords = (pos: CardFlightItem['from'] | CardFlightItem['to']) => {
  switch (pos) {
    case 'deck':
      return { x: SCREEN_WIDTH * 0.38 - 28, y: SCREEN_HEIGHT * 0.46 - 40 };
    case 'discardPile':
      return { x: SCREEN_WIDTH * 0.62 - 28, y: SCREEN_HEIGHT * 0.46 - 40 };
    case 'playerHand':
      return { x: SCREEN_WIDTH * 0.5 - 28, y: SCREEN_HEIGHT * 0.78 - 40 };
    case 'topOpponent':
      return { x: SCREEN_WIDTH * 0.5 - 28, y: SCREEN_HEIGHT * 0.14 - 40 };
    case 'leftOpponent':
      return { x: SCREEN_WIDTH * 0.22 - 28, y: SCREEN_HEIGHT * 0.26 - 40 };
    case 'rightOpponent':
      return { x: SCREEN_WIDTH * 0.78 - 28, y: SCREEN_HEIGHT * 0.26 - 40 };
    default:
      return { x: SCREEN_WIDTH * 0.5 - 28, y: SCREEN_HEIGHT * 0.5 - 40 };
  }
};

const SingleFlightCard: React.FC<{
  item: CardFlightItem;
  onDone: (id: string) => void;
}> = ({ item, onDone }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);

  const startCoords = getPositionCoords(item.from);
  const endCoords = getPositionCoords(item.to);

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setTimeout(() => {
      if (!isMountedRef.current) return;
      Animated.timing(anim, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        if (isMountedRef.current) {
          item.onComplete?.();
          onDone(item.id);
        }
      });
    }, item.delayMs || 0);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
    };
  }, [item.id]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [startCoords.x, endCoords.x],
  });

  const translateY = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [
      startCoords.y,
      Math.min(startCoords.y, endCoords.y) - 25, // graceful flight arc curve
      endCoords.y,
    ],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      item.from === 'deck' ? 0.75 : 0.9,
      1.15,
      item.to === 'playerHand' ? 0.95 : 0.85,
    ],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-10deg', '4deg', '0deg'],
  });

  const opacity = anim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0.3, 1, 1, 0.95],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.flyingCardWrapper,
        {
          opacity,
          transform: [
            { translateX },
            { translateY },
            { scale },
            { rotate },
          ],
        },
      ]}
    >
      <UnoCardView
        card={item.card}
        isBack={item.isBack ?? !item.card}
        size="center"
      />
    </Animated.View>
  );
};

export const UnoCardFlightOverlay: React.FC<UnoCardFlightOverlayProps> = ({
  flights,
  onFlightFinished,
}) => {
  if (!flights || flights.length === 0) return null;

  return (
    <View pointerEvents="none" style={styles.overlayContainer}>
      {flights.map((flight) => (
        <SingleFlightCard
          key={flight.id}
          item={flight}
          onDone={(id) => onFlightFinished?.(id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  flyingCardWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 12,
  },
});

export default UnoCardFlightOverlay;
