import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { screenOptions } from '@/navigation/theme';
import { LezenStackParamList } from '@/navigation/types';
import {
  ChaptersScreen,
  HomeScreen,
  PaywallScreen,
  ReadingScreen,
} from '@/screens';

const Stack = createNativeStackNavigator<LezenStackParamList>();

export function LezenStackNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Chapters" component={ChaptersScreen} />
      <Stack.Screen name="Reading" component={ReadingScreen} />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Premium',
        }}
      />
    </Stack.Navigator>
  );
}
