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
import { UnoDifficulty, UnoTimePreset } from '../../../../gameEngine/uno/unoTypes';
import { UNO_ROBOT_PROFILES, UNO_TIME_PRESETS } from '../../../../gameEngine/uno/unoConstants';
import { useAppSelector } from '../../../../redux/hooks';

const { width } = Dimensions.get('window');

type ActiveTab = 'setup' | 'rules';

interface AiLevelOption {
  id: UnoDifficulty;
  title: string;
  subtitle: string;
  emoji: string;
  badge: string;
  gradient: [string, string];
}

const AI_LEVELS: AiLevelOption[] = [
  {
    id: 'easy',
    title: 'Easy AI',
    subtitle: 'Casual & friendly. Great for warmups',
    emoji: '🙂',
    badge: 'Beginner',
    gradient: ['#2ECC71', '#1B8A4C'],
  },
  {
    id: 'medium',
    title: 'Medium AI',
    subtitle: 'Balanced color tactical play',
    emoji: '😐',
    badge: 'Intermediate',
    gradient: ['#F39C12', '#B9770E'],
  },
  {
    id: 'hard',
    title: 'Hard AI',
    subtitle: 'Aggressive +4 & Wild master',
    emoji: '😈',
    badge: 'Expert',
    gradient: ['#E74C3C', '#962D22'],
  },
];

const UNO_RULES_CONTENT = [
  {
    glyph: '🎯',
    title: 'Objective of Uno',
    text: 'Be the first player to discard all cards from your hand in each round and score points from opponents’ remaining cards!',
  },
  {
    glyph: '🎨',
    title: 'Matching Cards',
    text: 'On your turn, you must match the top card on the Discard Pile by either COLOR, NUMBER, or ACTION SYMBOL.',
  },
  {
    glyph: '🚫',
    title: 'Skip Card',
    text: 'When played, the next player loses their turn and is skipped immediately.',
  },
  {
    glyph: '⇄',
    title: 'Reverse Card',
    text: 'Reverses the direction of play. In a 2-player match, Reverse acts like a Skip, giving you another turn!',
  },
  {
    glyph: '🎴',
    title: 'Draw Two (+2)',
    text: 'When played, the next player must draw 2 cards from the deck and forfeit their turn.',
  },
  {
    glyph: '🌈',
    title: 'Wild Card',
    text: 'Can be played on any card. You get to choose the next active color for the game (Red, Blue, Green, or Yellow).',
  },
  {
    glyph: '💥',
    title: 'Wild Draw Four (+4)',
    text: 'The ultimate card! You choose the next active color AND the next player must draw 4 cards and lose their turn.',
  },
  {
    glyph: '🔥',
    title: 'The "UNO!" Shout Rule',
    text: 'When you are down to 1 card in hand, you MUST press the UNO! button. If an opponent catches you before you call it, you must draw 2 penalty cards!',
  },
  {
    glyph: '📥',
    title: 'Drawing Cards',
    text: 'If you have no playable card, you must draw 1 card from the deck. If the drawn card is playable, you can play it immediately or pass.',
  },
  {
    glyph: '🏆',
    title: 'Scoring & Winning',
    text: 'Numbers: Face value (0–9 pts). Action cards (Skip, Reverse, +2): 20 pts each. Wild & +4 Wilds: 50 pts each!',
  },
];

