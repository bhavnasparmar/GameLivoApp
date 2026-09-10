import { Platform, Dimensions } from 'react-native';

// ─── Device Utilities ────────────────────────────────────────────────────────

const { width, height } = Dimensions.get('window');

export const DeviceUtils = {
  isIOS: Platform.OS === 'ios',
  isAndroid: Platform.OS === 'android',

  screenWidth: width,
  screenHeight: height,

  isSmallScreen: width < 360,
  isMediumScreen: width >= 360 && width < 414,
  isLargeScreen: width >= 414,

  isTablet: width >= 768,

  getOSVersion: (): string => String(Platform.Version),

  hitSlop: (size = 10) => ({
    top: size,
    bottom: size,
    left: size,
    right: size,
  }),

  isNotchDevice: (): boolean => {
    // Approximate — proper detection uses react-native-device-info
    return Platform.OS === 'ios' && height >= 812;
  },
};
