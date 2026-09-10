// ─── Chess Types ─────────────────────────────────────────────────────────────

export type ChessPieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
export type ChessColor = 'white' | 'black';

export interface ChessPiece {
  id: string;
  type: ChessPieceType;
  color: ChessColor;
  hasMoved: boolean;
}

export type ChessBoard = (ChessPiece | null)[][];

export interface ChessPosition {
  row: number;
  col: number;
}

export interface ChessMove {
  from: ChessPosition;
  to: ChessPosition;
  promotion?: ChessPieceType;
}

export interface ChessGameState {
  board: ChessBoard;
  currentTurn: ChessColor;
  whitePlayerId: string;
  blackPlayerId: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  capturedPieces: { white: ChessPiece[]; black: ChessPiece[] };
  moveHistory: ChessMove[];
  whiteTimeLeft: number;
  blackTimeLeft: number;
}
