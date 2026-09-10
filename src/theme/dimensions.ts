import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Dimensions_ = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,

  // Common component heights
  headerHeight: 56,
  bottomTabHeight: 64,
  buttonHeightLg: 52,
  buttonHeightMd: 44,
  buttonHeightSm: 36,

  // Avatar sizes
  avatarXs: 24,
  avatarSm: 32,
  avatarMd: 40,
  avatarLg: 56,
  avatarXl: 72,
  avatarXxl: 96,

  // Icon sizes
  iconXs: 14,
  iconSm: 16,
  iconMd: 20,
  iconLg: 24,
  iconXl: 32,

  // Card dimensions
  gameCardWidth: SCREEN_WIDTH * 0.44,
  gameCardHeight: SCREEN_WIDTH * 0.52,
};
