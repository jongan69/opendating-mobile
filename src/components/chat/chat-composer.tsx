// Chat input composer — auto-growing multiline input with send button
import { useCallback, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

interface ChatComposerProps {
  onSend: (text: string) => void;
  /** Disable sending entirely (e.g. unmatched conversation) */
  disabled?: boolean;
}

const LINE_HEIGHT = typography.bodyMedium.lineHeight ?? 22;
const MIN_HEIGHT = 44;
const MAX_LINES = 4;
const MAX_HEIGHT = LINE_HEIGHT * MAX_LINES + spacing.sm * 2;

export function ChatComposer({ onSend, disabled = false }: ChatComposerProps) {
  const { colors, isDark } = useTheme();
  const [text, setText] = useState('');
  const [inputHeight, setInputHeight] = useState(MIN_HEIGHT);

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !disabled;

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(trimmed);
    setText('');
    setInputHeight(MIN_HEIGHT);
  }, [canSend, onSend, trimmed]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        disabled && styles.containerDisabled,
      ]}
    >
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            height: inputHeight,
          },
          isDark && styles.inputDark,
        ]}
        value={text}
        onChangeText={setText}
        onContentSizeChange={(e) => {
          const height = e.nativeEvent.contentSize.height;
          setInputHeight(Math.max(MIN_HEIGHT, Math.min(height, MAX_HEIGHT)));
        }}
        placeholder="Message..."
        placeholderTextColor={colors.textTertiary}
        multiline
        maxLength={2000}
        blurOnSubmit={false}
        keyboardAppearance={isDark ? 'dark' : 'light'}
        accessibilityLabel="Message input"
        editable={!disabled}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send message"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={handleSend}
        hitSlop={spacing.sm}
        style={({ pressed }) => [
          styles.sendButton,
          {
            backgroundColor: canSend ? colors.accent : colors.border,
          },
          pressed && canSend && styles.sendPressed,
        ]}
      >
        <Text
          style={[
            styles.sendIcon,
            {
              color: canSend ? colors.textInverse : colors.textTertiary,
            },
          ]}
        >
          ↑
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    ...typography.bodyMedium,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: spacing.xs,
  },
  inputDark: {
    // Hermes WebKit quirk: explicit background for dark mode keeps caret visible
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  sendIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
});
