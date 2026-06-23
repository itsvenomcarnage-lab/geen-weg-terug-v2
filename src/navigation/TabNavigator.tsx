import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ComponentProps } from 'react';

import { LezenStackNavigator } from '@/navigation/LezenStackNavigator';
import { tabBarOptions } from '@/navigation/theme';
import { TabParamList } from '@/navigation/types';
import { DossierScreen, ProfileScreen, QuizScreen } from '@/screens';
import { colors } from '@/theme';

const Tab = createBottomTabNavigator<TabParamList>();

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const tabIcons: Record<keyof TabParamList, { focused: IoniconName; unfocused: IoniconName }> = {
  Lezen: { focused: 'book', unfocused: 'book-outline' },
  Dossier: { focused: 'folder', unfocused: 'folder-outline' },
  Quiz: { focused: 'help-circle', unfocused: 'help-circle-outline' },
  Profiel: { focused: 'person', unfocused: 'person-outline' },
};

export function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen
        name="Lezen"
        component={LezenStackNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? tabIcons.Lezen.focused : tabIcons.Lezen.unfocused}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Dossier"
        component={DossierScreen}
        options={{
          headerShown: true,
          headerStyle: tabBarOptions.tabBarStyle,
          headerTintColor: colors.text,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? tabIcons.Dossier.focused : tabIcons.Dossier.unfocused}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Quiz"
        component={QuizScreen}
        options={{
          headerShown: true,
          headerStyle: tabBarOptions.tabBarStyle,
          headerTintColor: colors.text,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? tabIcons.Quiz.focused : tabIcons.Quiz.unfocused}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profiel"
        component={ProfileScreen}
        options={{
          headerShown: true,
          headerStyle: tabBarOptions.tabBarStyle,
          headerTintColor: colors.text,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? tabIcons.Profiel.focused : tabIcons.Profiel.unfocused}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
