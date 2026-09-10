import { DarkColors } from './colors';
import { Typography } from './typography';
import { Spacing } from './spacing';
import { Radius } from './radius';
import { Shadows } from './shadows';
import { Dimensions_ } from './dimensions';

export const darkTheme = {
  mode: 'dark' as const,
  colors: DarkColors,
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  shadows: Shadows,
  dimensions: Dimensions_,
};
