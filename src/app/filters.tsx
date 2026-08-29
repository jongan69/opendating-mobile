import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/state/theme-context';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import {
  applyDiscoveryPreferences,
  getDiscoveryPreferences,
  hydrateDiscoveryPreferences,
  kmToMiles,
  resetDiscoveryPreferences,
} from '@/features/discovery/discovery-preferences';
import { INTENT_OPTIONS } from '@/features/onboarding/onboarding-draft';

const KM_PER_MILE = 1.609344;

const GENDER_OPTIONS = ['woman', 'man', 'nonbinary', 'other'] as const;
const DISTANCE_OPTIONS = [5, 10, 25, 50, 100] as const;

export default function FiltersScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // Preload saved preferences so the sheet opens on the current values rather
  // than on hardcoded defaults.
  const [genders, setGenders] = useState<string[]>(() => {
    const saved = getDiscoveryPreferences();
    return saved.genders ?? [];
  });
  const [intent, setIntent] = useState<string | undefined>(() => {
    const saved = getDiscoveryPreferences();
    return saved.intent;
  });
  const [minAge, setMinAge] = useState(() => {
    const saved = getDiscoveryPreferences();
    return saved.min_age ?? 18;
  });
  const [maxAge, setMaxAge] = useState(() => {
    const saved = getDiscoveryPreferences();
    return saved.max_age != null ? Math.min(saved.max_age, 80) : 55;
  });
  const [distance, setDistance] = useState(() => {
    const saved = getDiscoveryPreferences();
    return saved.max_distance_km != null ? kmToMiles(saved.max_distance_km) : 25;
  });

  const toggleGender = (g: string) => {
    setGenders((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  };

  useEffect(() => {
    void hydrateDiscoveryPreferences().then((saved) => {
      setGenders(saved.genders ?? []);
      setIntent(saved.intent);
      setMinAge(saved.min_age ?? 18);
      setMaxAge(saved.max_age != null ? Math.min(saved.max_age, 80) : 55);
      setDistance(saved.max_distance_km != null ? kmToMiles(saved.max_distance_km) : 25);
    });
  }, []);

  // Apply persists the filters (local store + server, best-effort), then
  // closes the sheet.
  const handleApply = async () => {
    await applyDiscoveryPreferences({
      min_age: minAge,
      max_age: maxAge,
      max_distance_km: Math.round(distance * KM_PER_MILE),
      genders: genders.length > 0 ? genders : undefined,
      intent,
    });
    router.back();
  };

  const handleReset = async () => {
    setGenders([]);
    setIntent(undefined);
    setMinAge(18);
    setMaxAge(55);
    setDistance(25);
    await resetDiscoveryPreferences();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={[typography.bodyMedium, { color: colors.accent }]}>Cancel</Text>
        </Pressable>
        <Text style={[typography.titleSmall, { color: colors.text }]}>Filters</Text>
        <Pressable onPress={() => void handleReset()}>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>Reset</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Gender */}
        <Text style={[typography.titleSmall, { color: colors.text, marginBottom: spacing.md }]}>Show me</Text>
        <View style={styles.chipRow}>
          {GENDER_OPTIONS.map((g) => (
            <Pressable
              key={g}
              onPress={() => toggleGender(g)}
              style={[
                styles.chip,
                {
                  backgroundColor: genders.includes(g) ? colors.accent : colors.surface,
                  borderColor: genders.includes(g) ? colors.accent : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  typography.labelMedium,
                  { color: genders.includes(g) ? colors.textInverse : colors.text },
                ]}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Age */}
        <Text style={[typography.titleSmall, { color: colors.text, marginBottom: spacing.md, marginTop: spacing.xxl }]}>
          Age range: {minAge}–{maxAge}
        </Text>
        <View style={styles.ageRow}>
          {[18, 25, 35, 45, 55, 65].map((a) => (
            <Pressable
              key={a}
              onPress={() => {
                if (a <= maxAge) setMinAge(a);
              }}
              style={[
                styles.ageBtn,
                {
                  backgroundColor: minAge === a ? colors.accentLight : colors.surface,
                  borderColor: minAge === a ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[typography.labelSmall, { color: minAge === a ? colors.accent : colors.textSecondary }]}>{a}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.ageRow, { marginTop: spacing.sm }]}>
          {[25, 35, 45, 55, 65, 80].map((a) => (
            <Pressable
              key={a}
              onPress={() => {
                if (a >= minAge) setMaxAge(a);
              }}
              style={[
                styles.ageBtn,
                {
                  backgroundColor: maxAge === a ? colors.accentLight : colors.surface,
                  borderColor: maxAge === a ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[typography.labelSmall, { color: maxAge === a ? colors.accent : colors.textSecondary }]}>{a}</Text>
            </Pressable>
          ))}
        </View>

        {/* Distance */}
        <Text style={[typography.titleSmall, { color: colors.text, marginBottom: spacing.md, marginTop: spacing.xxl }]}>
          Distance: up to {distance} miles
        </Text>
        <View style={styles.chipRow}>
          {DISTANCE_OPTIONS.map((d) => (
            <Pressable
              key={d}
              onPress={() => setDistance(d)}
              style={[
                styles.chip,
                {
                  backgroundColor: distance === d ? colors.accent : colors.surface,
                  borderColor: distance === d ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[typography.labelMedium, { color: distance === d ? colors.textInverse : colors.text }]}>
                {d} mi
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Intent */}
        <Text style={[typography.titleSmall, { color: colors.text, marginBottom: spacing.md, marginTop: spacing.xxl }]}>
          Relationship intent
        </Text>
        <View style={styles.chipRow}>
          {INTENT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setIntent((value) => (value === option.value ? undefined : option.value))}
              style={[
                styles.chip,
                {
                  backgroundColor: intent === option.value ? colors.accent : colors.surface,
                  borderColor: intent === option.value ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[typography.labelMedium, { color: intent === option.value ? colors.textInverse : colors.text }]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Apply */}
        <Pressable
          onPress={() => void handleApply()}
          style={({ pressed }) => [
            styles.applyBtn,
            { backgroundColor: pressed ? colors.accentMuted : colors.accent, marginTop: spacing.huge },
          ]}
        >
          <Text style={[typography.button, { color: colors.textInverse }]}>Apply</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.full, borderWidth: 1 },
  ageRow: { flexDirection: 'row', gap: spacing.sm },
  ageBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1, alignItems: 'center' },
  applyBtn: { paddingVertical: spacing.lg, borderRadius: radius.full, alignItems: 'center' },
});
