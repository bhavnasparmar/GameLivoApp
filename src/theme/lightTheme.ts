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

export interface AppTheme {
  mode: 'light' | 'dark';
  colors: AppColors;
  typography: typeof Typography;
  spacing: typeof Spacing;
  radius: typeof Radius;
  shadows: typeof Shadows;
  dimensions: typeof Dimensions_;
}
