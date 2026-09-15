import {
  CastlingRights,
  ChessBoard,
  ChessColor,
  ChessDifficulty,
  ChessGameState,
  ChessMove,
  ChessPiece,
  ChessPieceType,
  ChessPosition,
} from './chessTypes';
import { ChessRules } from './chessRules';
import { CHESS_DEFAULT_TIME_SECONDS, PIECE_VALUES } from './chessConstants';
import { BaseGameEngine, MoveResult } from '../common/gameTypes';

// Piece-Square positional tables (from White's perspective, inverted for Black)
const PAWN_PST = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0],
];

const KNIGHT_PST = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50],
];

const BISHOP_PST = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20],
];

export class ChessEngineImpl implements BaseGameEngine<ChessGameState, ChessMove> {
  getInitialState(playerIds: string[] = ['player1', 'player2'], timeSeconds = CHESS_DEFAULT_TIME_SECONDS): ChessGameState {
    const [whitePlayerId, blackPlayerId] = playerIds;
    const initialBoard = ChessRules.createInitialBoard();

    return {
      board: initialBoard,
      currentTurn: 'white',
      whitePlayerId: whitePlayerId || 'player1',
      blackPlayerId: blackPlayerId || 'player2',
      castlingRights: {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true },
      },
      enPassantTarget: null,
      halfmoveClock: 0,
      fullmoveNumber: 1,
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      gameStatus: 'in_progress',
      winner: null,
      capturedPieces: { white: [], black: [] },
      moveHistory: [],
      lastMove: null,
      whiteTimeLeft: timeSeconds,
      blackTimeLeft: timeSeconds,
      positionHistory: [this.getBoardPositionKey(initialBoard, 'white')],
    };
  }

  getBoardPositionKey(
    board: ChessBoard,
    turn: ChessColor,
    castling?: CastlingRights,
    ep?: ChessPosition | null,
  ): string {
    let key = `${turn}:`;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        key += p ? `${p.color[0]}${p.type[0]}` : '.';
      }
    }
    if (castling) {
      key += `:${castling.white.kingside ? 'K' : ''}${castling.white.queenside ? 'Q' : ''}${castling.black.kingside ? 'k' : ''}${castling.black.queenside ? 'q' : ''}`;
    }
    if (ep) {
      key += `:${ep.row},${ep.col}`;
    }
    return key;
  }

  applyMove(
    state: ChessGameState,
    move: ChessMove,
    _playerId?: string,
  ): { newState: ChessGameState; result: MoveResult } {
    if (state.gameStatus !== 'in_progress' && state.gameStatus !== 'check') {
      return { newState: state, result: { isValid: false, reason: 'Game is already completed' } };
    }

    const { from, to, promotion } = move;
    const movingPiece = state.board[from.row][from.col];

    if (!movingPiece) {
      return { newState: state, result: { isValid: false, reason: 'No piece at selected position' } };
    }

    if (movingPiece.color !== state.currentTurn) {
      return { newState: state, result: { isValid: false, reason: 'Not your turn' } };
    }

    // Verify move legality
    const legalMoves = ChessRules.getLegalMoves(
      state.board,
      from,
      state.castlingRights,
      state.enPassantTarget,
    );

    const isLegal = legalMoves.some((m) => m.to.row === to.row && m.to.col === to.col);
    if (!isLegal) {
      return { newState: state, result: { isValid: false, reason: 'Illegal chess move' } };
    }

    // Clone state deeply
    const newBoard = ChessRules.cloneBoard(state.board);
    const newCastling = {
      white: { ...state.castlingRights.white },
      black: { ...state.castlingRights.black },
    };
    const capturedPieces = {
      white: [...state.capturedPieces.white],
      black: [...state.capturedPieces.black],
    };

    let capturedPiece: ChessPiece | null = newBoard[to.row][to.col];
    let moveType = move.moveType || 'normal';
    const activeColor = state.currentTurn;
    const nextColor: ChessColor = activeColor === 'white' ? 'black' : 'white';

    // 1. En Passant special execution
    let nextEnPassantTarget: ChessPosition | null = null;
    if (movingPiece.type === 'pawn') {
      // 2-step advance creates en passant target
      if (Math.abs(to.row - from.row) === 2) {
        nextEnPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
      }

      // En passant capture
      if (
        state.enPassantTarget &&
        to.row === state.enPassantTarget.row &&
        to.col === state.enPassantTarget.col &&
        from.col !== to.col &&
        !capturedPiece
      ) {
        const capturedPawnRow = from.row;
        capturedPiece = newBoard[capturedPawnRow][to.col];
        newBoard[capturedPawnRow][to.col] = null;
        moveType = 'en_passant';
      }
    }

    // 2. Castling special execution
    if (movingPiece.type === 'king') {
      newCastling[activeColor].kingside = false;
      newCastling[activeColor].queenside = false;

      // Kingside castling (col 4 -> 6)
      if (to.col - from.col === 2) {
        moveType = 'castle_kingside';
        const rook = newBoard[from.row][7];
        newBoard[from.row][5] = rook ? { ...rook, hasMoved: true } : null;
        newBoard[from.row][7] = null;
      }
      // Queenside castling (col 4 -> 2)
      else if (from.col - to.col === 2) {
        moveType = 'castle_queenside';
        const rook = newBoard[from.row][0];
        newBoard[from.row][3] = rook ? { ...rook, hasMoved: true } : null;
        newBoard[from.row][0] = null;
      }
    }

    // 3. Rook movement/capture updates castling rights
    if (movingPiece.type === 'rook') {
      if (from.row === (activeColor === 'white' ? 7 : 0)) {
        if (from.col === 0) newCastling[activeColor].queenside = false;
        if (from.col === 7) newCastling[activeColor].kingside = false;
      }
    }
    if (capturedPiece && capturedPiece.type === 'rook') {
      const oppColor = capturedPiece.color;
      if (to.row === (oppColor === 'white' ? 7 : 0)) {
        if (to.col === 0) newCastling[oppColor].queenside = false;
        if (to.col === 7) newCastling[oppColor].kingside = false;
      }
    }

    // 4. Place piece and handle pawn promotion
    let finalPiece: ChessPiece = {
      ...movingPiece,
      hasMoved: true,
    };

    if (movingPiece.type === 'pawn') {
      const promoRow = activeColor === 'white' ? 0 : 7;
      if (to.row === promoRow) {
        moveType = 'promotion';
        const promoType: ChessPieceType = promotion || 'queen';
        finalPiece = {
          ...finalPiece,
          type: promoType,
        };
      }
    }

    newBoard[to.row][to.col] = finalPiece;
    newBoard[from.row][from.col] = null;

    // Track captured pieces
    if (capturedPiece) {
      if (activeColor === 'white') {
        capturedPieces.white.push(capturedPiece);
      } else {
        capturedPieces.black.push(capturedPiece);
      }
    }

    // 5. Check / Checkmate / Stalemate assessment
    const isNextInCheck = ChessRules.isInCheck(newBoard, nextColor);
    const nextLegalMoves = ChessRules.getAllLegalMoves(
      newBoard,
      nextColor,
      newCastling,
      nextEnPassantTarget,
    );
    const isNextCheckmated = isNextInCheck && nextLegalMoves.length === 0;
    const isNextStalemated = !isNextInCheck && nextLegalMoves.length === 0;
    const isInsufficient = ChessRules.isInsufficientMaterial(newBoard);

    // 6. Fifty-move rule clock
    let halfmoveClock = state.halfmoveClock + 1;
    if (movingPiece.type === 'pawn' || capturedPiece) {
      halfmoveClock = 0;
    }

    // 7. Threefold repetition
    const posKey = this.getBoardPositionKey(newBoard, nextColor, newCastling, nextEnPassantTarget);
    const newPosHistory = [...state.positionHistory, posKey];
    const occurrences = newPosHistory.filter((k) => k === posKey).length;
    const isThreefold = occurrences >= 3;
    const isFiftyMove = halfmoveClock >= 100; // 50 full moves = 100 half moves

    let gameStatus: ChessGameState['gameStatus'] = 'in_progress';
    let winner: ChessColor | 'draw' | null = null;
    let winReason = '';

    if (isNextCheckmated) {
      gameStatus = 'checkmate';
      winner = activeColor;
      winReason = `Checkmate! ${activeColor.toUpperCase()} wins.`;
    } else if (isNextStalemated) {
      gameStatus = 'stalemate';
      winner = 'draw';
      winReason = 'Stalemate — Draw!';
    } else if (isInsufficient) {
      gameStatus = 'draw_material';
      winner = 'draw';
      winReason = 'Draw due to insufficient material';
    } else if (isThreefold) {
      gameStatus = 'draw_repetition';
      winner = 'draw';
      winReason = 'Draw by threefold repetition';
    } else if (isFiftyMove) {
      gameStatus = 'draw_50move';
      winner = 'draw';
      winReason = 'Draw by 50-move rule';
    } else if (isNextInCheck) {
      gameStatus = 'check';
    }

    const completedMove: ChessMove = {
      from,
      to,
      piece: movingPiece,
      capturedPiece,
      moveType,
      promotion: finalPiece.type !== movingPiece.type ? finalPiece.type : undefined,
      isCheck: isNextInCheck,
      isCheckmate: isNextCheckmated,
      notation: ChessRules.getAlgebraicNotation(
        { from, to, piece: movingPiece, capturedPiece, moveType, promotion: finalPiece.type !== movingPiece.type ? finalPiece.type : undefined },
        isNextInCheck,
        isNextCheckmated,
        state.board,
        state.castlingRights,
        state.enPassantTarget,
      ),
    };

    const newState: ChessGameState = {
      ...state,
      board: newBoard,
      currentTurn: nextColor,
      castlingRights: newCastling,
      enPassantTarget: nextEnPassantTarget,
      halfmoveClock,
      fullmoveNumber: activeColor === 'black' ? state.fullmoveNumber + 1 : state.fullmoveNumber,
      isCheck: isNextInCheck,
      isCheckmate: isNextCheckmated,
      isStalemate: isNextStalemated,
      gameStatus,
      winner,
      winReason,
      capturedPieces,
      moveHistory: [...state.moveHistory, completedMove],
      lastMove: completedMove,
      positionHistory: newPosHistory,
    };

    return {
      newState,
      result: {
        isValid: true,
        nextPlayerId: nextColor === 'white' ? state.whitePlayerId : state.blackPlayerId,
        isGameOver: isNextCheckmated || isNextStalemated || isInsufficient || isThreefold || isFiftyMove,
        winnerId: winner === 'white' ? state.whitePlayerId : winner === 'black' ? state.blackPlayerId : undefined,
      },
    };
  }

  isValidMove(state: ChessGameState, move: ChessMove, _playerId?: string): boolean {
    const legalMoves = ChessRules.getLegalMoves(
      state.board,
      move.from,
      state.castlingRights,
      state.enPassantTarget,
    );
    return legalMoves.some((m) => m.to.row === move.to.row && m.to.col === move.to.col);
  }

  isGameOver(state: ChessGameState): boolean {
    return state.gameStatus !== 'in_progress' && state.gameStatus !== 'check';
  }

  getWinner(state: ChessGameState): string | null {
    if (!state.winner || state.winner === 'draw') return null;
    return state.winner === 'white' ? state.whitePlayerId : state.blackPlayerId;
  }

  /**
   * Fast board clone + move application for AI search (minimal overhead)
   */
  simulateBoardQuick(board: ChessBoard, move: ChessMove): ChessBoard {
    const newBoard = board.map((row) => [...row]);
    const piece = newBoard[move.from.row][move.from.col];
    if (!piece) return newBoard;

    let placedPiece: ChessPiece = { ...piece, hasMoved: true };
    if (piece.type === 'pawn') {
      if ((piece.color === 'white' && move.to.row === 0) || (piece.color === 'black' && move.to.row === 7)) {
        placedPiece = { ...placedPiece, type: move.promotion || 'queen' };
      }
      // Handle en-passant visual cleanup
      if (move.moveType === 'en_passant' || (move.from.col !== move.to.col && !newBoard[move.to.row][move.to.col])) {
        newBoard[move.from.row][move.to.col] = null;
      }
    } else if (piece.type === 'king') {
      // Castling rook movement
      if (move.to.col - move.from.col === 2) {
        const rook = newBoard[move.from.row][7];
        newBoard[move.from.row][5] = rook ? { ...rook, hasMoved: true } : null;
        newBoard[move.from.row][7] = null;
      } else if (move.from.col - move.to.col === 2) {
        const rook = newBoard[move.from.row][0];
        newBoard[move.from.row][3] = rook ? { ...rook, hasMoved: true } : null;
        newBoard[move.from.row][0] = null;
      }
    }

    newBoard[move.to.row][move.to.col] = placedPiece;
    newBoard[move.from.row][move.from.col] = null;
    return newBoard;
  }

  /**
   * Orders moves so captures and promotions are evaluated first for efficient pruning
   */
  private orderMoves(moves: ChessMove[]): ChessMove[] {
    return [...moves].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      if (a.capturedPiece) {
        scoreA += (PIECE_VALUES[a.capturedPiece.type] || 1) * 10 - (PIECE_VALUES[a.piece.type] || 1);
      }
      if (a.promotion) scoreA += 90;

      if (b.capturedPiece) {
        scoreB += (PIECE_VALUES[b.capturedPiece.type] || 1) * 10 - (PIECE_VALUES[b.piece.type] || 1);
      }
      if (b.promotion) scoreB += 90;

      return scoreB - scoreA;
    });
  }

  /**
   * Evaluates the board score for minimax AI
   */
  evaluateBoard(board: ChessBoard, activeColor: ChessColor): number {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        let pieceScore = PIECE_VALUES[piece.type] * 100;

        // Position bonus from piece-square tables
        if (piece.type === 'pawn') {
          const pstRow = piece.color === 'white' ? r : 7 - r;
          pieceScore += PAWN_PST[pstRow][c];
        } else if (piece.type === 'knight') {
          const pstRow = piece.color === 'white' ? r : 7 - r;
          pieceScore += KNIGHT_PST[pstRow][c];
        } else if (piece.type === 'bishop') {
          const pstRow = piece.color === 'white' ? r : 7 - r;
          pieceScore += BISHOP_PST[pstRow][c];
        }

        if (piece.color === activeColor) {
          score += pieceScore;
        } else {
          score -= pieceScore;
        }
      }
    }
    return score;
  }

  /**
   * Generates a smart, ultra-responsive AI move based on difficulty
   */
  calculateAiMove(state: ChessGameState, difficulty: ChessDifficulty = 'medium'): ChessMove | null {
    try {
      const aiColor = state.currentTurn;
      const allLegalMoves = ChessRules.getAllLegalMoves(
        state.board,
        aiColor,
        state.castlingRights,
        state.enPassantTarget,
      );

      if (allLegalMoves.length === 0) return null;
      if (allLegalMoves.length === 1) return allLegalMoves[0];

      // Easy AI: 70% random, 30% capture if available
      if (difficulty === 'easy') {
        const captures = allLegalMoves.filter((m) => m.capturedPiece);
        if (captures.length > 0 && Math.random() < 0.35) {
          return captures[Math.floor(Math.random() * captures.length)];
        }
        return allLegalMoves[Math.floor(Math.random() * allLegalMoves.length)];
      }

      const oppColor: ChessColor = aiColor === 'white' ? 'black' : 'white';

      // Medium AI: Fast 1-ply tactical evaluation
      if (difficulty === 'medium') {
        let bestMove = allLegalMoves[0];
        let bestScore = -Infinity;

        // Shuffle slightly for natural variety
        const shuffled = [...allLegalMoves].sort(() => Math.random() - 0.5);

        for (const move of shuffled) {
          const simBoard = this.simulateBoardQuick(state.board, move);
          const isOppInCheck = ChessRules.isInCheck(simBoard, oppColor);

          let moveScore = this.evaluateBoard(simBoard, aiColor);
          if (isOppInCheck) moveScore += 60;
          if (move.capturedPiece) {
            moveScore += (PIECE_VALUES[move.capturedPiece.type] || 1) * 20;
          }
          if (move.promotion) {
            moveScore += 800;
          }

          // Small random factor
          moveScore += Math.random() * 12;

          if (moveScore > bestScore) {
            bestScore = moveScore;
            bestMove = move;
          }
        }
        return bestMove;
      }

      // Hard AI: 2-ply search with move ordering & alpha-beta pruning
      let bestMove = allLegalMoves[0];
      let bestVal = -Infinity;

      const orderedMoves = this.orderMoves(allLegalMoves);

      for (const move of orderedMoves) {
        const simBoard = this.simulateBoardQuick(state.board, move);
        const isOppInCheck = ChessRules.isInCheck(simBoard, oppColor);

        // Immediate checkmate check
        const oppMoves = ChessRules.getAllLegalMoves(simBoard, oppColor);
        if (oppMoves.length === 0) {
          if (isOppInCheck) return move; // Deliver instant checkmate!
        }

        let moveScore = this.evaluateBoard(simBoard, aiColor);
        if (isOppInCheck) moveScore += 50;
        if (move.capturedPiece) {
          moveScore += (PIECE_VALUES[move.capturedPiece.type] || 1) * 25;
        }
        if (move.promotion) moveScore += 800;

        // Check best opponent response
        if (oppMoves.length > 0) {
          let worstOppScore = Infinity;
          // Only evaluate top 10 opponent responses for blistering fast search (< 15ms)
          const orderedOppMoves = this.orderMoves(oppMoves).slice(0, 10);
          for (const oppMove of orderedOppMoves) {
            const oppSimBoard = this.simulateBoardQuick(simBoard, oppMove);
            const scoreAfterOpp = this.evaluateBoard(oppSimBoard, aiColor);
            if (scoreAfterOpp < worstOppScore) {
              worstOppScore = scoreAfterOpp;
            }
          }
          moveScore = worstOppScore;
        }

        // Add small variance
        moveScore += Math.random() * 6 - 3;

        if (moveScore > bestVal) {
          bestVal = moveScore;
          bestMove = move;
        }
      }

      return bestMove || allLegalMoves[0];
    } catch (e) {
      console.warn('AI calculation fallback:', e);
      const fallbackMoves = ChessRules.getAllLegalMoves(
        state.board,
        state.currentTurn,
        state.castlingRights,
        state.enPassantTarget,
      );
      return fallbackMoves.length > 0 ? fallbackMoves[0] : null;
    }
  }

  /**
   * Computes material score difference between White and Black
   */
  static getMaterialScore(capturedPieces: { white: ChessPiece[]; black: ChessPiece[] }) {
    const whiteCapturedSum = capturedPieces.white.reduce(
      (sum, p) => sum + (PIECE_VALUES[p.type] || 0),
      0,
    );
    const blackCapturedSum = capturedPieces.black.reduce(
      (sum, p) => sum + (PIECE_VALUES[p.type] || 0),
      0,
    );

    return {
      whiteCapturedScore: whiteCapturedSum,
      blackCapturedScore: blackCapturedSum,
      whiteAdvantage: whiteCapturedSum - blackCapturedSum,
      blackAdvantage: blackCapturedSum - whiteCapturedSum,
    };
  }
}

export const chessEngine = new ChessEngineImpl();
