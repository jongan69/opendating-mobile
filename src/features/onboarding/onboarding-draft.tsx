// Onboarding draft — the profile data collected across onboarding screens,
// submitted by the review screen via OpenDatingClient.
//
// Persisted as it changes. Onboarding is eleven steps and people get
// interrupted; without this, a reload or an OS memory kill discarded
// everything typed so far and left them on the review step with empty fields
// and a disabled button they could not explain.
//
// Provided by OnboardingDraftProvider in the (onboarding) layout; screens
// read and update the draft with useOnboardingDraft().

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { isScreenshotMode } from '@/constants/env';
import { storage } from '@/lib/storage';
import { CURRENT_POLICY_VERSION, type PolicyAcceptance } from '@/lib/policy';

// ---- Option lists ----
// Re-exported from the canonical source so the onboarding pickers, the profile
// editor, and every read-only render site cannot disagree about what a value
// is called. See src/lib/profile-labels.ts.

export {
  GENDER_OPTIONS,
  INTENT_OPTIONS,
  type LabeledOption as OnboardingOption,
} from '@/lib/profile-labels';

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
// Re-exported so onboarding screens keep a single import for draft concerns.
export { CURRENT_POLICY_VERSION };
export type { PolicyAcceptance };

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
  // Terms of Service + Community Standards consent
  policyAcceptance: PolicyAcceptance | null;
}

const DEMO_DRAFT: OnboardingDraft = {
  pubkey: 'demo-pubkey-0000000000000000000000000000000000000000000000000000000000000000',
  displayName: 'Alex',
  age: 28,
  gender: 'woman',
  genderPreferences: ['woman', 'man', 'nonbinary'],
  ageRangeMin: 24,
  ageRangeMax: 38,
  intent: 'long_term',
  bio: 'Coffee enthusiast, weekend hiker, and lover of bad puns. Looking for someone who laughs at my jokes (even the terrible ones).',
  interests: ['hiking', 'coffee', 'photography', 'cooking'],
  prompts: [
    { question: 'Two truths and a lie', answer: 'I once climbed Kilimanjaro. I speak three languages. I hate chocolate.' },
  ],
  photos: [],
  geohashPrefix: '9q8yy',
  countryCode: 'US',
  policyAcceptance: {
    version: CURRENT_POLICY_VERSION,
    acceptedAt: '2026-08-09T00:00:00.000Z',
  },
};

const DEFAULT_DRAFT: OnboardingDraft = isScreenshotMode
  ? DEMO_DRAFT
  : {
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
      policyAcceptance: null,
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

  // Rehydrate anything from a previous run. Onboarding is eleven steps; losing
  // it to a reload, a backgrounded app, or an OS memory kill left the member
  // on the review step with empty fields and a permanently disabled button and
  // no way to understand why.
  useEffect(() => {
    if (isScreenshotMode) return;

    let active = true;
    storage
      .getOnboardingDraft<Partial<OnboardingDraft>>()
      .then((saved) => {
        if (!active || !saved) return;
        // Merged over the defaults so a draft written by an older build that
        // lacks newer fields still loads.
        setDraft((current) => ({ ...current, ...saved }));
      })
      .catch(() => {
        // A corrupt draft must not block onboarding — start fresh instead.
      });
    return () => {
      active = false;
    };
  }, []);

  const update = useCallback(function update<
    K extends keyof OnboardingDraft,
  >(key: K, value: OnboardingDraft[K]) {
    setDraft((d) => {
      if (d[key] === value) return d;
      const next = { ...d, [key]: value };
      // Fire-and-forget: a failed write costs resumability, never the step the
      // user is on.
      void storage.saveOnboardingDraft(next).catch(() => {});
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setDraft(DEFAULT_DRAFT);
    void storage.clearOnboardingDraft().catch(() => {});
  }, []);

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
