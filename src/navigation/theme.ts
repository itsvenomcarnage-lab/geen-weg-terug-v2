import { Theme } from '@react-navigation/native';

import { colors } from '@/theme';

export const navigationTheme: Theme = {
  dark: true,
  colors: {
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.neon,
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700',
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '800',
    },
  },
};

export const screenOptions = {
  headerStyle: {
    backgroundColor: colors.surface,
  },
  headerTintColor: colors.text,
  headerTitleStyle: {
    fontWeight: '600' as const,
  },
  contentStyle: {
    backgroundColor: colors.background,
  },
};

export const tabBarOptions = {
  tabBarStyle: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
  },
  tabBarActiveTintColor: colors.tabBarActive,
  tabBarInactiveTintColor: colors.tabBarInactive,
  headerShown: false,
};
