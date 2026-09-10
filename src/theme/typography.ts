import { TextStyle } from 'react-native';

// Font family — uses system fonts until custom fonts are linked
export const FontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
  extraBold: 'Inter-ExtraBold',
  light: 'Inter-Light',
  // Fallback
  systemRegular: 'System',
};

export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
  '6xl': 48,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const FontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semiBold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extraBold: '800' as TextStyle['fontWeight'],
};

export const Typography = {
  // Display
  displayLarge: {
    fontSize: FontSize['5xl'],
    fontFamily: FontFamily.extraBold,
    fontWeight: FontWeight.extraBold,
    lineHeight: FontSize['5xl'] * LineHeight.tight,
  } as TextStyle,
  displayMedium: {
    fontSize: FontSize['4xl'],
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['4xl'] * LineHeight.tight,
  } as TextStyle,

  // Headings
  h1: {
    fontSize: FontSize['3xl'],
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * LineHeight.normal,
  } as TextStyle,
  h2: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['2xl'] * LineHeight.normal,
  } as TextStyle,
  h3: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.semiBold,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.xl * LineHeight.normal,
  } as TextStyle,
  h4: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semiBold,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.lg * LineHeight.normal,
  } as TextStyle,

  // Body
  bodyLarge: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.md * LineHeight.relaxed,
  } as TextStyle,
  bodyMedium: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * LineHeight.relaxed,
  } as TextStyle,
  bodySmall: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.relaxed,
  } as TextStyle,

  // Labels
  labelLarge: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    fontWeight: FontWeight.medium,
  } as TextStyle,
  labelMedium: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    fontWeight: FontWeight.medium,
  } as TextStyle,
  labelSmall: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    fontWeight: FontWeight.medium,
  } as TextStyle,

  // Button
  buttonLarge: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semiBold,
    fontWeight: FontWeight.semiBold,
  } as TextStyle,
  buttonMedium: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semiBold,
    fontWeight: FontWeight.semiBold,
  } as TextStyle,
  buttonSmall: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semiBold,
    fontWeight: FontWeight.semiBold,
  } as TextStyle,

  // Caption
  caption: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    fontWeight: FontWeight.regular,
  } as TextStyle,
};
