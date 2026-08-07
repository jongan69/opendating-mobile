// Edit Profile — update display name, age, gender, bio, interests, photos,
// and relationship intent. Native form layout with @expo/ui inputs.

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Button, Host, Picker } from '@expo/ui';
import { BackHeader } from '@/components/back-header';
import { isServiceUnavailable } from '@/lib/opendating/errors';
import {
  PROFILE_CONTENT_VERSION,
  PhotoUploadError,
  loadProfileContent,
  publishProfile,
  saveProfileContentLocally,
} from '@/features/profile/profile-content';
import { useTheme } from '@/state/theme-context';
import type { ProfileContent } from '@/types/opendating';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

const MAX_PHOTOS = 6;
const MAX_INTERESTS = 20;
const MAX_BIO_LENGTH = 500;

const GENDER_OPTIONS: { label: string; value: string }[] = [
  { label: 'Prefer not to say', value: '' },
  { label: 'Woman', value: 'woman' },
  { label: 'Man', value: 'man' },
  { label: 'Non-binary', value: 'nonbinary' },
  { label: 'Other', value: 'other' },
];

const INTENT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Prefer not to say', value: '' },
  { label: 'Long-term relationship', value: 'long_term' },
  { label: 'Something casual', value: 'casual' },
  { label: 'New friends', value: 'friendship' },
  { label: 'Figuring it out', value: 'figuring_out' },
];

interface SelectedPhoto {
  id: string;
  uri: string;
}

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  footer?: string;
}

