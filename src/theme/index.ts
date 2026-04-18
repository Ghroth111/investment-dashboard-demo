import { DefaultTheme, type Theme } from '@react-navigation/native';

import { colors } from './colors';
export { colors } from './colors';
export { fontFamilies, typography } from './typography';
export { radius, spacing } from './spacing';
export { shadows } from './shadows';

export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.canvas,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.line,
    notification: colors.accent,
  },
};
