// Root layout — theme provider + navigation shell
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@/state/theme-context';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ThemeProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="candidate/[pubkey]" />
        <Stack.Screen name="chat/[pubkey]" />
        <Stack.Screen name="filters" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