function FormSection({ title, children, footer }: FormSectionProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[typography.titleSmall, styles.sectionTitle, { color: colors.text }]}>
        {title}
      </Text>
      <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
      {footer ? (
        <Text style={[typography.caption, styles.sectionFooter, { color: colors.textTertiary }]}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

interface FieldRowProps {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}

function FieldRow({ label, children, last }: FieldRowProps) {
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.fieldRow}>
        <Text style={[typography.bodyMedium, styles.fieldLabel, { color: colors.text }]}>
          {label}
        </Text>
        {children}
      </View>
      {!last ? (
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      ) : null}
    </View>
  );
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [interestInput, setInterestInput] = useState('');

  const [gender, setGender] = useState('');
  const [intent, setIntent] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [pickingPhotos, setPickingPhotos] = useState(false);

  // Prefill from the locally cached content so the form opens on what the
  // user already has rather than on blank fields.
  useEffect(() => {
    let active = true;

    loadProfileContent()
      .then((content) => {
        if (!active || !content) return;
        setDisplayName(content.display_name ?? '');
        setAge(content.age != null ? String(content.age) : '');
        setGender(content.gender ?? '');
        setIntent(content.relationship_intent ?? '');
        setBio(content.bio ?? '');
        setInterests(content.interests ?? []);
        setPhotos(
          (content.photos ?? []).map((photo, index) => ({
            id: photo.id || `${index}`,
            uri: photo.url,
          }))
        );
      })
      .catch(() => {
        // No cached content — the form still lets the user compose one.
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const addInterest = useCallback(() => {
    const value = interestInput.trim();
    if (!value) return;
    if (interests.length >= MAX_INTERESTS) {
      Alert.alert('Too many interests', `You can add up to ${MAX_INTERESTS} interests.`);
      return;
    }
    if (interests.some((i) => i.toLowerCase() === value.toLowerCase())) return;
    setInterests((prev) => [...prev, value]);
    setInterestInput('');
  }, [interestInput, interests]);

  const pickPhotos = useCallback(async () => {
    if (pickingPhotos) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    setPickingPhotos(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });
      if (!result.canceled) {
        const next: SelectedPhoto[] = result.assets.map((asset) => ({
          id: asset.assetId ?? `${asset.uri}-${Date.now()}`,
          uri: asset.uri,
        }));
        setPhotos((prev) => [...prev, ...next].slice(0, MAX_PHOTOS));
      }
    } catch {
      Alert.alert('Could not open photos', 'Please check your photo permissions.');
    } finally {
      setPickingPhotos(false);
    }
  }, [pickingPhotos, photos.length]);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  }, []);

  const removeInterest = useCallback((value: string) => {
    setInterests((prev) => prev.filter((i) => i !== value));
  }, []);

  const save = useCallback(async () => {
    const name = displayName.trim();
    if (!name) {
      setError('Please add a display name.');
      return;
    }
    const ageText = age.trim();
    if (ageText) {
      const ageNum = Number(ageText);
      if (!Number.isInteger(ageNum) || ageNum < 18 || ageNum > 99) {
        setError('Age must be between 18 and 99.');
        return;
      }
    }
    if (bio.length > MAX_BIO_LENGTH) {
      setError(`Bio must be ${MAX_BIO_LENGTH} characters or fewer.`);
      return;
    }

    setSaving(true);
    setError(null);

    const content: ProfileContent = {
      display_name: name,
      age: ageText ? Number(ageText) : undefined,
      gender: gender || undefined,
      relationship_intent: intent || undefined,
      bio: bio.trim() || undefined,
      interests,
      photos: photos.map((photo, index) => ({
        id: photo.id,
        url: photo.uri,
        order: index,
      })),
      v: PROFILE_CONTENT_VERSION,
    };

    try {
      // Publishes the content and registers the new event with the profile
      // service. Previously this sent only the existing event id, so every
      // edit was discarded while still reporting success.
      await publishProfile(content);
      setSaving(false);
      Alert.alert('Profile saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      setSaving(false);

      // The text profile published; only the photos failed. Say exactly that
      // rather than implying the whole save was lost.
      if (err instanceof PhotoUploadError) {
        Alert.alert('Profile saved, photos not uploaded', err.message, [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      // Content is cached locally before publishing, so the edit survives.
      await saveProfileContentLocally(content).catch(() => {});
      setError(
        isServiceUnavailable(err)
          ? `${err.message} Your changes are saved on this device and will publish once it is.`
          : err instanceof Error
            ? err.message
            : 'Could not save your profile. Please try again.'
      );
    }
  }, [displayName, age, bio, gender, intent, interests, photos, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Host colorScheme={isDark ? 'dark' : 'light'} style={{ flex: 1 }}>
        <BackHeader title="Edit Profile" />
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
              Loading your profile…
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <FormSection title="Profile">
              <FieldRow label="Display name">
                <View style={styles.inputWrap}>
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="How others see you"
                    autoCapitalize="words"
                    maxLength={40}
                    style={[styles.inputFill, { ...typography.bodyMedium, color: colors.text }]}
                  />
                </View>
              </FieldRow>
              <FieldRow label="Age">
                <View style={styles.ageWrap}>
                  <TextInput
                    value={age}
                    onChangeText={setAge}
                    placeholder="18+"
                    keyboardType="number-pad"
                    maxLength={2}
                    style={[styles.inputFill, { ...typography.bodyMedium, color: colors.text }]}
                  />
                </View>
              </FieldRow>
              <FieldRow label="Gender">
                <Picker selectedValue={gender} onValueChange={setGender}>
                  {GENDER_OPTIONS.map((option) => (
                    <Picker.Item key={option.value || 'unspecified'} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </FieldRow>
              <FieldRow label="Looking for" last>
                <Picker selectedValue={intent} onValueChange={setIntent}>
                  {INTENT_OPTIONS.map((option) => (
                    <Picker.Item key={option.value || 'unspecified'} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </FieldRow>
            </FormSection>

            <FormSection
              title="About"
              footer={`${bio.length}/${MAX_BIO_LENGTH} characters`}
            >
              <FieldRow label="Bio" last>
                <View style={styles.bioWrap}>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell people a little about yourself"
                    multiline
                    maxLength={MAX_BIO_LENGTH}
                    style={[
                      styles.inputFill,
                      styles.bioInput,
                      { ...typography.bodyMedium, color: colors.text },
                    ]}
                  />
                </View>
              </FieldRow>
            </FormSection>

            <FormSection
              title="Interests"
              footer={interests.length > 0 ? `${interests.length} interest${interests.length === 1 ? '' : 's'}` : undefined}
            >
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={styles.fieldRow}>
                <View style={styles.inputWrap}>
                  <TextInput
                    value={interestInput}
                    onChangeText={setInterestInput}
                    placeholder="e.g. hiking, coffee, jazz"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.inputFill, { ...typography.bodyMedium, color: colors.text }]}
                    onSubmitEditing={addInterest}
                  />
                </View>
                <Pressable
                  onPress={addInterest}
                  style={({ pressed }) => [
                    styles.addButton,
                    { backgroundColor: colors.accentLight, opacity: pressed ? 0.7 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Add interest"
                >
                  <Text style={[typography.labelLarge, { color: colors.accent }]}>Add</Text>
                </Pressable>
              </View>
              {interests.length > 0 ? (
                <View style={styles.chips}>
                  {interests.map((interest) => (
                    <Pressable
                      key={interest}
                      onPress={() => removeInterest(interest)}
                      style={({ pressed }) => [
                        styles.chip,
                        { backgroundColor: colors.surfaceSheet, opacity: pressed ? 0.7 : 1 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${interest}`}
                    >
                      <Text style={[typography.labelMedium, { color: colors.text }]}>
                        {interest}
                      </Text>
                      <Text style={[typography.labelMedium, { color: colors.textTertiary }]}>
                        {'×'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </FormSection>

            <FormSection
              title="Photos"
              footer={`${photos.length}/${MAX_PHOTOS} photos — the first photo is your main one`}
            >
              <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              <View style={styles.photoGrid}>
                {photos.map((photo) => (
                  <View key={photo.id} style={styles.photoTile}>
                    <Image
                      source={{ uri: photo.uri }}
                      style={styles.photo}
                      contentFit="cover"
                      transition={150}
                    />
                    <Pressable
                      onPress={() => removePhoto(photo.id)}
                      style={({ pressed }) => [
                        styles.photoRemove,
                        { backgroundColor: colors.overlay, opacity: pressed ? 0.7 : 1 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Remove photo"
                    >
                      <Text style={styles.photoRemoveText}>×</Text>
                    </Pressable>
                  </View>
                ))}
                {photos.length < MAX_PHOTOS ? (
                  <Pressable
                    onPress={() => void pickPhotos()}
                    disabled={pickingPhotos}
                    style={({ pressed }) => [
                      styles.photoAdd,
                      {
                        borderColor: colors.border,
                        backgroundColor: pressed ? colors.surfaceSheet : colors.surface,
                        opacity: pickingPhotos ? 0.6 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Add photos"
                  >
                    <Text style={[typography.headlineLarge, { color: colors.textTertiary }]}>+</Text>
                    <Text style={[typography.caption, { color: colors.textTertiary }]}>Add photo</Text>
                  </Pressable>
                ) : null}
              </View>
            </FormSection>

            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.destructiveLight }]}>
                <Text style={[typography.bodySmall, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <Button
              variant="filled"
              disabled={saving}
              style={{ backgroundColor: colors.accent, borderRadius: radius.lg }}
              onPress={save}
            >
              <Text style={[typography.button, { color: colors.textInverse, textAlign: 'center' }]}>
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </Button>
          </ScrollView>
        )}
      </Host>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  sectionFooter: {
    marginTop: spacing.sm,
    marginLeft: spacing.sm,
  },
  group: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  fieldLabel: {
    width: 110,
  },
  inputWrap: {
    flex: 1,
  },
  inputFill: {
    width: '100%',
  },
  ageWrap: {
    width: 72,
  },
  bioWrap: {
    flex: 1,
    minHeight: 96,
  },
  bioInput: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.lg,
  },
  photoTile: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoRemoveText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600',
  },
  photoAdd: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  errorBanner: {
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
});
