// The user's own profile content — the name, photos, and bio other people
// actually see.
//
// The service-side profile record is only status and timestamps plus a
// pointer (`profile_event_id`) to the event carrying this content. Before
// this module existed the content was collected during onboarding, held in a
// React context, and dropped on the floor: `profile.create` and
// `profile.update` both sent empty payloads, so nothing was ever published
// and the Profile tab had nothing to render.
//
// Content is cached locally so the profile renders offline, edits prefill,
// and a failed publish leaves a recoverable draft rather than a lost one.

import { useCallback, useEffect, useState } from 'react';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import { storage } from '@/lib/storage';
import type { CandidatePhoto, ProfileContent } from '@/types/opendating';

export const PROFILE_CONTENT_VERSION = '0.1';

/**
 * Photos are picked from the device and start life as `file://` URIs, which
 * are meaningless to anyone else. Only photos already hosted somewhere
 * fetchable are worth publishing; local ones stay on device until a media
 * service exists to upload them.
 */
function publishablePhotos(photos: CandidatePhoto[] | undefined): CandidatePhoto[] {
  return (photos ?? []).filter((p) => /^https?:\/\//i.test(p.url));
}

export function emptyProfileContent(): ProfileContent {
  return { display_name: '', v: PROFILE_CONTENT_VERSION };
}

/** Read the locally cached profile content. */
export async function loadProfileContent(): Promise<ProfileContent | null> {
  return storage.getProfileContent<ProfileContent>();
}

/** Cache profile content locally without publishing it. */
export async function saveProfileContentLocally(
  content: ProfileContent
): Promise<void> {
  await storage.saveProfileContent(content);
}

/**
 * Persist locally, then publish to the profile service.
 *
 * The local write happens first and unconditionally: a network failure must
 * never cost the user the profile they just filled in.
 */
export async function publishProfile(content: ProfileContent): Promise<void> {
  const normalised: ProfileContent = {
    ...content,
    display_name: content.display_name.trim(),
    bio: content.bio?.trim() || undefined,
    v: PROFILE_CONTENT_VERSION,
  };

  await saveProfileContentLocally(normalised);

  await getOpenDatingClient().updateProfile({
    ...normalised,
    photos: publishablePhotos(normalised.photos),
  });
}

/**
 * Adopt the server's copy of the profile when the device has none — a
 * reinstall or a new device would otherwise open onboarding on empty fields
 * despite the member already having a profile.
 */
export async function restoreProfileFromServer(): Promise<ProfileContent | null> {
  const existing = await loadProfileContent();
  if (existing) return existing;

  try {
    const profile = await getOpenDatingClient().getProfile();
    const content = profile.profile;
    if (!content?.display_name) return null;
    await saveProfileContentLocally({ ...content, v: PROFILE_CONTENT_VERSION });
    return content;
  } catch {
    return null;
  }
}

export interface UseProfileContentResult {
  content: ProfileContent | null;
  loading: boolean;
  reload: () => Promise<void>;
}

/** Reactive access to the locally cached profile content. */
export function useProfileContent(): UseProfileContentResult {
  const [content, setContent] = useState<ProfileContent | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const loaded = await loadProfileContent();
    setContent(loaded);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    loadProfileContent()
      .then((loaded) => {
        if (active) {
          setContent(loaded);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { content, loading, reload };
}