export const UnoModeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark } = useTheme();

  const userProfile = useAppSelector((state) => state.user.profile);
  const loggedInName = userProfile?.name || userProfile?.username || 'Player 1';

  const initialMode = route.params?.initialMode || 'computer';
  const [activeTab, setActiveTab] = useState<ActiveTab>(
    initialMode === 'rules' ? 'rules' : 'setup',
  );
  const [gameMode, setGameMode] = useState<'computer' | 'local'>(
    initialMode === 'local' ? 'local' : 'computer',
  );

  const [playerCount, setPlayerCount] = useState<2 | 4>(2);
  const [player1Name, setPlayer1Name] = useState(loggedInName);
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [selectedDifficulty, setSelectedDifficulty] = useState<UnoDifficulty>('medium');
  const [selectedTimePreset, setSelectedTimePreset] = useState<UnoTimePreset>(UNO_TIME_PRESETS[1]);

  useEffect(() => {
    if (loggedInName && player1Name === 'Player 1') {
      setPlayer1Name(loggedInName);
    }
  }, [loggedInName]);

  const handleStartGame = () => {
    navigation.navigate(ROUTES.UNO_GAME, {
      matchId: `uno_${Date.now()}`,
      mode: gameMode,
      difficulty: selectedDifficulty,
      playerCount,
      timeSeconds: selectedTimePreset.seconds,
      player1Name: player1Name.trim() || loggedInName,
      player2Name: player2Name.trim() || 'Player 2',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#080E0B' : '#F2F8F4' }]}>
      <StatusBar barStyle="light-content" />

      {/* App Bar */}
      <LinearGradient
        colors={['#C0392B', '#922B21', '#641E16']}
        style={[styles.appBar, { paddingTop: Math.max(insets.top + 8, 26) }]}
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
            {gameMode === 'computer' ? 'Play vs Robot Setup' : 'Pass & Play Setup'}
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
              📖 Rules Guide
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {activeTab === 'setup' ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Opponent Mode Toggle */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>GAME MODE</Text>
          </View>
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.modeToggleBtn,
                gameMode === 'computer' && styles.activeModeToggle,
                { backgroundColor: isDark ? '#141E18' : '#FFFFFF' },
              ]}
              onPress={() => setGameMode('computer')}
            >
              <Text style={styles.modeToggleIcon}>🤖</Text>
              <Text style={[styles.modeToggleText, { color: isDark ? '#FFF' : '#1A2318' }]}>
                Play vs Robot
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.modeToggleBtn,
                gameMode === 'local' && styles.activeModeToggle,
                { backgroundColor: isDark ? '#141E18' : '#FFFFFF' },
              ]}
              onPress={() => setGameMode('local')}
            >
              <Text style={styles.modeToggleIcon}>👥</Text>
              <Text style={[styles.modeToggleText, { color: isDark ? '#FFF' : '#1A2318' }]}>
                Pass & Play (2P)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Table Size (2 Players vs 4 Players) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TABLE PLAYERS COUNT</Text>
          </View>
          <View style={styles.modeToggleRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.modeToggleBtn,
                playerCount === 2 && styles.activeModeToggle,
                { backgroundColor: isDark ? '#141E18' : '#FFFFFF' },
              ]}
              onPress={() => setPlayerCount(2)}
            >
              <Text style={styles.modeToggleIcon}>⚔️</Text>
              <Text style={[styles.modeToggleText, { color: isDark ? '#FFF' : '#1A2318' }]}>
                1 vs 1 Duel (2P)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.modeToggleBtn,
                playerCount === 4 && styles.activeModeToggle,
                { backgroundColor: isDark ? '#141E18' : '#FFFFFF' },
              ]}
              onPress={() => setPlayerCount(4)}
            >
              <Text style={styles.modeToggleIcon}>🎪</Text>
              <Text style={[styles.modeToggleText, { color: isDark ? '#FFF' : '#1A2318' }]}>
                4-Player Table
              </Text>
            </TouchableOpacity>
          </View>

          {/* AI Difficulty Section */}
          {gameMode === 'computer' && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>ROBOT AI DIFFICULTY</Text>
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
                          backgroundColor: isDark ? '#141E18' : '#FFFFFF',
                          borderColor: isSelected
                            ? '#E74C3C'
                            : isDark
                            ? 'rgba(255,255,255,0.08)'
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

          {/* Turn Time Preset Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TURN TIMER</Text>
          </View>
          <View style={styles.timePresetsGrid}>
            {UNO_TIME_PRESETS.map((preset) => {
              const isSelected = selectedTimePreset.id === preset.id;
              return (
                <TouchableOpacity
                  key={preset.id}
                  activeOpacity={0.8}
                  style={[
                    styles.timePresetBtn,
                    {
                      backgroundColor: isSelected
                        ? '#E74C3C'
                        : isDark
                        ? '#141E18'
                        : '#FFFFFF',
                      borderColor: isSelected
                        ? '#FF7675'
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
                      { color: isSelected ? '#FFFFFF' : isDark ? '#F1F4F7' : '#1A2318' },
                    ]}
                  >
                    {preset.label}
                  </Text>
                  <Text
                    style={[
                      styles.timePresetTag,
                      { color: isSelected ? '#FFD2D2' : isDark ? '#7A9485' : '#5C7A6A' },
                    ]}
                  >
                    {preset.tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* Rules Guide Tab */
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {UNO_RULES_CONTENT.map((rule, idx) => (
            <View
              key={`rule_${idx}`}
              style={[
                styles.ruleCard,
                {
                  backgroundColor: isDark ? '#141E18' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E0ECE4',
                },
              ]}
            >
              <Text style={styles.ruleGlyph}>{rule.glyph}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.ruleTitle}>{rule.title}</Text>
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
            colors={['#E74C3C', '#C0392B', '#962D22']}
            style={styles.startBtnGradient}
          >
            <Text style={styles.startBtnText}>
              {gameMode === 'computer'
                ? `⚡ START MATCH VS ROBOT (${playerCount}P)`
                : `👥 START PASS & PLAY (${playerCount}P)`}
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  appBarTitle: {
    fontSize: 17,
    fontWeight: '900',
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
    backgroundColor: '#E74C3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FADBD8',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  content: {
    padding: 16,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#E74C3C',
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
    borderColor: '#E74C3C',
    backgroundColor: 'rgba(231, 76, 60, 0.15)',
  },
  modeToggleIcon: {
    fontSize: 20,
  },
  modeToggleText: {
    fontSize: 13.5,
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
    borderColor: '#E74C3C',
    shadowColor: '#E74C3C',
    shadowOffset: { width: 0, height: 3 },
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
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  aiBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#E74C3C',
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
    borderColor: '#E74C3C',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E74C3C',
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
    fontSize: 13.5,
    fontWeight: '800',
  },
  timePresetTag: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  ruleGlyph: {
    fontSize: 24,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E74C3C',
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(10, 18, 14, 0.95)',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  startBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startBtnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtnText: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});

export default UnoModeScreen;
