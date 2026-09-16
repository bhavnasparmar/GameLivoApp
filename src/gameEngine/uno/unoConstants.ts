import { UnoActiveColor, UnoBotConfig, UnoCard, UnoColor, UnoTimePreset } from './unoTypes';

// ─── Uno Colors & Gradients ───────────────────────────────────────────────────

export interface UnoColorTheme {
  primary: string;
  secondary: string;
  gradient: [string, string];
  border: string;
  glow: string;
  text: string;
}

export const UNO_COLOR_THEMES: Record<UnoActiveColor, UnoColorTheme> = {
  red: {
    primary: '#E62429',
    secondary: '#B31419',
    gradient: ['#F8363F', '#D11E24'],
    border: '#FF6B6B',
    glow: 'rgba(230, 36, 41, 0.6)',
    text: '#FFFFFF',
  },
  blue: {
    primary: '#0072CE',
    secondary: '#004C8C',
    gradient: ['#1E90FF', '#0066CC'],
    border: '#54A0FF',
    glow: 'rgba(0, 114, 206, 0.6)',
    text: '#FFFFFF',
  },
  green: {
    primary: '#00A651',
    secondary: '#006B34',
    gradient: ['#2ECC71', '#009E49'],
    border: '#1DD1A1',
    glow: 'rgba(0, 166, 81, 0.6)',
    text: '#FFFFFF',
  },
  yellow: {
    primary: '#F5B800',
    secondary: '#C69200',
    gradient: ['#FEE140', '#F5B800'],
    border: '#FFEAA7',
    glow: 'rgba(245, 184, 0, 0.6)',
    text: '#1F1F1F',
  },
};

export const UNO_WILD_THEME: UnoColorTheme = {
  primary: '#1A1A24',
  secondary: '#0D0D14',
  gradient: ['#2A2A38', '#14141E'],
  border: '#F1C40F',
  glow: 'rgba(241, 196, 15, 0.6)',
  text: '#FFFFFF',
};

// ─── Standard 108 Card Deck Builder ──────────────────────────────────────────

export const buildStandardUnoDeck = (): UnoCard[] => {
  const cards: UnoCard[] = [];
  const standardColors: UnoActiveColor[] = ['red', 'green', 'blue', 'yellow'];

  standardColors.forEach((color) => {
    // One '0' card per color
    cards.push({
      id: `${color}_0_${Date.now()}_${Math.random()}`,
      color,
      value: '0',
      scoreValue: 0,
    });

    // Two of each 1-9 per color
    for (let v = 1; v <= 9; v++) {
      const valStr = v.toString() as UnoCard['value'];
      for (let i = 0; i < 2; i++) {
        cards.push({
          id: `${color}_${valStr}_${i}_${Math.random()}`,
          color,
          value: valStr,
          scoreValue: v,
        });
      }
    }

    // Two of each action card per color (Skip, Reverse, Draw Two)
    const actionValues: Array<'skip' | 'reverse' | 'draw2'> = ['skip', 'reverse', 'draw2'];
    actionValues.forEach((act) => {
      for (let i = 0; i < 2; i++) {
        cards.push({
          id: `${color}_${act}_${i}_${Math.random()}`,
          color,
          value: act,
          scoreValue: 20,
        });
      }
    });
  });

  // Four Wild cards
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `wild_${i}_${Math.random()}`,
      color: 'wild',
      value: 'wild',
      scoreValue: 50,
    });
  }

  // Four Wild Draw 4 cards
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `wild_draw4_${i}_${Math.random()}`,
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

// ─── Seat Ring Colors ─────────────────────────────────────────────────────────

export const SEAT_RING_COLORS = [
  '#2ECC71', // Green (Rohan / You)
  '#E056FD', // Purple/Pink (Priya)
  '#00D2D3', // Cyan (Arjun)
  '#FF6B6B', // Coral/Red (Vikram)
  '#A55EEA', // Purple (Simran)
  '#F1C40F', // Gold (Karan)
  '#54A0FF', // Sky Blue (Ananya)
  '#FF9F43', // Orange
];

// ─── Realistic Table Player Profiles ──────────────────────────────────────────

export interface UnoSeatProfile extends UnoBotConfig {
  ringColor: string;
  avatarImage?: string;
  seatPosition?: 'top' | 'topRight' | 'right' | 'bottomRight' | 'bottomLeft' | 'left' | 'topLeft' | 'bottom';
}

export const UNO_ROBOT_PROFILES: UnoSeatProfile[] = [
  {
    id: 'bot_rohan',
    name: 'Rohan',
    avatar: '👨🏻',
    personality: 'Aggressive tactician',
    difficulty: 'medium',
    ringColor: '#2ECC71',
    seatPosition: 'top',
  },
  {
    id: 'bot_priya',
    name: 'Priya',
    avatar: '👩🏽',
    personality: 'Smart & quick responder',
    difficulty: 'medium',
    ringColor: '#E056FD',
    seatPosition: 'topRight',
  },
  {
    id: 'bot_arjun',
    name: 'Arjun',
    avatar: '👨🏽',
    personality: 'Color switch strategist',
    difficulty: 'hard',
    ringColor: '#00D2D3',
    seatPosition: 'right',
  },
  {
    id: 'bot_vikram',
    name: 'Vikram',
    avatar: '👨🏻‍🦱',
    personality: 'Wild card saver',
    difficulty: 'hard',
    ringColor: '#FF6B6B',
    seatPosition: 'bottomRight',
  },
  {
    id: 'bot_simran',
    name: 'Simran',
    avatar: '👩🏻',
    personality: 'Patient and calculated',
    difficulty: 'medium',
    ringColor: '#A55EEA',
    seatPosition: 'bottomLeft',
  },
  {
    id: 'bot_karan',
    name: 'Karan',
    avatar: '👨🏻‍💼',
    personality: 'Fast paced Uno caller',
    difficulty: 'easy',
    ringColor: '#F1C40F',
    seatPosition: 'left',
  },
  {
    id: 'bot_ananya',
    name: 'Ananya',
    avatar: '👩🏻‍🦰',
    personality: 'Draw-card combo master',
    difficulty: 'easy',
    ringColor: '#54A0FF',
    seatPosition: 'topLeft',
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
