import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ChessPiece } from '../../../../gameEngine/chess/chessTypes';
import { CHESS_GLYPHS } from '../../../../gameEngine/chess/chessConstants';

interface ChessPieceViewProps {
  piece: ChessPiece;
  size?: number;
  isSelected?: boolean;
}

export const ChessPieceView: React.FC<ChessPieceViewProps> = React.memo(
  ({ piece, size = 38, isSelected = false }) => {
    const isWhite = piece.color === 'white';
    const glyph = CHESS_GLYPHS[piece.color][piece.type];

    return (
      <View
        style={[
          styles.container,
          { width: size, height: size },
          isSelected && styles.selectedPiece,
        ]}
      >
        {/* 3D Depth Cast Shadow */}
        <Text
          style={[
            styles.shadowGlyph,
            {
              fontSize: size * 0.88,
              lineHeight: size * 0.94,
              color: isWhite ? 'rgba(40, 25, 10, 0.45)' : 'rgba(0, 0, 0, 0.65)',
            },
          ]}
        >
          {glyph}
        </Text>

        {/* Specular Edge Highlight for 3D bevel look */}
        <Text
          style={[
            styles.edgeHighlightGlyph,
            {
              fontSize: size * 0.88,
              lineHeight: size * 0.94,
              color: isWhite ? '#FFFDF8' : 'rgba(255, 255, 255, 0.22)',
            },
          ]}
        >
          {glyph}
        </Text>

        {/* Main 3D Piece Body */}
        <Text
          style={[
            styles.mainGlyph,
            {
              fontSize: size * 0.88,
              lineHeight: size * 0.94,
              color: isWhite ? '#FFFBF0' : '#1C1F24',
              textShadowColor: isWhite ? 'rgba(166, 116, 12, 0.6)' : 'rgba(0, 0, 0, 0.9)',
              textShadowOffset: { width: 0, height: isWhite ? 1.5 : 2 },
              textShadowRadius: isWhite ? 2 : 3,
            },
          ]}
        >
          {glyph}
        </Text>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedPiece: {
    transform: [{ scale: 1.14 }, { translateY: -4 }],
  },
  shadowGlyph: {
    position: 'absolute',
    top: 2.5,
    left: 1,
    fontWeight: '900',
    textAlign: 'center',
  },
  edgeHighlightGlyph: {
    position: 'absolute',
    top: -0.5,
    left: 0,
    fontWeight: '900',
    textAlign: 'center',
  },
  mainGlyph: {
    fontWeight: '900',
    textAlign: 'center',
  },
});

export default ChessPieceView;
