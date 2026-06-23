import { NavigatorScreenParams } from '@react-navigation/native';

export type LezenStackParamList = {
  Home: undefined;
  Chapters: { bookId?: string } | undefined;
  Reading: { chapterId: string; bookId?: string };
  Paywall: { source?: string } | undefined;
};

export type TabParamList = {
  Lezen: NavigatorScreenParams<LezenStackParamList>;
  Dossier: undefined;
  Quiz: undefined;
  Profiel: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
