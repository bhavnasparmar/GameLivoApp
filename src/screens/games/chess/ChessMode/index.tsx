import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../theme';
import { ROUTES } from '../../../../navigation/routes';
import { ChessDifficulty, ChessTimePreset } from '../../../../gameEngine/chess/chessTypes';
import { CHESS_TIME_PRESETS } from '../../../../gameEngine/chess/chessConstants';
import { useAppSelector } from '../../../../redux/hooks';

const { width } = Dimensions.get('window');

type ActiveTab = 'setup' | 'rules';

interface AiLevelOption {
  id: ChessDifficulty;
  title: string;
  subtitle: string;
  emoji: string;
  badge: string;
  gradient: string[];
}

const AI_LEVELS: AiLevelOption[] = [
  {
    id: 'easy',
    title: 'Easy AI',
    subtitle: 'Casual & forgiving. Great for warmups',
    emoji: '🙂',
    badge: 'Beginner',
    gradient: ['#1F9D55', '#0D5230'],
  },
  {
    id: 'medium',
    title: 'Medium AI',
    subtitle: 'Balanced tactical challenge',
    emoji: '😐',
    badge: 'Intermediate',
    gradient: ['#D4A017', '#9C6C0C'],
  },
  {
    id: 'hard',
    title: 'Hard AI',
    subtitle: 'Minimax positional master. Plays to win',
    emoji: '😈',
    badge: 'Grandmaster',
    gradient: ['#E6483A', '#8F1D13'],
  },
];

const CHESS_RULES_CONTENT = [
  {
    glyph: '♔',
    title: 'The King',
    text: 'Moves 1 square in any direction. Cannot move onto an attacked square. If under attack, you are in Check and must escape!',
  },
  {
    glyph: '♕',
    title: 'The Queen',
    text: 'The most powerful piece! Moves any number of squares along ranks, files, or diagonals.',
  },
  {
    glyph: '♖',
    title: 'The Rook',
    text: 'Moves any number of squares horizontally or vertically. Participates in castling with the King.',
  },
  {
    glyph: '♗',
    title: 'The Bishop',
    text: 'Moves any number of squares diagonally. Stays on the same color square throughout the match.',
  },
  {
    glyph: '♘',
    title: 'The Knight',
    text: 'Moves in an "L" shape (2 squares + 1 square). The only piece that can jump over other pieces!',
  },
  {
    glyph: '♙',
    title: 'The Pawn & Promotion',
    text: 'Moves forward 1 square (or 2 on initial move). Captures 1 square diagonally. When it reaches the 8th rank, it promotes to a Queen, Rook, Bishop, or Knight!',
  },
  {
    glyph: '🏰',
    title: 'Castling (O-O & O-O-O)',
    text: 'King moves 2 squares toward Rook and Rook jumps over. Allowed only if neither piece has moved, path is clear, and King does not cross through check.',
  },
  {
    glyph: '⚡',
    title: 'En Passant',
    text: 'If opponent advances pawn 2 squares and lands beside yours, you can capture it diagonally on the very next turn as if it had only moved 1 square.',
  },
  {
    glyph: '🏆',
    title: 'Checkmate vs Stalemate',
    text: 'Checkmate: King is in check with no legal escape = WIN! Stalemate: King is NOT in check but player has no legal moves = DRAW.',
  },
];

