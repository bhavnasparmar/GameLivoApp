import { LightColors, AppColors } from './colors';
import { Typography } from './typography';
import { Spacing } from './spacing';
import { Radius } from './radius';
import { Shadows } from './shadows';
import { Dimensions_ } from './dimensions';

export const lightTheme = {
  mode: 'light' as const,
  colors: LightColors,
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
  dimensions: Dimensions_,
};

export type AppTheme = typeof lightTheme;
