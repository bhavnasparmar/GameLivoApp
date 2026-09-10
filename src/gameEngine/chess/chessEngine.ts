import { ChessGameState, ChessMove, ChessBoard } from './chessTypes';
import { CHESS_BOARD_SIZE, CHESS_DEFAULT_TIME_SECONDS } from './chessConstants';
import { BaseGameEngine, MoveResult } from '../common/gameTypes';

// ─── Chess Engine ─────────────────────────────────────────────────────────────

const createInitialBoard = (): ChessBoard => {
  // Returns an 8x8 board with pieces in starting positions
  // Row 0 = black pieces, Row 7 = white pieces
  const board: ChessBoard = Array.from({ length: CHESS_BOARD_SIZE }, () =>
    Array(CHESS_BOARD_SIZE).fill(null),
  );
  // TODO: Place all pieces on starting squares
  return board;
};

class ChessEngineImpl implements BaseGameEngine<ChessGameState, ChessMove> {
  getInitialState(playerIds: string[]): ChessGameState {
    const [whitePlayerId, blackPlayerId] = playerIds;
    return {
      board: createInitialBoard(),
      currentTurn: 'white',
      whitePlayerId,
      blackPlayerId,
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      capturedPieces: { white: [], black: [] },
      moveHistory: [],
      whiteTimeLeft: CHESS_DEFAULT_TIME_SECONDS,
      blackTimeLeft: CHESS_DEFAULT_TIME_SECONDS,
    };
  }

  applyMove(
    state: ChessGameState,
    move: ChessMove,
    _playerId: string,
  ): { newState: ChessGameState; result: MoveResult } {
    const newState = JSON.parse(JSON.stringify(state)) as ChessGameState;
    const piece = newState.board[move.from.row][move.from.col];
    if (!piece) return { newState, result: { isValid: false, reason: 'No piece at position' } };

    // Move piece
    newState.board[move.to.row][move.to.col] = piece;
    newState.board[move.from.row][move.from.col] = null;
    newState.moveHistory.push(move);
    newState.currentTurn = state.currentTurn === 'white' ? 'black' : 'white';

    return { newState, result: { isValid: true, nextPlayerId: newState.currentTurn === 'white' ? state.whitePlayerId : state.blackPlayerId } };
  }

  isValidMove(state: ChessGameState, move: ChessMove, _playerId: string): boolean {
    return !!state.board[move.from.row]?.[move.from.col];
  }

  isGameOver(state: ChessGameState): boolean {
    return state.isCheckmate || state.isStalemate;
  }

  getWinner(state: ChessGameState): string | null {
    if (!state.isCheckmate) return null;
    return state.currentTurn === 'black' ? state.whitePlayerId : state.blackPlayerId;
  }
}

export const chessEngine = new ChessEngineImpl();
