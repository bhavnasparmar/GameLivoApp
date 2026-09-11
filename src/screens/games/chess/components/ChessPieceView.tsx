import React from 'react';
import { View, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { ChessPiece } from '../../../../gameEngine/chess/chessTypes';
import { CHESS_PIECE_IMAGES } from '../../../../gameEngine/chess/chessConstants';

interface ChessPieceViewProps {
  piece: ChessPiece;
  size?: number;
  isSelected?: boolean;
}

export const ChessPieceView: React.FC<ChessPieceViewProps> = React.memo(
  ({ piece, size = 38, isSelected = false }) => {
    const pieceImage = CHESS_PIECE_IMAGES[piece.color]?.[piece.type];

    if (!pieceImage) return null;

    return (
      <View
        style={[
          styles.container,
          { width: size, height: size },
          isSelected && styles.selectedPiece,
        ]}
      >
        <FastImage
          source={pieceImage}
          style={[styles.pieceImg, { width: size * 0.9, height: size * 0.9 }] as any}
          resizeMode={FastImage.resizeMode.contain}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  pieceImg: {
    alignSelf: 'center',
  },
  selectedPiece: {
    transform: [{ scale: 1.15 }, { translateY: -4 }],
  },
});

export default ChessPieceView;
