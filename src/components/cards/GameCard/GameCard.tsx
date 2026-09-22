import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const TILE_WIDTH = (width - 40 - 14) / 2;

export interface GameCardMeta {
  id: string;
  name: string;
  glyph: string;
  tag: string;
  onlineCount: string;
  gradient: string[];
  route: string;
}

interface GameCardProps {
  card: GameCardMeta;
  onPress: (card: GameCardMeta) => void;
}

/**
 * GameCard — Memoized game tile for the 2-column game grid.
 * React.memo ensures re-render sirf tab hota hai jab card data ya onPress change ho.
 */
const GameCard: React.FC<GameCardProps> = React.memo(({ card, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(card);
  }, [card, onPress]);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={handlePress}
      style={styles.tileWrapper}
    >
      <LinearGradient
        colors={card.gradient}
        style={styles.tile}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Live Online Badge */}
        <View style={styles.tileLiveBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.tileLiveText}>{card.onlineCount}</Text>
        </View>

        {/* Big Watermarked Glyph */}
        <Text style={styles.tileGlyph}>{card.glyph}</Text>

        {/* Title & Tag */}
        <View style={styles.tileBottom}>
          <Text style={styles.tileTitle}>{card.name}</Text>
          <Text style={styles.tileTag}>{card.tag}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

GameCard.displayName = 'GameCard';

export default GameCard;

const styles = StyleSheet.create({
  tileWrapper: {
    width: TILE_WIDTH,
    height: 154,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  tile: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tileLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignSelf: 'flex-end',
    paddingVertical: 3.5,
    paddingHorizontal: 7,
    borderRadius: 8,
    gap: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#5CF27A',
  },
  tileLiveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tileGlyph: {
    position: 'absolute',
    right: 4,
    bottom: -6,
    fontSize: 68,
    opacity: 0.2,
    transform: [{ rotate: '-8deg' }],
  },
  tileBottom: {
    zIndex: 2,
  },
  tileTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tileTag: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11.5,
    marginTop: 2,
    fontWeight: '500',
  },
});
