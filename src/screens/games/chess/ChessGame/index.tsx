import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import FastImage from 'react-native-fast-image';
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
import {
  CHESS_DEFAULT_TIME_SECONDS,
  ALL_CHESS_PIECE_ASSETS,
} from '../../../../gameEngine/chess/chessConstants';
import ChessBoardView from '../components/ChessBoardView';
import ChessPlayerBar from '../components/ChessPlayerBar';
import PawnPromotionModal from '../components/PawnPromotionModal';
import ChessActionModal, { ChessActionType } from '../components/ChessActionModal';
import { socketService } from '../../../../services/socket/socketService';
import { SOCKET_EVENTS } from '../../../../constants/socketConstants';
import { useAppSelector } from '../../../../redux/hooks';

export const ChessGameScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  // Fast GPU asset texture preloading
  useEffect(() => {
    try {
      const preloadList = ALL_CHESS_PIECE_ASSETS.map((asset) => {
        const source = Image.resolveAssetSource(asset);
        return { uri: source?.uri || '' };
      }).filter((item) => Boolean(item.uri));

      if (preloadList.length > 0) {
        FastImage.preload(preloadList);
      }
    } catch (e) {
      // Safe fallback
    }
  }, []);

  const userProfile = useAppSelector((state) => state.user.profile);
  const currentUserId = useAppSelector((state) => state.auth.userId) || 'guest_me';
  const customPlayer1Name = route.params?.player1Name;
  const customPlayer2Name = route.params?.player2Name;

  const playerName = customPlayer1Name || userProfile?.name || userProfile?.username || 'Player 1';
  const player2Name = customPlayer2Name || 'Player 2';
  const playerRating = userProfile?.gameStats?.find((g) => g.gameId === 'chess')?.rank || 1420;

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
      [
        playerName,
        mode === 'computer'
          ? 'AI Bot'
          : mode === 'local'
          ? player2Name
          : opponentData?.name || 'Opponent',
      ],
      initialTimeSeconds,
    ),
  );

  // Independent Clocks: Prevents 64-square full board re-renders on each second tick
  const [whiteTimeLeft, setWhiteTimeLeft] = useState<number>(initialTimeSeconds);
  const [blackTimeLeft, setBlackTimeLeft] = useState<number>(initialTimeSeconds);

  const [selectedPos, setSelectedPos] = useState<ChessPosition | null>(null);
  const [pendingPromotionMove, setPendingPromotionMove] = useState<{
    from: ChessPosition;
    to: ChessPosition;
  } | null>(null);
  const [isPromotionVisible, setIsPromotionVisible] = useState(false);
  const [isFlipped, setIsFlipped] = useState(myColor === 'black');
  const [modalAction, setModalAction] = useState<ChessActionType | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

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
          setWhiteTimeLeft(newState.whiteTimeLeft);
          setBlackTimeLeft(newState.blackTimeLeft);
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
        ],
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
        [{ text: 'OK' }],
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

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isAiThinkingRef = useRef(false);

  // Clock countdown timer (Updates only local time numbers without invalidating entire board)
  const isGameActive = gameState.gameStatus === 'in_progress' || gameState.gameStatus === 'check';

  useEffect(() => {
    if (!isGameActive || initialTimeSeconds === 0) {
      return;
    }

    const timer = setInterval(() => {
      const turn = gameStateRef.current.currentTurn;
      if (turn === 'white') {
        setWhiteTimeLeft((prev: number) => {
          const nextTime = Math.max(0, prev - 1);
          if (nextTime === 0) {
            setGameState((g) => ({
              ...g,
              whiteTimeLeft: 0,
              gameStatus: 'timeout',
              winner: 'black',
              winReason: 'White ran out of time! Black wins.',
            }));
          }
          return nextTime;
        });
      } else {
        setBlackTimeLeft((prev: number) => {
          const nextTime = Math.max(0, prev - 1);
          if (nextTime === 0) {
            setGameState((g) => ({
              ...g,
              blackTimeLeft: 0,
              gameStatus: 'timeout',
              winner: 'white',
              winReason: 'Black ran out of time! White wins.',
            }));
          }
          return nextTime;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameActive, initialTimeSeconds]);

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
          player1Name: playerName,
          player2Name,
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
    playerName,
    player2Name,
  ]);

  const aiColor = isFlipped ? 'white' : 'black';

  // AI Opponent Move Trigger (for VS Computer)
  useEffect(() => {
    if (
      mode === 'computer' &&
      gameState.currentTurn === aiColor &&
      (gameState.gameStatus === 'in_progress' || gameState.gameStatus === 'check')
    ) {
      if (isAiThinkingRef.current) return;
      isAiThinkingRef.current = true;
      setIsAiThinking(true);

      const aiDelay = Math.floor(400 + Math.random() * 350);

      const aiTimer = setTimeout(() => {
        requestAnimationFrame(() => {
          try {
            const currentState = gameStateRef.current;
            if (
              currentState.currentTurn === aiColor &&
              (currentState.gameStatus === 'in_progress' || currentState.gameStatus === 'check')
            ) {
              const aiMove = chessEngine.calculateAiMove(currentState, difficulty);
              if (aiMove) {
                const { newState, result } = chessEngine.applyMove(currentState, aiMove);
                if (result.isValid) {
                  setGameState(newState);
                  setWhiteTimeLeft(newState.whiteTimeLeft);
                  setBlackTimeLeft(newState.blackTimeLeft);
                } else {
                  const fallbackMoves = ChessRules.getAllLegalMoves(
                    currentState.board,
                    aiColor,
                    currentState.castlingRights,
                    currentState.enPassantTarget,
                  );
                  if (fallbackMoves.length > 0) {
                    const { newState: fallbackState } = chessEngine.applyMove(currentState, fallbackMoves[0]);
                    setGameState(fallbackState);
                    setWhiteTimeLeft(fallbackState.whiteTimeLeft);
                    setBlackTimeLeft(fallbackState.blackTimeLeft);
                  }
                }
              } else {
                const inCheck = ChessRules.isInCheck(currentState.board, aiColor);
                const opponentColor = aiColor === 'white' ? 'black' : 'white';
                setGameState((prev) => ({
                  ...prev,
                  gameStatus: inCheck ? 'checkmate' : 'stalemate',
                  winner: inCheck ? opponentColor : 'draw',
                  winReason: inCheck
                    ? `Checkmate! ${opponentColor.toUpperCase()} wins.`
                    : 'Stalemate — Draw!',
                }));
              }
            }
          } catch (err) {
            console.error('Error executing AI move:', err);
          } finally {
            isAiThinkingRef.current = false;
            setIsAiThinking(false);
          }
        });
      }, aiDelay);

      return () => {
        clearTimeout(aiTimer);
        isAiThinkingRef.current = false;
      };
    } else {
      isAiThinkingRef.current = false;
      setIsAiThinking(false);
    }
  }, [
    gameState.currentTurn,
    gameState.moveHistory.length,
    gameState.gameStatus,
    mode,
    difficulty,
    aiColor,
  ]);

  // Memoized Legal moves for currently selected square
  const legalMovesForSelected = useMemo(() => {
    if (!selectedPos) return [];
    return ChessRules.getLegalMoves(
      gameState.board,
      selectedPos,
      gameState.castlingRights,
      gameState.enPassantTarget,
    );
  }, [selectedPos, gameState.board, gameState.castlingRights, gameState.enPassantTarget]);

  // Stable Square Press handler
  const handleSquarePress = useCallback(
    (pos: ChessPosition) => {
      const currentState = gameStateRef.current;
      if (currentState.gameStatus !== 'in_progress' && currentState.gameStatus !== 'check') return;

      // In VS Computer: block if AI's turn
      if (mode === 'computer' && currentState.currentTurn === aiColor) return;

      // In Online Mode: block if not user's turn
      if (isOnlineMode && currentState.currentTurn !== myColor) return;

      const clickedPiece = currentState.board[pos.row][pos.col];

      // 1. If clicking own piece, select it
      if (clickedPiece && clickedPiece.color === currentState.currentTurn) {
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
          const movingPiece = currentState.board[selectedPos.row][selectedPos.col];

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
          const { newState, result } = chessEngine.applyMove(currentState, legalMove);
          if (result.isValid) {
            setGameState(newState);
            setWhiteTimeLeft(newState.whiteTimeLeft);
            setBlackTimeLeft(newState.blackTimeLeft);
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
    [selectedPos, legalMovesForSelected, mode, aiColor, isOnlineMode, myColor, matchId],
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
      setWhiteTimeLeft(newState.whiteTimeLeft);
      setBlackTimeLeft(newState.blackTimeLeft);
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

  const getInitials = (str: string, fallback: string) => {
    if (!str || str === 'You' || str === 'Player 1' || str === 'Player 2') return fallback;
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  // Bottom player is Logged-in Player / You; Top player is Player 2 / Opponent
  const topPlayerColor = isFlipped ? 'white' : 'black';
  const bottomPlayerColor = isFlipped ? 'black' : 'white';

  const topPlayerName =
    mode === 'local'
      ? topPlayerColor === 'white'
        ? `${player2Name} (White)`
        : `${player2Name} (Black)`
      : mode === 'computer'
      ? `AI Bot (${difficulty.toUpperCase()})`
      : opponentData?.name || 'Opponent';

  const bottomPlayerName =
    mode === 'local'
      ? bottomPlayerColor === 'white'
        ? `${playerName} (White)`
        : `${playerName} (Black)`
      : playerName;

  const topAvatarText =
    mode === 'local'
      ? getInitials(player2Name, 'P2')
      : mode === 'computer'
      ? 'AI'
      : getInitials(opponentData?.name || '', 'OP');

  const bottomAvatarText =
    mode === 'local'
      ? getInitials(playerName, 'P1')
      : getInitials(playerName, 'ME');

  const topPlayerTime =
    topPlayerColor === 'white' ? whiteTimeLeft : blackTimeLeft;
  const bottomPlayerTime =
    bottomPlayerColor === 'white' ? whiteTimeLeft : blackTimeLeft;

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
                : mode === 'private'
                ? 'Friend Match 1v1'
                : 'Pass & Play 1v1'}
            </Text>
            <Text style={styles.headerSub}>
              {gameState.gameStatus === 'check'
                ? '⚠️ CHECK!'
                : isOnlineMode
                ? isMyTurn
                  ? 'Your Turn ♟️'
                  : "Opponent's Turn..."
                : mode === 'local'
                ? gameState.currentTurn === bottomPlayerColor
                  ? `${playerName}'s Turn (${bottomPlayerColor === 'white' ? '♔ White' : '♚ Black'})`
                  : `${player2Name}'s Turn (${topPlayerColor === 'white' ? '♔ White' : '♚ Black'})`
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
          isMe={false}
          statusText={
            isAiThinking && gameState.currentTurn === topPlayerColor
              ? 'THINKING… 🤖'
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
          rating={playerRating}
          isCurrentTurn={gameState.currentTurn === bottomPlayerColor}
          timeLeftSeconds={bottomPlayerTime}
          capturedPieces={bottomCaptured}
          materialAdvantage={bottomAdvantage}
          isDark={isDark}
          isMe={mode !== 'local'}
        />
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
