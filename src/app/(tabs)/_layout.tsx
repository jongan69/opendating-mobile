// Main tab navigator — Discover, Matches, Profile.
// Native bottom tabs; SF Symbols on iOS, Material Symbols on Android.
// Discover hides the header (immersive deck); Matches and Profile keep a
// native header, themed like the settings stack.

import { Tabs } from 'expo-router';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { useTheme } from '@/state/theme-context';
import { useConversationSync } from '@/features/messaging/use-conversation-sync';
import { useTotalUnread } from '@/features/messaging/conversation-log';
import { typography } from '@/theme/typography';
import type { ColorValue } from 'react-native';

interface TabIconProps {
  ios: SFSymbol;
  android: AndroidSymbol;
  color: ColorValue;
  focused: boolean;
}

function TabIcon({ ios, android, color, focused }: TabIconProps) {
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      size={focused ? 27 : 25}
      tintColor={color}
      weight={focused ? 'semibold' : 'regular'}
    />
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  // Keep the conversation log fed for as long as the tabs are mounted, not
  // just while a chat screen is open.
  useConversationSync();
  const unread = useTotalUnread();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { ...typography.labelSmall, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, ...typography.titleMedium },
        headerShadowVisible: false,
        headerTintColor: colors.accent,
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon ios="flame.fill" android="local_fire_department" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Matches',
          headerShown: true,
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.textInverse },
          tabBarIcon: ({ color, focused }) => (
            <TabIcon ios="heart.fill" android="favorite" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: true,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon ios="person.fill" android="person" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
