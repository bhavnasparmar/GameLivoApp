import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import {
  ChessGameState,
  ChessMove,
  ChessPieceType,
  ChessPosition,
} from '../../../../gameEngine/chess/chessTypes';
import { chessEngine, ChessEngineImpl } from '../../../../gameEngine/chess/chessEngine';
import { ChessRules } from '../../../../gameEngine/chess/chessRules';
import { CHESS_DEFAULT_TIME_SECONDS } from '../../../../gameEngine/chess/chessConstants';
import ChessBoardView from '../components/ChessBoardView';
import ChessPlayerBar from '../components/ChessPlayerBar';
import PawnPromotionModal from '../components/PawnPromotionModal';
import ChessMoveHistoryBar from '../components/ChessMoveHistoryBar';
import ChessActionModal, { ChessActionType } from '../components/ChessActionModal';
import { socketService } from '../../../../services/socket/socketService';
import { SOCKET_EVENTS } from '../../../../constants/socketConstants';
import { useAppSelector } from '../../../../redux/hooks';

const { width } = Dimensions.get('window');

export const ChessGameScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const currentUserId = useAppSelector((state) => state.auth.userId) || 'guest_me';
  const username = userProfile?.username || 'You';

  const matchId = route.params?.matchId || `chess_${Date.now()}`;
  const mode = route.params?.mode || 'computer'; // 'computer' | 'local' | 'random' | 'private'
  const difficulty = route.params?.difficulty || 'medium';
  const initialTimeSeconds = route.params?.timeSeconds || CHESS_DEFAULT_TIME_SECONDS;
  const myColor: 'white' | 'black' = route.params?.myColor || 'white';
  const opponentData = route.params?.opponent || null;

  const isOnlineMode = mode === 'random' || mode === 'private';

  // Game Engine State
  const [gameState, setGameState] = useState<ChessGameState>(() =>
    chessEngine.getInitialState(
      ['You', mode === 'computer' ? 'AI Bot' : opponentData?.name || 'Opponent'],
      initialTimeSeconds,
    ),
  );

  const [selectedPos, setSelectedPos] = useState<ChessPosition | null>(null);
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{
    from: ChessPosition;
    to: ChessPosition;
  } | null>(null);
  const [isPromotionVisible, setIsPromotionVisible] = useState(false);
  const [isFlipped, setIsFlipped] = useState(myColor === 'black');
  const [modalAction, setModalAction] = useState<ChessActionType | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [incomingDrawOffer, setIncomingDrawOffer] = useState<{ from: string } | null>(null);

  // Check alert banner animation
  const checkBannerOpacity = useRef(new Animated.Value(0)).current;

  // Check if any move has been played yet
  const isGameStarted = gameState.moveHistory.length > 0;

  const handleFlipBoard = () => {
    if (isGameStarted) {
      Alert.alert(
        'Board Locked',
        'Board orientation can only be flipped before the first move is made.',
      );
      return;
    }
    setIsFlipped((prev) => !prev);
  };

  // Socket multiplayer listeners
  useEffect(() => {
    if (!isOnlineMode) return;

    if (!socketService.isConnected()) {
      socketService.connect();
    }

    // Join match room
    socketService.emit(SOCKET_EVENTS.GAME_STATE, { matchId });

    // Handle remote player move
    const handleRemoteMove = (data: any) => {
      if (data.userId && data.userId === currentUserId) return;
      const moveData = data.moveData?.move || data.moveData;
      if (moveData && moveData.from && moveData.to) {
        setGameState((prev) => {
          const { newState } = chessEngine.applyMove(prev, moveData);
          return newState;
        });
      }
    };

    // Handle draw offer from opponent
    const handleDrawOffer = (data: { userId: string; username: string }) => {
      Alert.alert(
        '🤝 Draw Offered',
        `${data.username || 'Opponent'} is offering a draw. Do you accept?`,
        [
          {
            text: 'Decline',
            style: 'cancel',
            onPress: () => {
              socketService.emit(SOCKET_EVENTS.MATCH_DRAW_RESPONSE, {
                matchId,
                accepted: false,
              });
            },
          },
          {
            text: 'Accept Draw',
            onPress: () => {
              socketService.emit(SOCKET_EVENTS.MATCH_DRAW_RESPONSE, {
                matchId,
                accepted: true,
              });
            },
          },
        ]
      );
    };

    // Handle draw decline
    const handleDrawResponse = (data: { accepted: boolean }) => {
      if (!data.accepted) {
        Alert.alert('Draw Declined', 'Opponent declined the draw offer.');
      }
    };

    // Handle game over from backend
    const handleRemoteGameOver = (data: { winnerId: string; reason?: string }) => {
      const isDraw = data.winnerId === 'draw';
      const isWinner = data.winnerId === currentUserId;
      const winningColor = isDraw
        ? 'draw'
        : isWinner
        ? myColor
        : myColor === 'white'
        ? 'black'
        : 'white';

      setGameState((prev) => ({
        ...prev,
        gameStatus: isDraw ? 'draw_agreement' : 'checkmate',
        winner: winningColor,
        winReason: data.reason || (isDraw ? 'Draw agreed' : `${data.winnerId} won`),
      }));
    };

    // Handle player disconnected
    const handlePlayerDisconnected = (data: { username?: string }) => {
      Alert.alert(
        'Player Disconnected',
        `${data.username || 'Opponent'} has disconnected.`,
        [{ text: 'OK' }]
      );
    };

    socketService.on(SOCKET_EVENTS.GAME_MOVE, handleRemoteMove);
    socketService.on(SOCKET_EVENTS.MATCH_DRAW_OFFER, handleDrawOffer);
    socketService.on(SOCKET_EVENTS.MATCH_DRAW_RESPONSE, handleDrawResponse);
    socketService.on(SOCKET_EVENTS.GAME_OVER, handleRemoteGameOver);
    socketService.on(SOCKET_EVENTS.PLAYER_DISCONNECT, handlePlayerDisconnected);

    return () => {
      socketService.off(SOCKET_EVENTS.GAME_MOVE);
      socketService.off(SOCKET_EVENTS.MATCH_DRAW_OFFER);
      socketService.off(SOCKET_EVENTS.MATCH_DRAW_RESPONSE);
      socketService.off(SOCKET_EVENTS.GAME_OVER);
      socketService.off(SOCKET_EVENTS.PLAYER_DISCONNECT);
    };
  }, [isOnlineMode, matchId, currentUserId, myColor]);

  // Clock countdown timer
  useEffect(() => {
    if (gameState.gameStatus !== 'in_progress' && gameState.gameStatus !== 'check') {
      return;
    }

    if (initialTimeSeconds === 0) return; // Unlimited time mode

    const timer = setInterval(() => {
      setGameState((prev) => {
        if (prev.gameStatus !== 'in_progress' && prev.gameStatus !== 'check') {
          return prev;
        }

        if (prev.currentTurn === 'white') {
          const nextTime = Math.max(0, prev.whiteTimeLeft - 1);
          if (nextTime === 0) {
            return {
              ...prev,
              whiteTimeLeft: 0,
              gameStatus: 'timeout',
              winner: 'black',
              winReason: 'White ran out of time! Black wins.',
            };
          }
          return { ...prev, whiteTimeLeft: nextTime };
        } else {
          const nextTime = Math.max(0, prev.blackTimeLeft - 1);
          if (nextTime === 0) {
            return {
              ...prev,
              blackTimeLeft: 0,
              gameStatus: 'timeout',
              winner: 'white',
              winReason: 'Black ran out of time! White wins.',
            };
          }
          return { ...prev, blackTimeLeft: nextTime };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gameStatus, initialTimeSeconds]);

  // Check status banner trigger
  useEffect(() => {
    if (gameState.isCheck && !gameState.isCheckmate) {
      Animated.sequence([
        Animated.timing(checkBannerOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(checkBannerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [gameState.isCheck, gameState.isCheckmate, checkBannerOpacity]);

  // Handle Game Over Navigation to ChessResult
  useEffect(() => {
    if (gameState.gameStatus !== 'in_progress' && gameState.gameStatus !== 'check') {
      // If online mode, notify backend
      if (isOnlineMode) {
        socketService.emit(SOCKET_EVENTS.GAME_OVER, {
          matchId,
          winnerId:
            gameState.winner === 'draw'
              ? 'draw'
              : gameState.winner === myColor
              ? currentUserId
              : opponentData?.userId || 'opponent',
          reason: gameState.winReason,
        });
      }

      const timeout = setTimeout(() => {
        navigation.replace(ROUTES.CHESS_RESULT, {
          matchId,
          gameState,
          mode,
          difficulty,
          myColor,
        });
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [
    gameState.gameStatus,
    gameState,
    matchId,
    mode,
    difficulty,
    navigation,
    isOnlineMode,
    myColor,
    currentUserId,
    opponentData,
  ]);

  const humanColor = isFlipped ? 'black' : 'white';
  const aiColor = isFlipped ? 'white' : 'black';

  // AI Opponent Move Trigger (for VS Computer)
  useEffect(() => {
    if (
      mode === 'computer' &&
      gameState.currentTurn === aiColor &&
      (gameState.gameStatus === 'in_progress' || gameState.gameStatus === 'check')
    ) {
      setIsAiThinking(true);
      const aiDelay = Math.floor(400 + Math.random() * 500);

      const aiTimer = setTimeout(() => {
        const aiMove = chessEngine.calculateAiMove(gameState, difficulty);
        if (aiMove) {
          const { newState } = chessEngine.applyMove(gameState, aiMove);
          setGameState(newState);
        }
        setIsAiThinking(false);
      }, aiDelay);

      return () => clearTimeout(aiTimer);
    }
  }, [gameState, mode, difficulty, aiColor]);

  // Legal moves for currently selected square
  const legalMovesForSelected = selectedPos
    ? ChessRules.getLegalMoves(
        gameState.board,
        selectedPos,
        gameState.castlingRights,
        gameState.enPassantTarget,
      )
    : [];

  // Square Press handler
  const handleSquarePress = useCallback(
    (pos: ChessPosition) => {
      if (gameState.gameStatus !== 'in_progress' && gameState.gameStatus !== 'check') return;

      // In VS Computer: block if AI's turn
      if (mode === 'computer' && gameState.currentTurn === aiColor) return;

      // In Online Mode: block if not user's turn
      if (isOnlineMode && gameState.currentTurn !== myColor) return;

      const clickedPiece = gameState.board[pos.row][pos.col];

      // 1. If clicking own piece, select it
      if (clickedPiece && clickedPiece.color === gameState.currentTurn) {
        if (isOnlineMode && clickedPiece.color !== myColor) return;
        setSelectedPos(pos);
        return;
      }

      // 2. If a piece is already selected, check if target is a legal destination
      if (selectedPos) {
        const legalMove = legalMovesForSelected.find(
          (m) => m.to.row === pos.row && m.to.col === pos.col,
        );

        if (legalMove) {
          const movingPiece = gameState.board[selectedPos.row][selectedPos.col];

          // Check if move requires Pawn Promotion choice
          if (
            movingPiece &&
            movingPiece.type === 'pawn' &&
            (pos.row === 0 || pos.row === 7)
          ) {
            setPendingPromotionMove({ from: selectedPos, to: pos });
            setIsPromotionVisible(true);
            return;
          }

          // Apply move locally
          const { newState, result } = chessEngine.applyMove(gameState, legalMove);
          if (result.isValid) {
            setGameState(newState);
            setSelectedPos(null);

            // Broadcast move over socket in online multiplayer
            if (isOnlineMode) {
              socketService.emit(SOCKET_EVENTS.GAME_MOVE, {
                matchId,
                moveData: {
                  move: legalMove,
                  board: newState.board,
                  currentTurn: newState.currentTurn,
                  whiteTimeLeft: newState.whiteTimeLeft,
                  blackTimeLeft: newState.blackTimeLeft,
                },
              });
            }
          }
        } else {
          // Deselect if clicking an invalid square
          setSelectedPos(null);
        }
      }
    },
    [gameState, selectedPos, legalMovesForSelected, mode, aiColor, isOnlineMode, myColor, matchId],
  );

  // Pawn Promotion confirmation
  const handlePromotionSelect = (promoType: ChessPieceType) => {
    if (!pendingPromotionMove) return;

    const promoMove: ChessMove = {
      from: pendingPromotionMove.from,
      to: pendingPromotionMove.to,
      piece: gameState.board[pendingPromotionMove.from.row][pendingPromotionMove.from.col]!,
      moveType: 'promotion',
      promotion: promoType,
    };

    const { newState, result } = chessEngine.applyMove(gameState, promoMove);
    if (result.isValid) {
      setGameState(newState);
      setSelectedPos(null);
      setPendingPromotionMove(null);
      setIsPromotionVisible(false);

      if (isOnlineMode) {
        socketService.emit(SOCKET_EVENTS.GAME_MOVE, {
          matchId,
          moveData: {
            move: promoMove,
            board: newState.board,
            currentTurn: newState.currentTurn,
            whiteTimeLeft: newState.whiteTimeLeft,
            blackTimeLeft: newState.blackTimeLeft,
          },
        });
      }
    }
  };

  // Resign & Draw actions
  const handleConfirmAction = () => {
    if (modalAction === 'resign') {
      const resigningColor = isOnlineMode ? myColor : gameState.currentTurn;
      const winningColor = resigningColor === 'white' ? 'black' : 'white';

      if (isOnlineMode) {
        socketService.emit(SOCKET_EVENTS.MATCH_RESIGN, { matchId });
      }

      setGameState((prev) => ({
        ...prev,
        gameStatus: 'resigned',
        winner: winningColor,
        winReason: `${resigningColor.toUpperCase()} resigned. ${winningColor.toUpperCase()} wins!`,
      }));
    } else if (modalAction === 'draw') {
      if (isOnlineMode) {
        socketService.emit(SOCKET_EVENTS.MATCH_DRAW_OFFER, { matchId });
        Alert.alert('Draw Offer Sent', 'Waiting for opponent to accept or decline 🤝');
      } else {
        setGameState((prev) => ({
          ...prev,
          gameStatus: 'draw_agreement',
          winner: 'draw',
          winReason: 'Draw agreed by both players 🤝',
        }));
      }
    }
    setModalAction(null);
  };

  const materialScore = ChessEngineImpl.getMaterialScore(gameState.capturedPieces);

  // Bottom player is Player 1 / You; Top player is Player 2 / Opponent
  const topPlayerColor = isFlipped ? 'white' : 'black';
  const bottomPlayerColor = isFlipped ? 'black' : 'white';

  const topPlayerName =
    mode === 'local'
      ? topPlayerColor === 'white'
        ? 'Player 2 (White)'
        : 'Player 2 (Black)'
      : mode === 'computer'
      ? `AI Bot (${difficulty.toUpperCase()})`
      : opponentData?.name || 'Opponent';

  const bottomPlayerName =
    mode === 'local'
      ? bottomPlayerColor === 'white'
        ? 'Player 1 (White)'
        : 'Player 1 (Black)'
      : username;

  const topAvatarText =
    mode === 'local'
      ? 'P2'
      : mode === 'computer'
      ? 'AI'
      : 'OP';

  const bottomAvatarText =
    mode === 'local'
      ? 'P1'
      : 'ME';

  const topPlayerTime =
    topPlayerColor === 'white' ? gameState.whiteTimeLeft : gameState.blackTimeLeft;
  const bottomPlayerTime =
    bottomPlayerColor === 'white' ? gameState.whiteTimeLeft : gameState.blackTimeLeft;

  const topCaptured =
    topPlayerColor === 'white'
      ? gameState.capturedPieces.white
      : gameState.capturedPieces.black;
  const bottomCaptured =
    bottomPlayerColor === 'white'
      ? gameState.capturedPieces.white
      : gameState.capturedPieces.black;

  const topAdvantage =
    topPlayerColor === 'white'
      ? materialScore.whiteAdvantage
      : materialScore.blackAdvantage;
  const bottomAdvantage =
    bottomPlayerColor === 'white'
      ? materialScore.whiteAdvantage
      : materialScore.blackAdvantage;

  const isMyTurn = isOnlineMode
    ? gameState.currentTurn === myColor
    : true;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#08100C' : '#F2F7F4' }]}>
      <StatusBar barStyle="light-content" />

      {/* Top App Bar with Royal Emerald Gradient */}
      <LinearGradient
        colors={isDark ? ['#0F3628', '#0A2019', '#061611'] : ['#155A3F', '#0F4530', '#0B3323']}
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 8, 26) }]}
      >
        <View style={styles.appBarRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerBtn}
            onPress={() => setModalAction('resign')}
          >
            <Text style={styles.headerBtnIcon}>✕</Text>
          </TouchableOpacity>

          <View style={styles.titleCenter}>
            <Text style={styles.headerTitle}>
              {mode === 'computer'
                ? `Chess vs AI (${difficulty})`
                : mode === 'random'
                ? 'Quick Match 1v1'
                : 'Chess Match 1v1'}
            </Text>
            <Text style={styles.headerSub}>
              {gameState.gameStatus === 'check'
                ? '⚠️ CHECK!'
                : isOnlineMode
                ? isMyTurn
                  ? 'Your Turn ♟️'
                  : "Opponent's Turn..."
                : gameState.currentTurn === 'white'
                ? "White's Turn ♔"
                : "Black's Turn ♚"}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.headerBtn}
            onPress={() => setModalAction('draw')}
          >
            <Text style={styles.headerBtnIcon}>🤝</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Check Alert Banner */}
      <Animated.View
        style={[styles.checkAlertBanner, { opacity: checkBannerOpacity }]}
        pointerEvents="none"
      >
        <Text style={styles.checkAlertText}>⚠️ KING IS IN CHECK!</Text>
      </Animated.View>

      {/* Main Game Screen Board Area */}
      <View style={styles.boardArea}>
        {/* Top Opponent Player Bar */}
        <ChessPlayerBar
          name={topPlayerName}
          avatarText={topAvatarText}
          color={topPlayerColor}
          rating={opponentData?.rating || 1380}
          isCurrentTurn={gameState.currentTurn === topPlayerColor}
          timeLeftSeconds={topPlayerTime}
          capturedPieces={topCaptured}
          materialAdvantage={topAdvantage}
          isDark={isDark}
          statusText={
            isAiThinking && gameState.currentTurn === topPlayerColor
              ? 'Thinking… 🤖'
              : undefined
          }
        />

        {/* 3D Interactive Chess Board */}
        <View style={styles.boardContainer}>
          <ChessBoardView
            board={gameState.board}
            selectedPos={selectedPos}
            legalMoves={legalMovesForSelected}
            lastMove={gameState.lastMove}
            isCheck={gameState.isCheck}
            currentTurn={gameState.currentTurn}
            isFlipped={isFlipped}
            onSquarePress={handleSquarePress}
            themeKey="woodEmerald"
          />
        </View>

        {/* Bottom Current Player Bar */}
        <ChessPlayerBar
          name={bottomPlayerName}
          avatarText={bottomAvatarText}
          color={bottomPlayerColor}
          rating={1420}
          isCurrentTurn={gameState.currentTurn === bottomPlayerColor}
          timeLeftSeconds={bottomPlayerTime}
          capturedPieces={bottomCaptured}
          materialAdvantage={bottomAdvantage}
          isDark={isDark}
        />

        {/* Move History Algebraic Notation Ribbon */}
        <ChessMoveHistoryBar moves={gameState.moveHistory} isDark={isDark} />
      </View>

      {/* Action Footer Controls */}
      <View style={[styles.footerControls, { paddingBottom: Math.max(insets.bottom + 6, 16) }]}>
        <TouchableOpacity
          activeOpacity={isGameStarted ? 0.9 : 0.8}
          style={[
            styles.controlBtn,
            { backgroundColor: isDark ? '#141E18' : '#FFFFFF' },
            isGameStarted && styles.disabledControlBtn,
          ]}
          onPress={handleFlipBoard}
        >
          <Text
            style={[
              styles.controlBtnText,
              isGameStarted && { color: isDark ? '#55665C' : '#9EB0A5' },
            ]}
          >
            {isGameStarted ? '🔒 Board Locked' : '🔄 Flip Board'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.controlBtn, { backgroundColor: isDark ? '#141E18' : '#FFFFFF' }]}
          onPress={() => setModalAction('draw')}
        >
          <Text style={styles.controlBtnText}>🤝 Offer Draw</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.controlBtn, styles.resignBtn]}
          onPress={() => setModalAction('resign')}
        >
          <Text style={[styles.controlBtnText, { color: '#E6483A' }]}>🏳️ Resign</Text>
        </TouchableOpacity>
      </View>

      {/* Pawn Promotion Dialog */}
      <PawnPromotionModal
        visible={isPromotionVisible}
        color={gameState.currentTurn}
        onSelect={handlePromotionSelect}
      />

      {/* Resign / Draw Modal */}
      <ChessActionModal
        visible={modalAction !== null}
        type={modalAction || 'resign'}
        onConfirm={handleConfirmAction}
        onCancel={() => setModalAction(null)}
        isDark={isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  appBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  titleCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#F0C64A',
    marginTop: 2,
  },
  checkAlertBanner: {
    backgroundColor: '#E6483A',
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkAlertText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  boardArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  footerControls: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  controlBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  disabledControlBtn: {
    opacity: 0.45,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  resignBtn: {
    borderColor: 'rgba(230, 72, 58, 0.35)',
    backgroundColor: 'rgba(230, 72, 58, 0.12)',
  },
  controlBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#D4E2D8',
  },
});

export default ChessGameScreen;
