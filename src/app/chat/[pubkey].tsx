// Chat screen — NIP-17 encrypted messaging with safety controls.

import { useCallback, useEffect, useRef } from 'react';
import {
  ActionSheetIOS,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '@/state/theme-context';
import { useMessaging } from '@/features/messaging/use-messaging';
import { markConversationRead } from '@/features/messaging/conversation-log';
import { useSafety } from '@/features/safety/use-safety';
import { useCachedCandidate } from '@/features/discovery/candidate-cache';
import { MessageList } from '@/components/chat/message-list';
import { ChatComposer } from '@/components/chat/chat-composer';
import { SafetyMenu, type SafetyMenuHandle } from '@/components/safety/safety-menu';
import { shortPubkey } from '@/lib/format';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function ChatScreen() {
  const { pubkey } = useLocalSearchParams<{ pubkey: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { messages, sendMessage, error } = useMessaging(pubkey);
  const { blockUser, unmatchUser } = useSafety();
  const safetyRef = useRef<SafetyMenuHandle>(null);

  const candidate = useCachedCandidate(pubkey);
  const displayName =
    candidate?.profile.display_name?.trim() || (pubkey ? shortPubkey(pubkey) : 'Chat');
  const photoUrl = candidate?.profile.photos?.find((p) => p.url.length > 0)?.url;

  // Opening the conversation clears its badge; new arrivals while it is open
  // are already visible, so they must not re-raise it either.
  useEffect(() => {
    markConversationRead(pubkey);
  }, [pubkey, messages.length]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/matches');
  }, [router]);

  const openProfile = useCallback(() => {
    router.push(`/candidate/${pubkey}`);
  }, [router, pubkey]);

  const openReport = useCallback(() => {
    router.push({ pathname: '/report', params: { pubkey, name: displayName } });
  }, [router, pubkey, displayName]);

  const confirmUnmatch = useCallback(() => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm("Unmatch? You'll both disappear from each other's matches.")) {
        void unmatchUser(pubkey).then(goBack);
      }
      return;
    }
    Alert.alert('Unmatch?', "You'll both disappear from each other's matches.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unmatch',
        style: 'destructive',
        onPress: () => {
          void unmatchUser(pubkey).then(goBack);
        },
      },
    ]);
  }, [pubkey, unmatchUser, goBack]);

  const confirmBlock = useCallback(() => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm("Block? They won't be able to message you or see you in discovery.")) {
        void blockUser(pubkey).then(goBack);
      }
      return;
    }
    Alert.alert('Block?', "They won't be able to message you or see you in discovery.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          void blockUser(pubkey).then(goBack);
        },
      },
    ]);
  }, [pubkey, blockUser, goBack]);

  const openSafetyMenu = useCallback(() => {
    if (Platform.OS === 'web') {
      safetyRef.current?.present();
      return;
    }
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: displayName,
          options: ['Unmatch', 'Block', 'Report', 'Cancel'],
          cancelButtonIndex: 3,
          destructiveButtonIndex: [0, 1, 2],
        },
        (index) => {
          if (index === 0) confirmUnmatch();
          else if (index === 1) confirmBlock();
          else if (index === 2) openReport();
        }
      );
    } else {
      Alert.alert(displayName, undefined, [
        { text: 'Block', style: 'destructive', onPress: confirmBlock },
        { text: 'Unmatch', style: 'destructive', onPress: confirmUnmatch },
        { text: 'Report', style: 'destructive', onPress: openReport },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }, [displayName, confirmUnmatch, confirmBlock, openReport]);

  const handleSend = useCallback(
    (text: string) => {
      void sendMessage(text);
    },
    [sendMessage]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={goBack}
          hitSlop={spacing.md}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            size={22}
            tintColor={colors.accent}
            weight="semibold"
          />
        </Pressable>
        <Pressable
          onPress={openProfile}
          style={styles.headerCenter}
          accessibilityRole="button"
          accessibilityLabel={`View ${displayName} profile`}
        >
          <View style={[styles.headerAvatar, { backgroundColor: colors.surfaceElevated }]}>
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                style={styles.headerAvatarImage}
                contentFit="cover"
                transition={150}
              />
            ) : (
              <SymbolView
                name={{ ios: 'person.fill', android: 'person', web: 'person' }}
                size={16}
                tintColor={colors.textTertiary}
                weight="medium"
              />
            )}
          </View>
          <Text style={[typography.titleSmall, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
        </Pressable>
        <Pressable
          onPress={openSafetyMenu}
          hitSlop={spacing.md}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Safety options"
        >
          <SymbolView
            name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }}
            size={22}
            tintColor={colors.textSecondary}
            weight="semibold"
          />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // The custom header sits above this view and the top inset is already
        // consumed by SafeAreaView, so only the bottom inset is unaccounted
        // for. A fixed offset here left a gap the size of a phantom navbar.
        keyboardVerticalOffset={insets.bottom}
      >
        {/* Messages are never written to disk, so a conversation fills in as
            the encrypted inbox replays from the relay rather than appearing
            all at once. */}
        <MessageList messages={messages} />

        {error ? (
          <View style={[styles.errorBar, { backgroundColor: colors.destructiveLight }]}>
            <Text style={[typography.caption, { color: colors.destructive }]}>{error}</Text>
          </View>
        ) : null}

        <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <ChatComposer onSend={handleSend} />
        </View>
      </KeyboardAvoidingView>
      <SafetyMenu
        ref={safetyRef}
        targetPubkey={pubkey}
        targetName={displayName}
        onUnmatch={() => void unmatchUser(pubkey).then(goBack)}
        onBlock={() => void blockUser(pubkey).then(goBack)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: spacing.sm },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarImage: { width: '100%', height: '100%' },
  errorBar: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  composerWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
});
