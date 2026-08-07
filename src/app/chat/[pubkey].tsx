// Chat screen — NIP-17 encrypted messaging with safety controls
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useTheme } from '@/state/theme-context';
import { useMessaging } from '@/features/messaging/use-messaging';
import { useSafety } from '@/features/safety/use-safety';
import { useCachedCandidate } from '@/features/discovery/candidate-cache';
import { shortPubkey } from '@/lib/format';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { ODMessage } from '@/types/opendating';

export default function ChatScreen() {
  const { pubkey } = useLocalSearchParams<{ pubkey: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { messages, sendMessage, loading } = useMessaging(pubkey);
  const { blockUser, unmatchUser } = useSafety();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const candidate = useCachedCandidate(pubkey);
  const displayName =
    candidate?.profile.display_name?.trim() || (pubkey ? shortPubkey(pubkey) : 'Chat');
  const photoUrl = candidate?.profile.photos?.find((p) => p.url.length > 0)?.url;

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
    Alert.alert('Unmatch?', "You'll both disappear from each other's matches.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unmatch', style: 'destructive', onPress: () => { void unmatchUser(pubkey).then(goBack); } },
    ]);
  }, [pubkey, unmatchUser, goBack]);

  const confirmBlock = useCallback(() => {
    Alert.alert('Block?', "They won't be able to message you or see you in discovery.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => { void blockUser(pubkey).then(goBack); } },
    ]);
  }, [pubkey, blockUser, goBack]);

  const openSafetyMenu = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: displayName, options: ['Unmatch', 'Block', 'Report', 'Cancel'], cancelButtonIndex: 3, destructiveButtonIndex: [0, 1, 2] },
        (index) => { if (index === 0) confirmUnmatch(); else if (index === 1) confirmBlock(); else if (index === 2) openReport(); }
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

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try { await sendMessage(trimmed); setText(''); }
    catch { /* Error handled by hook */ }
    finally { setSending(false); }
  }, [text, sending, sendMessage]);

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages.length]);

  const renderMessage = ({ item }: { item: ODMessage }) => {
    const isSent = item.sender_pubkey !== pubkey;
    return (
      <View style={[styles.msgRow, isSent ? styles.msgSent : styles.msgReceived]}>
        <View style={[styles.bubble, isSent ? { backgroundColor: colors.accent } : { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[typography.bodyMedium, { color: isSent ? colors.textInverse : colors.text }]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={goBack} hitSlop={8} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} size={22} tintColor={colors.accent} weight="semibold" />
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
          <Text style={[typography.titleSmall, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
        </Pressable>
        <Pressable onPress={openSafetyMenu} hitSlop={8} style={styles.headerBtn} accessibilityRole="button" accessibilityLabel="Safety options">
          <SymbolView name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }} size={22} tintColor={colors.textSecondary} weight="semibold" />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.accent} /></View>
        ) : messages.length === 0 ? (
          <View style={styles.center}><Text style={[typography.bodyLarge, { color: colors.textSecondary }]}>Send a message to start the conversation!</Text></View>
        ) : (
          <FlatList ref={flatListRef} data={messages} renderItem={renderMessage} keyExtractor={(item) => item.id} contentContainerStyle={styles.msgList} onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })} />
        )}
        <View style={[styles.composer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput value={text} onChangeText={setText} placeholder="Message..." placeholderTextColor={colors.textTertiary} style={[styles.input, typography.bodyMedium, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]} multiline maxLength={2000} returnKeyType="send" onSubmitEditing={handleSend} />
          <Pressable onPress={handleSend} disabled={!text.trim() || sending} style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.accent : colors.border }]}>
            <Text style={[typography.labelMedium, { color: text.trim() ? colors.textInverse : colors.textTertiary }]}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  headerBtn: { padding: spacing.sm },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginHorizontal: spacing.md },
  headerAvatar: { width: 32, height: 32, borderRadius: radius.full, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  headerAvatarImage: { width: '100%', height: '100%' },
  msgList: { padding: spacing.md, paddingBottom: spacing.lg },
  msgRow: { marginBottom: spacing.sm, flexDirection: 'row' },
  msgSent: { justifyContent: 'flex-end' },
  msgReceived: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.lg },
  composer: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, borderTopWidth: 1, gap: spacing.sm },
  input: { flex: 1, borderRadius: radius.lg, borderWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, maxHeight: 100 },
  sendBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.full },
});
