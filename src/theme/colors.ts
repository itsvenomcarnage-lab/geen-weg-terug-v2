export const colors = {
  background: '#050505',
  surface: '#121212',
  surfaceElevated: '#1A1A1A',
  primary: '#6B0F1A',
  primaryDark: '#4A0A12',
  accent: '#FF1744',
  accentMuted: '#C62828',
  neon: '#FF1744',
  text: '#F5F5F5',
  textSecondary: '#A3A3A3',
  textMuted: '#737373',
  border: '#3D1515',
  borderSubtle: '#2A0A0A',
  tabBar: '#0A0A0A',
  tabBarActive: '#FF1744',
  tabBarInactive: '#737373',
  overlay: 'rgba(0, 0, 0, 0.75)',
  success: '#2E7D32',
  warning: '#F9A825',
  error: '#D32F2F',
} as const;

export type ColorName = keyof typeof colors;
