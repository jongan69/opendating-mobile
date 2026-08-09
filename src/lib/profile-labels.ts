// Canonical option lists and their display labels.
//
// These lived in three places — the onboarding draft, edit-profile, and inline
// `.replace('_', ' ')` calls at render sites — and had drifted: `friendship`
// read "Friendship" during onboarding and "New friends" in the editor, and the
// candidate card showed the raw wire value `figuring_out`. The wire values are
// protocol data; the labels are ours. Keeping both here means a value can only
// render one way.
//
// Plain data with no React imports, so both UI and non-UI code can use it.

export interface LabeledOption {
  value: string;
  label: string;
}

export const GENDER_OPTIONS: readonly LabeledOption[] = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

export const INTENT_OPTIONS: readonly LabeledOption[] = [
  { value: 'long_term', label: 'Long-term relationship' },
  { value: 'short_term', label: 'Something casual' },
  { value: 'friendship', label: 'Friendship' },
  { value: 'figuring_out', label: 'Still figuring it out' },
];

/**
 * Look up a label, falling back to a humanized form of the value.
 *
 * The fallback matters: the protocol can carry an intent this build has never
 * heard of, and showing `some_new_intent` to a member is worse than showing
 * "Some new intent". Never returns a raw snake_case string.
 */
export function labelFor(
  options: readonly LabeledOption[],
  value: string | null | undefined
): string {
  if (!value) return '';
  const match = options.find((o) => o.value === value);
  if (match) return match.label;
  return humanize(value);
}

/** `figuring_out` → `Figuring out`. Replaces every separator, not just the first. */
export function humanize(value: string): string {
  const spaced = value.replace(/[_-]+/g, ' ').trim();
  if (!spaced) return '';
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function intentLabel(value: string | null | undefined): string {
  return labelFor(INTENT_OPTIONS, value);
}

export function genderLabel(value: string | null | undefined): string {
  return labelFor(GENDER_OPTIONS, value);
}

/**
 * Distance buckets arrive as server-chosen strings. Only the wording is
 * adjusted; the bucket itself is never recomputed here, because the coarse
 * bucket *is* the privacy boundary.
 */
export function distanceLabel(bucket: string | null | undefined): string {
  if (!bucket) return '';
  const normalized = bucket.trim().toLowerCase();
  if (normalized === 'nearby' || normalized === 'within 5 mi') return 'Nearby';
  if (normalized === 'unknown' || normalized === 'worldwide') return '';
  return bucket.trim();
}
