import { UnoActiveColor, UnoBotConfig, UnoCard, UnoColor, UnoTimePreset } from './unoTypes';

// ─── Uno Colors & Gradients ───────────────────────────────────────────────────

export interface UnoColorTheme {
  primary: string;
  dark: string;
  gradient: [string, string];
  glow: string;
  border: string;
  text: string;
}

export const UNO_COLOR_THEMES: Record<UnoActiveColor, UnoColorTheme> = {
  red: {
    primary: '#E63946',
    dark: '#9E1C25',
    gradient: ['#FF4D5A', '#C9182B'],
    glow: 'rgba(230, 57, 70, 0.65)',
    border: '#FF858F',
    text: '#FFFFFF',
  },
  blue: {
    primary: '#1D70B8',
    dark: '#0C4173',
    gradient: ['#2E86DE', '#0A58CA'],
    glow: 'rgba(29, 112, 184, 0.65)',
    border: '#70A1FF',
    text: '#FFFFFF',
  },
  green: {
    primary: '#2A9D8F',
    dark: '#135950',
    gradient: ['#2ECC71', '#1B8A4C'],
    glow: 'rgba(42, 157, 143, 0.65)',
    border: '#7BED9F',
    text: '#FFFFFF',
  },
  yellow: {
    primary: '#F4A261',
    dark: '#B0681B',
    gradient: ['#FFC048', '#E67E22'],
    glow: 'rgba(244, 162, 97, 0.65)',
    border: '#FFEAA7',
    text: '#1C1204',
  },
};

export const UNO_WILD_THEME = {
  primary: '#1E272E',
  dark: '#0F1417',
  gradient: ['#2C3A47', '#131920'],
  glow: 'rgba(255, 215, 0, 0.75)',
  border: '#F9CA24',
  text: '#FFFFFF',
  quadrants: ['#FF4D5A', '#2E86DE', '#2ECC71', '#FFC048'],
};

// ─── 108 Card Standard Deck Builder ──────────────────────────────────────────

export const buildStandardUnoDeck = (): UnoCard[] => {
  const cards: UnoCard[] = [];
  const standardColors: UnoActiveColor[] = ['red', 'green', 'blue', 'yellow'];

  let idCounter = 1;

  standardColors.forEach((color) => {
    // 1x '0' card
    cards.push({
      id: `card_${color}_0_${idCounter++}`,
      color,
      value: '0',
      scoreValue: 0,
    });

    // 2x '1' - '9' cards
    for (let num = 1; num <= 9; num++) {
      const valStr = num.toString() as any;
      cards.push({
        id: `card_${color}_${num}_a_${idCounter++}`,
        color,
        value: valStr,
        scoreValue: num,
      });
      cards.push({
        id: `card_${color}_${num}_b_${idCounter++}`,
        color,
        value: valStr,
        scoreValue: num,
      });
    }

    // 2x 'skip' cards
    cards.push({
      id: `card_${color}_skip_a_${idCounter++}`,
      color,
      value: 'skip',
      scoreValue: 20,
    });
    cards.push({
      id: `card_${color}_skip_b_${idCounter++}`,
      color,
      value: 'skip',
      scoreValue: 20,
    });

    // 2x 'reverse' cards
    cards.push({
      id: `card_${color}_reverse_a_${idCounter++}`,
      color,
      value: 'reverse',
      scoreValue: 20,
    });
    cards.push({
      id: `card_${color}_reverse_b_${idCounter++}`,
      color,
      value: 'reverse',
      scoreValue: 20,
    });

    // 2x 'draw2' cards (+2)
    cards.push({
      id: `card_${color}_draw2_a_${idCounter++}`,
      color,
      value: 'draw2',
      scoreValue: 20,
    });
    cards.push({
      id: `card_${color}_draw2_b_${idCounter++}`,
      color,
      value: 'draw2',
      scoreValue: 20,
    });
  });

  // 4x Wild cards
  for (let i = 1; i <= 4; i++) {
    cards.push({
      id: `card_wild_${i}_${idCounter++}`,
      color: 'wild',
      value: 'wild',
      scoreValue: 50,
    });
  }

  // 4x Wild Draw 4 cards (+4)
  for (let i = 1; i <= 4; i++) {
    cards.push({
      id: `card_wild_draw4_${i}_${idCounter++}`,
      color: 'wild',
      value: 'wild_draw4',
      scoreValue: 50,
    });
  }

  return cards;
};

// ─── Time Presets ─────────────────────────────────────────────────────────────

export const UNO_TIME_PRESETS: UnoTimePreset[] = [
  { id: 'blitz_10', label: '10s Blitz', seconds: 10, tag: 'Fast Pace' },
  { id: 'standard_15', label: '15s Standard', seconds: 15, tag: 'Recommended' },
  { id: 'relaxed_30', label: '30s Relaxed', seconds: 30, tag: 'Casual' },
];

export const UNO_DEFAULT_TIME_SECONDS = 15;

// ─── Robot AI Profiles ────────────────────────────────────────────────────────

export const UNO_ROBOT_PROFILES: UnoBotConfig[] = [
  {
    id: 'bot_easy',
    name: 'RoboDex',
    avatar: '🤖',
    personality: 'Casual & friendly',
    difficulty: 'easy',
  },
  {
    id: 'bot_medium_1',
    name: 'CyberLuna',
    avatar: '⚡',
    personality: 'Tactical color strategist',
    difficulty: 'medium',
  },
  {
    id: 'bot_medium_2',
    name: 'AlphaByte',
    avatar: '🧠',
    personality: 'Calculated & steady',
    difficulty: 'medium',
  },
  {
    id: 'bot_hard_1',
    name: 'NexusPrime',
    avatar: '👑',
    personality: 'Master of +4 & Wild finishers',
    difficulty: 'hard',
  },
  {
    id: 'bot_hard_2',
    name: 'VortexAI',
    avatar: '🔥',
    personality: 'Relentless Uno champion',
    difficulty: 'hard',
  },
];

// ─── Score Values ─────────────────────────────────────────────────────────────

export const UNO_POINTS = {
  NUMBER_CARD_MAX: 9,
  ACTION_CARD: 20,
  WILD_CARD: 50,
};

// ─── Display Symbols ──────────────────────────────────────────────────────────

export const UNO_VALUE_GLYPHS: Record<string, string> = {
  skip: '⊘',
  reverse: '⇄',
  draw2: '+2',
  wild: '🌈',
  wild_draw4: '+4',
};
