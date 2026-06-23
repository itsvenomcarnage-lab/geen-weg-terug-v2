import { TextStyle } from 'react-native';

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
  } satisfies TextStyle,
  heading: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.3,
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  } satisfies TextStyle,
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  } satisfies TextStyle,
} as const;