export const ChessModeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const loggedInName = userProfile?.name || userProfile?.username || 'Player 1';

  const initialMode = route.params?.initialMode || 'computer';
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    initialMode === 'rules' ? 'rules' : 'setup',
  );
  const [gameMode, setGameMode] = useState<'computer' | 'local'>(
    initialMode === 'local' ? 'local' : 'computer',
  );
  const [player1Name, setPlayer1Name] = useState(loggedInName);
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [selectedDifficulty, setSelectedDifficulty] = useState<ChessDifficulty>('medium');
  const [selectedTimePreset, setSelectedTimePreset] = useState<ChessTimePreset>(CHESS_TIME_PRESETS[2]); // 5 min Rapid

  useEffect(() => {
    if (loggedInName && player1Name === 'Player 1') {
      setPlayer1Name(loggedInName);
    }
  }, [loggedInName]);

  const getInitials = (str: string, fallback: string) => {
    if (!str || str === 'Player 1' || str === 'Player 2') return fallback;
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase() || fallback;
  };

  const handleStartGame = () => {
    navigation.navigate(ROUTES.CHESS_GAME, {
      matchId: `local_${Date.now()}`,
      mode: gameMode,
      difficulty: selectedDifficulty,
      timeSeconds: selectedTimePreset.seconds,
      player1Name: player1Name.trim() || loggedInName,
      player2Name: player2Name.trim() || 'Player 2',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A120E' : '#F4F9F5' }]}>
      <StatusBar barStyle="light-content" />

      {/* App Bar */}
      <LinearGradient
        colors={isDark ? ['#0F3628', '#0A2019', '#061611'] : ['#155A3F', '#0F4530', '#0B3323']}
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 10, 28) }]}
      >
        <View style={styles.appBarRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>
            {gameMode === 'computer' ? 'Play vs Computer' : 'Pass & Play Setup'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabPillWrap}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, activeTab === 'setup' && styles.activeTabBtn]}
            onPress={() => setActiveTab('setup')}
          >
            <Text style={[styles.tabText, activeTab === 'setup' && styles.activeTabText]}>
              ⚙️ Game Setup
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, activeTab === 'rules' && styles.activeTabBtn]}
            onPress={() => setActiveTab('rules')}
          >
            <Text style={[styles.tabText, activeTab === 'rules' && styles.activeTabText]}>
              📖 Rules & Guide
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {activeTab === 'setup' ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Mode toggle (Computer vs Local) */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#D4A017' : '#9E740C' }]}>
              OPPONENT TYPE
            </Text>
          </View>
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.modeToggleBtn,
                gameMode === 'computer' && styles.activeModeToggle,
                { backgroundColor: isDark ? '#141A16' : '#FFFFFF' },
              ]}
              onPress={() => setGameMode('computer')}
            >
              <Text style={styles.modeToggleIcon}>🤖</Text>
              <Text style={[styles.modeToggleText, { color: isDark ? '#FFF' : '#1A2318' }]}>
                VS AI Bot
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.modeToggleBtn,
                gameMode === 'local' && styles.activeModeToggle,
                { backgroundColor: isDark ? '#141A16' : '#FFFFFF' },
              ]}
              onPress={() => setGameMode('local')}
            >
              <Text style={styles.modeToggleIcon}>👥</Text>
              <Text style={[styles.modeToggleText, { color: isDark ? '#FFF' : '#1A2318' }]}>
                Pass & Play (2P)
              </Text>
            </TouchableOpacity>
          </View>

          {/* AI Difficulty Section */}
          {gameMode === 'computer' && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#D4A017' : '#9E740C' }]}>
                  AI DIFFICULTY
                </Text>
              </View>
              <View style={styles.aiCardsCol}>
                {AI_LEVELS.map((lvl) => {
                  const isSelected = selectedDifficulty === lvl.id;
                  return (
                    <TouchableOpacity
                      key={lvl.id}
                      activeOpacity={0.82}
                      style={[
                        styles.aiCard,
                        {
                          backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                          borderColor: isSelected
                            ? '#F0C64A'
                            : isDark
                            ? 'rgba(255,255,255,0.07)'
                            : '#E0ECE4',
                        },
                        isSelected && styles.activeAiCardGlow,
                      ]}
                      onPress={() => setSelectedDifficulty(lvl.id)}
                    >
                      <View style={styles.aiLeft}>
                        <LinearGradient colors={lvl.gradient} style={styles.aiIconWrap}>
                          <Text style={styles.aiEmoji}>{lvl.emoji}</Text>
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                          <View style={styles.aiHeaderRow}>
                            <Text style={[styles.aiTitle, { color: isDark ? '#FFF' : '#1A2318' }]}>
                              {lvl.title}
                            </Text>
                            <View style={styles.aiBadgeWrap}>
                              <Text style={styles.aiBadgeText}>{lvl.badge}</Text>
                            </View>
                          </View>
                          <Text style={[styles.aiSubtitle, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                            {lvl.subtitle}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleActive,
                        ]}
                      >
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Players Setup for Pass & Play */}
          {gameMode === 'local' && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#D4A017' : '#9E740C' }]}>
                  PLAYERS SETUP
                </Text>
              </View>

              <View style={styles.playersSetupCol}>
                {/* Player 1 (White ♔) */}
                <View
                  style={[
                    styles.playerSetupCard,
                    {
                      backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                      borderColor: '#1F9D55',
                    },
                  ]}
                >
                  <LinearGradient colors={['#F0C64A', '#D4A017']} style={styles.playerSetupAvatar}>
                    <Text style={styles.playerSetupAvatarText}>
                      {getInitials(player1Name, 'P1')}
                    </Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <View style={styles.playerSetupHeaderRow}>
                      <Text style={[styles.playerSetupLabel, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                        PLAYER 1 (WHITE ♔)
                      </Text>
                      <View style={styles.playerYouBadge}>
                        <Text style={styles.playerYouBadgeText}>YOU</Text>
                      </View>
                    </View>
                    <TextInput
                      style={[
                        styles.playerSetupInput,
                        {
                          color: isDark ? '#FFF' : '#1A2318',
                          borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#D0E5D8',
                        },
                      ]}
                      value={player1Name}
                      onChangeText={setPlayer1Name}
                      placeholder="Player 1 Name"
                      placeholderTextColor={isDark ? '#5C7A6A' : '#96A1AD'}
                      maxLength={18}
                    />
                  </View>
                </View>

                {/* Player 2 (Black ♚) */}
                <View
                  style={[
                    styles.playerSetupCard,
                    {
                      backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                      borderColor: '#2668D9',
                    },
                  ]}
                >
                  <LinearGradient colors={['#2668D9', '#153E8A']} style={styles.playerSetupAvatar}>
                    <Text style={styles.playerSetupAvatarText}>
                      {getInitials(player2Name || 'Player 2', 'P2')}
                    </Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <View style={styles.playerSetupHeaderRow}>
                      <Text style={[styles.playerSetupLabel, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                        PLAYER 2 (BLACK ♚)
                      </Text>
                      <View style={[styles.playerYouBadge, { backgroundColor: 'rgba(38,104,217,0.18)' }]}>
                        <Text style={[styles.playerYouBadgeText, { color: '#4A90E2' }]}>OPPONENT</Text>
                      </View>
                    </View>
                    <TextInput
                      style={[
                        styles.playerSetupInput,
                        {
                          color: isDark ? '#FFF' : '#1A2318',
                          borderColor: isDark ? 'rgba(38,104,217,0.4)' : '#A8C7F7',
                        },
                      ]}
                      value={player2Name}
                      onChangeText={setPlayer2Name}
                      placeholder="Enter Player 2 name (e.g. Rahul)"
                      placeholderTextColor={isDark ? '#5C7A6A' : '#96A1AD'}
                      maxLength={18}
                    />
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Time Preset Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#D4A017' : '#9E740C' }]}>
              TIME CONTROL
            </Text>
          </View>
          <View style={styles.timePresetsGrid}>
            {CHESS_TIME_PRESETS.map((preset) => {
              const isSelected = selectedTimePreset.id === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  activeOpacity={0.8}
                  style={[
                    styles.timePresetBtn,
                    {
                      backgroundColor: isSelected
                        ? '#D4A017'
                        : isDark
                        ? '#141A16'
                        : '#FFFFFF',
                      borderColor: isSelected
                        ? '#F0C64A'
                        : isDark
                        ? 'rgba(255,255,255,0.08)'
                        : '#E0ECE4',
                    },
                  ]}
                  onPress={() => setSelectedTimePreset(preset)}
                >
                  <Text
                    style={[
                      styles.timePresetLabel,
                      { color: isSelected ? '#1A1202' : isDark ? '#F1F4F7' : '#1A2318' },
                    ]}
                  >
                    {preset.label}
                  </Text>
                  <Text
                    style={[
                      styles.timePresetTag,
                      { color: isSelected ? '#3E2A05' : isDark ? '#7A9485' : '#5C7A6A' },
                    ]}
                  >
                    {preset.tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Pass & Play Notice */}
          {gameMode === 'local' && (
            <View
              style={[
                styles.optionRowCard,
                {
                  backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E0ECE4',
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionTitle, { color: isDark ? '#FFF' : '#1A2318' }]}>
                  👥 Pass & Play Mode
                </Text>
                <Text style={[styles.optionSub, { color: isDark ? '#96A1AD' : '#5C7A6A' }]}>
                  Both players play on the same device. Flip board orientation before the first move is made.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        /* Rules Guide Tab */
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {CHESS_RULES_CONTENT.map((rule, idx) => (
            <View
              key={`rule_${idx}`}
              style={[
                styles.ruleCard,
                {
                  backgroundColor: isDark ? '#141A16' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E0ECE4',
                },
              ]}
            >
              <Text style={styles.ruleGlyph}>{rule.glyph}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ruleTitle, { color: isDark ? '#F0C64A' : '#A6740C' }]}>
                  {rule.title}
                </Text>
                <Text style={[styles.ruleText, { color: isDark ? '#B4C5BB' : '#45594E' }]}>
                  {rule.text}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Floating Bottom Action Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.startBtn}
          onPress={handleStartGame}
        >
          <LinearGradient
            colors={['#F0C64A', '#D4A017', '#9C6C0C']}
            style={styles.startBtnGradient}
          >
            <Text style={styles.startBtnText}>
              {gameMode === 'computer' ? '⚔️ Start AI Match' : '👥 Start 2-Player Match'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appBar: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  appBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabPillWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 4,
    borderRadius: 14,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabBtn: {
    backgroundColor: '#D4A017',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D4E2D8',
  },
  activeTabText: {
    color: '#241703',
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 8,
  },
  activeModeToggle: {
    borderColor: '#D4A017',
    backgroundColor: 'rgba(212, 160, 23, 0.15)',
  },
  modeToggleIcon: {
    fontSize: 20,
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  aiCardsCol: {
    gap: 10,
    marginBottom: 10,
  },
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  activeAiCardGlow: {
    borderColor: '#F0C64A',
    shadowColor: '#F0C64A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  aiLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  aiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiEmoji: {
    fontSize: 22,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  aiBadgeWrap: {
    backgroundColor: 'rgba(212, 160, 23, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#F0C64A',
  },
  aiSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#7A9485',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#F0C64A',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0C64A',
  },
  playersSetupCol: {
    gap: 10,
    marginBottom: 16,
  },
  playerSetupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  playerSetupAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerSetupAvatarText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0D2018',
  },
  playerSetupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  playerSetupLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playerYouBadge: {
    backgroundColor: 'rgba(31,157,85,0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  playerYouBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1F9D55',
  },
  playerSetupInput: {
    fontSize: 14.5,
    fontWeight: '700',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  timePresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  timePresetBtn: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  timePresetLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  timePresetTag: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  optionRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    marginTop: 8,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  optionSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  ruleCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
    alignItems: 'flex-start',
  },
  ruleGlyph: {
    fontSize: 30,
    lineHeight: 34,
  },
  ruleTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  ruleText: {
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(10, 18, 14, 0.94)',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  startBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  startBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2B1C04',
    letterSpacing: 0.5,
  },
});

export default ChessModeScreen;
