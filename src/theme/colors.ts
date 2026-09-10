// ─── GameLivo Color Palette ────────────────────────────────────────────────
// Primary brand: deep forest green + gold accent

export const LightColors = {
  // Brand
  primary: '#1F9D55',
  primaryLight: '#27AE60',
  primaryDark: '#166A3A',
  accent: '#D6A83A',
  accentLight: '#E8BF55',
  accentDark: '#B8872A',

  // Backgrounds
  background: '#F5F7F5',
  surface: '#FFFFFF',
  surfaceElevated: '#F0F4F1',
  surfaceOverlay: 'rgba(0,0,0,0.04)',

  // Text
  textPrimary: '#0D1B12',
  textSecondary: '#4A6355',
  textTertiary: '#7A9485',
  textDisabled: '#B0C4BB',
  textInverse: '#FFFFFF',

  // Status
  success: '#1F9D55',
  successLight: '#E6F7EE',
  error: '#E5584A',
  errorLight: '#FDECEA',
  warning: '#E5A93D',
  warningLight: '#FDF4E3',
  info: '#3A7BD5',
  infoLight: '#EBF2FC',

  // Border
  border: '#D4E3DA',
  borderLight: '#EAF2EE',
  borderFocus: '#1F9D55',

  // Game specific
  ludoRed: '#E5584A',
  ludoGreen: '#1F9D55',
  ludoBlue: '#3A7BD5',
  ludoYellow: '#E5A93D',

  // Misc
  overlay: 'rgba(0,0,0,0.5)',
  shadow: 'rgba(0,0,0,0.12)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

export const DarkColors = {
  // Brand
  primary: '#27AE60',
  primaryLight: '#2ECC71',
  primaryDark: '#1F9D55',
  accent: '#D6A83A',
  accentLight: '#E8BF55',
  accentDark: '#B8872A',

  // Backgrounds
  background: '#08120D',
  surface: '#102017',
  surfaceElevated: '#183021',
  surfaceOverlay: 'rgba(255,255,255,0.05)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C8BE',
  textTertiary: '#7A9485',
  textDisabled: '#3A5045',
  textInverse: '#0D1B12',

  // Status
  success: '#27AE60',
  successLight: '#0D2E1A',
  error: '#E5584A',
  errorLight: '#2E1209',
  warning: '#E5A93D',
  warningLight: '#2E200A',
  info: '#3A7BD5',
  infoLight: '#0D1E36',

  // Border
  border: '#294034',
  borderLight: '#1A2D22',
  borderFocus: '#27AE60',

  // Game specific
  ludoRed: '#E5584A',
  ludoGreen: '#27AE60',
  ludoBlue: '#3A7BD5',
  ludoYellow: '#E5A93D',

  // Misc
  overlay: 'rgba(0,0,0,0.7)',
  shadow: 'rgba(0,0,0,0.4)',
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

export type AppColors = typeof LightColors;
