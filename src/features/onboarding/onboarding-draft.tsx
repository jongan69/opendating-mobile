// Onboarding draft — the profile data collected across onboarding screens.
// Held in memory (React context) until the review screen submits it via
// OpenDatingClient.createProfile(). Nothing here is persisted.
//
// Provided by OnboardingDraftProvider in the (onboarding) layout; screens
// read and update the draft with useOnboardingDraft().

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

// ---- Canonical option lists (shared by the onboarding pickers) ----

export interface OnboardingOption {
  value: string;
  label: string;
}

export const GENDER_OPTIONS: OnboardingOption[] = [
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

export const INTENT_OPTIONS: OnboardingOption[] = [
  { value: 'long_term', label: 'Long-term relationship' },
  { value: 'short_term', label: 'Something casual' },
  { value: 'friendship', label: 'Friendship' },
  { value: 'figuring_out', label: 'Still figuring it out' },
];

export const PROMPT_QUESTIONS: string[] = [
  'Two truths and a lie',
  'A fun fact about me',
  'My simple pleasures',
  "What I'm looking for",
  'The way to my heart is…',
  "I'm weirdly good at…",
];

export const MIN_AGE = 18;
export const MAX_AGE = 99;
export const MIN_PHOTOS = 2;
export const MAX_PHOTOS = 6;

// ---- Draft model ----

export interface OnboardingDraft {
  /** Set after createIdentity() / importIdentity() succeed. */
  pubkey: string | null;
  // Basics
  displayName: string;
  age: number | null;
  gender: string | null;
  // Preferences
  genderPreferences: string[];
  ageRangeMin: number;
  ageRangeMax: number;
  // Intent
  intent: string | null;
  // About
  bio: string;
  interests: string[];
  prompts: { question: string; answer: string }[];
  // Photos — local uris in display order
  photos: string[];
  // Location
  geohashPrefix: string | null;
  countryCode: string | null;
}

const DEFAULT_DRAFT: OnboardingDraft = {
  pubkey: null,
  displayName: '',
  age: null,
  gender: null,
  genderPreferences: [],
  ageRangeMin: 24,
  ageRangeMax: 38,
  intent: null,
  bio: '',
  interests: [],
  prompts: [],
  photos: [],
  geohashPrefix: null,
  countryCode: null,
};

// ---- Context ----

interface OnboardingDraftApi {
  draft: OnboardingDraft;
  update: <K extends keyof OnboardingDraft>(
    key: K,
    value: OnboardingDraft[K]
  ) => void;
  reset: () => void;
}

const OnboardingDraftContext = createContext<OnboardingDraftApi | null>(null);

export function OnboardingDraftProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState<OnboardingDraft>(DEFAULT_DRAFT);

  const update = useCallback(function update<
    K extends keyof OnboardingDraft,
  >(key: K, value: OnboardingDraft[K]) {
    setDraft((d) => (d[key] === value ? d : { ...d, [key]: value }));
  }, []);

  const reset = useCallback(() => setDraft(DEFAULT_DRAFT), []);

  const api = useMemo(() => ({ draft, update, reset }), [draft, update, reset]);

  return (
    <OnboardingDraftContext.Provider value={api}>
      {children}
    </OnboardingDraftContext.Provider>
  );
}

export function useOnboardingDraft(): OnboardingDraftApi {
  const ctx = useContext(OnboardingDraftContext);
  if (!ctx) {
    throw new Error(
      'useOnboardingDraft must be used within an OnboardingDraftProvider'
    );
  }
  return ctx;
}
