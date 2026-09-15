import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import {
  Canvas,
  Rect,
  RoundedRect,
  Circle,
  RadialGradient,
  vec,
  Shadow,
} from '@shopify/react-native-skia';
import {
  ChessBoard,
  ChessColor,
  ChessMove,
  ChessPiece,
  ChessPosition,
} from '../../../../gameEngine/chess/chessTypes';
import { BOARD_THEMES } from '../../../../gameEngine/chess/chessConstants';
import ChessPieceAnimated from './ChessPieceAnimated';
import ChessCaptureEffect from './ChessCaptureEffect';

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

    // Responsive square calculation (8 squares exactly fit boardTotalSize)
    const maxAvailableWidth = Math.min(width - 16, height * 0.52);
    const squareSize = Math.floor(maxAvailableWidth / 8);
    const boardTotalSize = squareSize * 8;

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

    // Track recently captured piece for impact animation
    const [capturedAnim, setCapturedAnim] = useState<{
      piece: ChessPiece;
      row: number;
      col: number;
      key: string;
    } | null>(null);

    useEffect(() => {
      if (lastMove && lastMove.capturedPiece) {
        const capRow =
          lastMove.moveType === 'en_passant' ? lastMove.from.row : lastMove.to.row;
        const capCol = lastMove.to.col;

        setCapturedAnim({
          piece: lastMove.capturedPiece,
          row: capRow,
          col: capCol,
          key: `cap_${capRow}_${capCol}_${Date.now()}`,
        });
      }
    }, [lastMove]);

    // Precalculate square layout data for Skia Canvas
    const skiaSquares = useMemo(() => {
      const items: Array<{
        r: number;
        c: number;
        rIdx: number;
        cIdx: number;
        x: number;
        y: number;
        isLight: boolean;
        baseColor: string;
        isLastMove: boolean;
        isSelected: boolean;
        isCheckSquare: boolean;
        isLegalTarget: boolean;
        isCaptureTarget: boolean;
      }> = [];

      rowIndices.forEach((r, rIdx) => {
        colIndices.forEach((c, cIdx) => {
          const piece = board[r]?.[c];
          const isLight = (r + c) % 2 === 0;
          const x = cIdx * squareSize;
          const y = rIdx * squareSize;

          const isLastMove = Boolean(
            lastMove &&
              ((lastMove.from.row === r && lastMove.from.col === c) ||
                (lastMove.to.row === r && lastMove.to.col === c)),
          );

          const isSelected = Boolean(selectedPos && selectedPos.row === r && selectedPos.col === c);

          const isCheckSquare = Boolean(
            isCheck && piece && piece.type === 'king' && piece.color === currentTurn,
          );

          const squareKey = `${r}_${c}`;
          const legalMove = legalMoveTargets.get(squareKey);
          const isLegalTarget = Boolean(legalMove);
          const isCaptureTarget =
            isLegalTarget &&
            Boolean(legalMove?.capturedPiece || legalMove?.moveType === 'en_passant');

          items.push({
            r,
            c,
            rIdx,
            cIdx,
            x,
            y,
            isLight,
            baseColor: isLight ? theme.lightSquare : theme.darkSquare,
            isLastMove,
            isSelected,
            isCheckSquare,
            isLegalTarget,
            isCaptureTarget,
          });
        });
      });

      return items;
    }, [
      rowIndices,
      colIndices,
      board,
      squareSize,
      lastMove,
      selectedPos,
      isCheck,
      currentTurn,
      legalMoveTargets,
      theme,
    ]);

    return (
      <View
        style={[
          styles.container,
          {
            width: boardTotalSize,
            height: boardTotalSize,
          },
        ]}
      >
        {/* ─── 1. Skia Hardware-Accelerated Board Canvas ─── */}
        <Canvas style={[styles.canvas, { width: boardTotalSize, height: boardTotalSize }]}>
          {/* Outer Board Background */}
          <Rect
            x={0}
            y={0}
            width={boardTotalSize}
            height={boardTotalSize}
            color={theme.boardBorder || '#2A1B10'}
          />

          {/* 64 Board Squares & Highlights */}
          {skiaSquares.map((sq) => {
            const centerX = sq.x + squareSize / 2;
            const centerY = sq.y + squareSize / 2;

            return (
              <React.Fragment key={`skia_sq_${sq.r}_${sq.c}`}>
                {/* Base Square Tile */}
                <Rect
                  x={sq.x}
                  y={sq.y}
                  width={squareSize}
                  height={squareSize}
                  color={sq.baseColor}
                />

                {/* Last Move Golden Highlight Overlay */}
                {sq.isLastMove && (
                  <Rect
                    x={sq.x}
                    y={sq.y}
                    width={squareSize}
                    height={squareSize}
                    color={theme.lastMove || 'rgba(240, 198, 74, 0.38)'}
                  />
                )}

                {/* In-Check King Warning Radial Glow */}
                {sq.isCheckSquare && (
                  <Rect
                    x={sq.x}
                    y={sq.y}
                    width={squareSize}
                    height={squareSize}
                  >
                    <RadialGradient
                      c={vec(centerX, centerY)}
                      r={squareSize * 0.75}
                      colors={[
                        'rgba(235, 59, 45, 0.95)',
                        'rgba(220, 40, 30, 0.65)',
                        'rgba(180, 20, 20, 0.2)',
                      ]}
                    />
                  </Rect>
                )}

                {/* Selected Square Highlight with Soft Rounded Bevel */}
                {sq.isSelected && (
                  <RoundedRect
                    x={sq.x + 1}
                    y={sq.y + 1}
                    width={squareSize - 2}
                    height={squareSize - 2}
                    r={3}
                    color={theme.selectedSquare || 'rgba(212, 160, 23, 0.65)'}
                  >
                    <Shadow dx={0} dy={0} blur={4} color="rgba(240, 198, 74, 0.75)" />
                  </RoundedRect>
                )}

                {/* Legal Move Empty Destination: Smooth Glowing Dot */}
                {sq.isLegalTarget && !sq.isCaptureTarget && (
                  <Circle
                    cx={centerX}
                    cy={centerY}
                    r={squareSize * 0.16}
                    color={theme.validMoveDot || 'rgba(31, 157, 85, 0.85)'}
                  >
                    <Shadow dx={0} dy={1} blur={2} color="rgba(0,0,0,0.3)" />
                  </Circle>
                )}

                {/* Legal Move Capture Destination: Striking Target Ring */}
                {sq.isCaptureTarget && (
                  <Circle
                    cx={centerX}
                    cy={centerY}
                    r={squareSize * 0.44}
                    style="stroke"
                    strokeWidth={3}
                    color={theme.captureTarget || 'rgba(230, 72, 58, 0.85)'}
                  >
                    <Shadow dx={0} dy={0} blur={3} color="rgba(230, 72, 58, 0.9)" />
                  </Circle>
                )}
              </React.Fragment>
            );
          })}
        </Canvas>

        {/* ─── 2. Interactive Touch & Animated Chess Pieces Grid ─── */}
        <View style={styles.interactiveGrid}>
          {rowIndices.map((r, rIdx) => (
            <View key={`row_${r}`} style={styles.boardRow}>
              {colIndices.map((c, cIdx) => {
                const piece = board[r]?.[c];
                const isLight = (r + c) % 2 === 0;
                const isSelected = selectedPos?.row === r && selectedPos?.col === c;
                const isCheckKing = Boolean(
                  isCheck && piece && piece.type === 'king' && piece.color === currentTurn,
                );

                // Check if this square has the last moved piece
                let isLastMovedPiece = false;
                let fromRow: number | undefined;
                let fromCol: number | undefined;
                let toRow: number | undefined;
                let toCol: number | undefined;

                if (lastMove) {
                  if (lastMove.to.row === r && lastMove.to.col === c) {
                    isLastMovedPiece = true;
                    fromRow = lastMove.from.row;
                    fromCol = lastMove.from.col;
                    toRow = r;
                    toCol = c;
                  } else if (lastMove.moveType === 'castle_kingside') {
                    // Rook moved from 7 to 5
                    if (r === lastMove.from.row && c === 5) {
                      isLastMovedPiece = true;
                      fromRow = r;
                      fromCol = 7;
                      toRow = r;
                      toCol = 5;
                    }
                  } else if (lastMove.moveType === 'castle_queenside') {
                    // Rook moved from 0 to 3
                    if (r === lastMove.from.row && c === 3) {
                      isLastMovedPiece = true;
                      fromRow = r;
                      fromCol = 0;
                      toRow = r;
                      toCol = 3;
                    }
                  }
                }

                const isCapturedHere = capturedAnim?.row === r && capturedAnim?.col === c;
                const isCaptureMove = Boolean(
                  lastMove &&
                    (lastMove.capturedPiece || lastMove.moveType === 'en_passant'),
                );

                return (
                  <TouchableOpacity
                    key={`touch_sq_${r}_${c}`}
                    activeOpacity={0.85}
                    style={[
                      styles.touchSquare,
                      {
                        width: squareSize,
                        height: squareSize,
                      },
                    ]}
                    onPress={() => onSquarePress({ row: r, col: c })}
                  >
                    {/* Coordinate Rank Label (on column 0) */}
                    {cIdx === 0 && (
                      <Text
                        style={[
                          styles.coordRank,
                          { color: isLight ? theme.darkSquare : theme.lightSquare },
                        ]}
                        pointerEvents="none"
                      >
                        {displayRanks[rIdx]}
                      </Text>
                    )}

                    {/* Coordinate File Label (on row 7) */}
                    {rIdx === 7 && (
                      <Text
                        style={[
                          styles.coordFile,
                          { color: isLight ? theme.darkSquare : theme.lightSquare },
                        ]}
                        pointerEvents="none"
                      >
                        {displayFiles[cIdx]}
                      </Text>
                    )}

                    {/* Dynamic Capture Shockwave & Spark Burst Effect */}
                    {isCapturedHere && capturedAnim && (
                      <ChessCaptureEffect
                        key={`fx_${capturedAnim.key}`}
                        squareSize={squareSize}
                      />
                    )}

                    {/* Captured Piece Overlay Playing Dramatic Knockout & Tumble */}
                    {isCapturedHere && capturedAnim && (
                      <ChessPieceAnimated
                        key={capturedAnim.key}
                        piece={capturedAnim.piece}
                        squareSize={squareSize}
                        isCapturedPiece={true}
                        onCapturedComplete={() => setCapturedAnim(null)}
                      />
                    )}

                    {/* Active Chess Piece with Smooth Transit & Strike Animation */}
                    {piece && (
                      <ChessPieceAnimated
                        key={`piece_${piece.id}_${r}_${c}`}
                        piece={piece}
                        squareSize={squareSize}
                        isSelected={isSelected}
                        isCheckKing={isCheckKing}
                        isLastMovedPiece={isLastMovedPiece}
                        isCaptureMove={isLastMovedPiece && isCaptureMove}
                        fromRow={fromRow}
                        fromCol={fromCol}
                        toRow={toRow}
                        toCol={toCol}
                        isFlipped={isFlipped}
                      />
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
  container: {
    alignSelf: 'center',
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  interactiveGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  boardRow: {
    flexDirection: 'row',
  },
  touchSquare: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coordRank: {
    position: 'absolute',
    top: 2,
    left: 3,
    fontSize: 9,
    fontWeight: '800',
    opacity: 0.85,
    zIndex: 5,
  },
  coordFile: {
    position: 'absolute',
    bottom: 1.5,
    right: 3,
    fontSize: 9,
    fontWeight: '800',
    opacity: 0.85,
    zIndex: 5,
  },
});

export default ChessBoardView;
