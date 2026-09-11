import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {
  ChessBoard,
  ChessColor,
  ChessMove,
  ChessPosition,
} from '../../../../gameEngine/chess/chessTypes';
import { BOARD_THEMES } from '../../../../gameEngine/chess/chessConstants';
import ChessPieceView from './ChessPieceView';

const BOARD_PADDING = 6;

interface ChessBoardViewProps {
  board: ChessBoard;
  selectedPos: ChessPosition | null;
  legalMoves: ChessMove[];
  lastMove: ChessMove | null;
  isCheck: boolean;
  currentTurn: ChessColor;
  isFlipped?: boolean;
  onSquarePress: (pos: ChessPosition) => void;
  themeKey?: keyof typeof BOARD_THEMES;
}

export const ChessBoardView: React.FC<ChessBoardViewProps> = React.memo(
  ({
    board,
    selectedPos,
    legalMoves,
    lastMove,
    isCheck,
    currentTurn,
    isFlipped = false,
    onSquarePress,
    themeKey = 'woodEmerald',
  }) => {
    const { width, height } = useWindowDimensions();
    const theme = BOARD_THEMES[themeKey] || BOARD_THEMES.woodEmerald;

    // Responsive board size calculation fitting all screens
    const maxAvailableWidth = Math.min(width - 5, height * 0.48, 420);
    const squareSize = Math.floor((maxAvailableWidth - BOARD_PADDING * 2) / 8);
    const boardTotalSize = squareSize * 8 + BOARD_PADDING * 2;

    // Fast lookup map for legal move target squares
    const legalMoveTargets = useMemo(() => {
      const map = new Map<string, ChessMove>();
      legalMoves.forEach((m) => {
        map.set(`${m.to.row}_${m.to.col}`, m);
      });
      return map;
    }, [legalMoves]);

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

    const displayRanks = isFlipped ? [...ranks].reverse() : ranks;
    const displayFiles = isFlipped ? [...files].reverse() : files;

    const rowIndices = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
    const colIndices = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

    return (
      <View
        style={[
          styles.outerFrame,
          {
            width: boardTotalSize,
            height: boardTotalSize,
            backgroundColor: theme.boardBorder,
          },
        ]}
      >
        {/* Clean 1px Inner Board Frame */}
        <View style={styles.boardInner}>
          {rowIndices.map((r, rIdx) => (
            <View key={`row_${r}`} style={styles.boardRow}>
              {colIndices.map((c, cIdx) => {
                const piece = board[r][c];
                const isLight = (r + c) % 2 === 0;
                const squareKey = `${r}_${c}`;
                const isSelected = selectedPos?.row === r && selectedPos?.col === c;
                const legalMove = legalMoveTargets.get(squareKey);
                const isLegalTarget = Boolean(legalMove);
                const isCaptureTarget =
                  isLegalTarget &&
                  Boolean(legalMove?.capturedPiece || legalMove?.moveType === 'en_passant');

                const isLastMoveFrom = lastMove?.from.row === r && lastMove?.from.col === c;
                const isLastMoveTo = lastMove?.to.row === r && lastMove?.to.col === c;
                const isKingInCheck =
                  isCheck &&
                  piece &&
                  piece.type === 'king' &&
                  piece.color === currentTurn;

                const baseSquareBg = isLight ? theme.lightSquare : theme.darkSquare;
                const squareBg = isSelected
                  ? theme.selectedSquare
                  : isLastMoveTo || isLastMoveFrom
                    ? theme.lastMove
                    : isKingInCheck
                      ? theme.checkWarning
                      : baseSquareBg;

                return (
                  <TouchableOpacity
                    key={`sq_${r}_${c}`}
                    activeOpacity={0.8}
                    style={[
                      styles.square,
                      {
                        width: squareSize,
                        height: squareSize,
                        backgroundColor: squareBg,
                      },
                      isSelected && styles.selectedSquareBorder,
                    ]}
                    onPress={() => onSquarePress({ row: r, col: c })}
                  >
                    {/* Rank Coordinate Label (on left-most file) */}
                    {cIdx === 0 && (
                      <Text
                        style={[
                          styles.coordRank,
                          { color: isLight ? theme.darkSquare : theme.lightSquare },
                        ]}
                      >
                        {displayRanks[rIdx]}
                      </Text>
                    )}

                    {/* File Coordinate Label (on bottom-most rank) */}
                    {rIdx === 7 && (
                      <Text
                        style={[
                          styles.coordFile,
                          { color: isLight ? theme.darkSquare : theme.lightSquare },
                        ]}
                      >
                        {displayFiles[cIdx]}
                      </Text>
                    )}

                    {/* Piece View */}
                    {piece && (
                      <ChessPieceView
                        piece={piece}
                        size={squareSize * 0.88}
                        isSelected={isSelected}
                      />
                    )}

                    {/* Legal Move Destination Indicator (Emerald Dot for empty, Ring for capture) */}
                    {isLegalTarget && !isCaptureTarget && !piece && (
                      <View style={styles.validMoveDot} />
                    )}

                    {isCaptureTarget && (
                      <View style={styles.captureRing}>
                        <View style={styles.captureInnerCross} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  outerFrame: {
    padding: BOARD_PADDING,
    borderRadius: 12,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  boardInner: {
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.25)',
  },
  boardRow: {
    flexDirection: 'row',
  },
  square: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedSquareBorder: {
    borderWidth: 1.5,
    borderColor: '#F0C64A',
    zIndex: 5,
  },
  coordRank: {
    position: 'absolute',
    top: 1.5,
    left: 2.5,
    fontSize: 8.5,
    fontWeight: '800',
    opacity: 0.8,
  },
  coordFile: {
    position: 'absolute',
    bottom: 1,
    right: 2.5,
    fontSize: 8.5,
    fontWeight: '800',
    opacity: 0.8,
  },
  validMoveDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#1F9D55',
    opacity: 0.9,
    shadowColor: '#1F9D55',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  captureRing: {
    position: 'absolute',
    inset: 2,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#E6483A',
    backgroundColor: 'rgba(230, 72, 58, 0.22)',
  },
  captureInnerCross: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#E6483A',
  },
});

export default ChessBoardView;
