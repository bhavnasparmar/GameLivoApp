import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ChessMove } from '../../../../gameEngine/chess/chessTypes';

interface ChessMoveHistoryBarProps {
  moves: ChessMove[];
  isDark?: boolean;
}

export const ChessMoveHistoryBar: React.FC<ChessMoveHistoryBarProps> = React.memo(
  ({ moves, isDark = true }) => {
    const scrollRef = useRef<any>(null);

    useEffect(() => {
      if (moves.length > 0) {
        scrollRef.current?.scrollToEnd({ animated: true });
      }
    }, [moves.length]);

    const hasMoves = moves.length > 0;

    // Group moves into turns (pairs of White and Black moves)
    const turnPairs: { turnNum: number; white?: string; black?: string }[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      const turnNum = Math.floor(i / 2) + 1;
      turnPairs.push({
        turnNum,
        white: moves[i]?.notation || '...',
        black: moves[i + 1]?.notation,
      });
    }

    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? 'rgba(15, 25, 20, 0.75)' : '#F0F6F2',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#D6E5DC',
          },
        ]}
      >
        <Text style={[styles.historyLabel, { color: isDark ? '#7A9485' : '#5C7A6A' }]}>
          MOVES:
        </Text>
        {hasMoves ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {turnPairs.map((pair) => (
              <View key={`turn_${pair.turnNum}`} style={styles.turnBlock}>
                <Text style={styles.turnNumText}>{pair.turnNum}.</Text>
                <Text
                  style={[
                    styles.moveWhite,
                    { color: isDark ? '#F1F4F7' : '#1A2318' },
                  ]}
                >
                  {pair.white}
                </Text>
                {pair.black && (
                  <Text
                    style={[
                      styles.moveBlack,
                      { color: isDark ? '#B4C5BB' : '#45594E' },
                    ]}
                  >
                    {pair.black}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={[styles.placeholderText, { color: isDark ? '#5C7A6A' : '#8A9E92' }]}>
            Match ready · White moves first
          </Text>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 32,
    marginHorizontal: 14,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  historyLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  placeholderText: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  turnBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  turnNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4A017',
  },
  moveWhite: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  moveBlack: {
    fontSize: 11.5,
    fontWeight: '600',
  },
});

export default ChessMoveHistoryBar;
