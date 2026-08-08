// Profile management hook
// Fetches the user's profile on mount, caches it in local state, and
// coordinates updates, pause, and resume with the server.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';
import type { OpenDatingProfile, ProfileContent } from '@/types/opendating';

export interface UseProfileResult {
  profile: OpenDatingProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (content: ProfileContent) => Promise<void>;
  pauseProfile: () => Promise<void>;
  resumeProfile: () => Promise<void>;
  isPaused: boolean;
}

function toUserMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<OpenDatingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetched = await getOpenDatingClient().getProfile();
      if (!mountedRef.current) return;
      setProfile(fetched);
    } catch (err) {
      if (mountedRef.current) setError(toUserMessage(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  /**
   * Persist a profile update, then re-fetch so local state matches the
   * server's canonical profile.
   */
  const updateProfile = useCallback(async (content: ProfileContent) => {
    setLoading(true);
    setError(null);

    try {
      await getOpenDatingClient().updateProfile(content);
      const updated = await getOpenDatingClient().getProfile();
      if (mountedRef.current) setProfile(updated);
    } catch (err) {
      if (mountedRef.current) setError(toUserMessage(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const pauseProfile = useCallback(async () => {
    setError(null);
    try {
      await getOpenDatingClient().pauseProfile();
      setProfile((prev) =>
        prev
          ? { ...prev, status: 'paused', updated_at: Math.floor(Date.now() / 1000) }
          : prev
      );
    } catch (err) {
      setError(toUserMessage(err));
      throw err;
    }
  }, []);

  const resumeProfile = useCallback(async () => {
    setError(null);
    try {
      await getOpenDatingClient().resumeProfile();
      setProfile((prev) =>
        prev
          ? { ...prev, status: 'active', updated_at: Math.floor(Date.now() / 1000) }
          : prev
      );
    } catch (err) {
      setError(toUserMessage(err));
      throw err;
    }
  }, []);

  // Initial load: fetch and cache the profile.
  useEffect(() => {
    mountedRef.current = true;
    refreshProfile();
    return () => {
      mountedRef.current = false;
    };
  }, [refreshProfile]);

  const isPaused = profile?.status === 'paused';

  return {
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile,
    pauseProfile,
    resumeProfile,
    isPaused,
  };
}
