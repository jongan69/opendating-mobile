// Photos — pick 2–6 photos from the library, shown in a 3-column grid.
// Previews use expo-image; picker uses expo-image-picker.

import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ErrorBanner,
  OnboardingScreen,
} from '@/components/onboarding/onboarding-screen';
import {
  MAX_PHOTOS,
  MIN_PHOTOS,
  useOnboardingDraft,
} from '@/features/onboarding/onboarding-draft';
import { useTheme } from '@/state/theme-context';
import type { ThemeColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function PhotosScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { draft, update } = useOnboardingDraft();

  const [photos, setPhotos] = useState<string[]>(draft.photos);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = makeStyles(colors);

  const pickPhotos = async () => {
    if (picking) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;

    setPicking(true);
    setError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(
          'Photo access is needed to add photos. Enable it in your device settings.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });

      if (result.canceled) return;

      setPhotos((prev) => {
        const merged = [...prev, ...result.assets.map((a) => a.uri)];
        return merged.slice(0, MAX_PHOTOS);
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to pick photos. Please try again.'
      );
    } finally {
      setPicking(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    update('photos', photos);
    router.push('/(onboarding)/location');
  };

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => i);
  const canContinue = photos.length >= MIN_PHOTOS;

  return (
    <OnboardingScreen
      step={8}
      title="Add your photos"
      subtitle={`Pick ${MIN_PHOTOS}–${MAX_PHOTOS} photos so people know who you are.`}
      primaryLabel="Continue"
      onPrimaryPress={handleContinue}
      primaryDisabled={!canContinue}
      footer={
        <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'center' }]}>
          {canContinue
            ? 'Photos are shown on your profile.'
            : `Add at least ${MIN_PHOTOS} photos to continue.`}
        </Text>
      }
    >
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.grid}>
        {slots.map((index) => {
          const uri = photos[index];
          if (uri) {
            return (
              <View key={index} style={styles.slot}>
                <Image
                  source={{ uri }}
                  style={styles.slotImage}
                  contentFit="cover"
                  transition={150}
                  accessibilityLabel={`Photo ${index + 1}`}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove photo ${index + 1}`}
                  onPress={() => removePhoto(index)}
                  hitSlop={spacing.sm}
                  style={styles.removeBadge}
                >
                  <Text style={styles.removeBadgeText}>×</Text>
                </Pressable>
              </View>
            );
          }
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={`Add photo ${index + 1}`}
              onPress={pickPhotos}
              disabled={picking}
              style={[
                styles.slot,
                styles.emptySlot,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.plus, { color: colors.textTertiary }]}>+</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[typography.caption, { color: colors.textTertiary }]}>
        {photos.length} of {MAX_PHOTOS} photos selected
      </Text>
    </OnboardingScreen>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    slot: {
      width: '31%',
      aspectRatio: 1,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    slotImage: {
      width: '100%',
      height: '100%',
    },
    emptySlot: {
      borderWidth: 1,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    plus: {
      fontSize: 32,
      lineHeight: 36,
      fontWeight: '300',
    },
    removeBadge: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      width: 24,
      height: 24,
      borderRadius: radius.full,
      backgroundColor: colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeBadgeText: {
      color: '#FFFFFF',
      fontSize: 16,
      lineHeight: 18,
      fontWeight: '600',
    },
  });
}
