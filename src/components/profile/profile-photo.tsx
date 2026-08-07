// Large profile photo — expo-image with placeholder, edit badge, and border
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/state/theme-context';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

interface ProfilePhotoProps {
  uri?: string;
  size: number;
  editable?: boolean;
  onPress?: () => void;
  /** 'circle' for avatars, 'rounded' for gallery-style frames */
  shape?: 'circle' | 'rounded';
}

export function ProfilePhoto({
  uri,
  size,
  editable = false,
  onPress,
  shape = 'circle',
}: ProfilePhotoProps) {
  const { colors } = useTheme();
  const borderRadius = shape === 'circle' ? size / 2 : radius.xxl;

  const image = uri ? (
    <Image
      source={{ uri }}
      style={[styles.image, { width: size, height: size, borderRadius }]}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
      accessibilityLabel="Profile photo"
    />
  ) : (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
        },
      ]}
      accessibilityLabel="No profile photo"
    >
      <View style={[styles.head, { borderColor: colors.border }]} />
      <View style={[styles.body, { borderColor: colors.border }]} />
    </View>
  );

  const badge = editable ? (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.accent, borderColor: colors.surface },
      ]}
    >
      <Text style={styles.badgeIcon}>✎</Text>
    </View>
  ) : null;

  if (!onPress && !editable) {
    return <>{image}</>;
  }

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel="Profile photo"
      onPress={onPress}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius },
        pressed && styles.pressed,
      ]}
    >
      {image}
      {badge}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
  },
  head: {
    width: '36%',
    aspectRatio: 1,
    borderRadius: radius.full,
    borderWidth: 3,
  },
  body: {
    width: '58%',
    height: '30%',
    borderRadius: radius.xxl,
    borderWidth: 3,
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: radius.full,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.92,
  },
});
