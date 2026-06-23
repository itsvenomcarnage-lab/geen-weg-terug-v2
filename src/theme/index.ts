export { colors } from './colors';
export { spacing } from './spacing';
export { typography } from './typography';

import { colors } from './colors';

export const theme = {
  colors,
  dark: true,
} as const;

export type Theme = typeof theme;
