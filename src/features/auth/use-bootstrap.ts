// App bootstrap state machine
// Controls the deterministic startup sequence

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getOpenDatingClient,
  resetOpenDatingClient,
} from '@/lib/opendating/open-dating-client';
import { isServiceUnavailable } from '@/lib/opendating/errors';
import { restoreProfileFromServer } from '@/features/profile/profile-content';
import { storage } from '@/lib/storage';
import type { AppBootstrapState, OpenDatingServiceRole } from '@/types/opendating';

/**
 * Services the app cannot present a usable experience without. `system` is
 * excluded: reaching the relay at all already proves it.
 */
const REQUIRED_SERVICES: OpenDatingServiceRole[] = ['profile', 'discovery', 'matcher'];

interface BootstrapResult {
  state: AppBootstrapState;
  error: string | null;
  /** Services the relay is missing when state is 'services_unavailable'. */
  missingServices: OpenDatingServiceRole[];
  retry: () => void;
}

export function useBootstrap(): BootstrapResult {
  const [appState, setAppState] = useState<AppBootstrapState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [missingServices, setMissingServices] = useState<OpenDatingServiceRole[]>([]);
  const bootingRef = useRef(false);

  const bootstrap = useCallback(async () => {
    if (bootingRef.current) return;
    bootingRef.current = true;
    setError(null);

    try {
      const client = getOpenDatingClient();

      // Step 1: Check identity
      setAppState('loading');
      const hasId = await client.hasIdentity();

      if (!hasId) {
        setAppState('no_identity');
        return;
      }

      // Step 2: Load identity
      const identity = await client.loadIdentity();
      if (!identity) {
        setAppState('no_identity');
        return;
      }

      // Step 3: Connect. connect() performs capability discovery itself, so
      // there is no separate fetch here — doing it twice cost an extra
      // round-trip on every cold start.
      setAppState('connecting');
      await client.connect();

      setAppState('fetching_capabilities');
      const caps = client.getCapabilities();

      // Verify protocol compatibility
      if (!caps || !caps.protocol_versions.includes(client.getProtocolVersion())) {
        setAppState('error');
        setError('This version of OpenDating is not supported. Please update the app.');
        return;
      }

      // Step 4: Confirm the relay actually runs what the app needs. Without
      // this check every screen would instead fail one by one with its own
      // error, and a returning user would be pushed back through onboarding
      // on every launch because their profile could not be read.
      const missing = REQUIRED_SERVICES.filter((role) => !client.hasService(role));
      if (missing.length > 0) {
        setMissingServices(missing);
        setAppState('services_unavailable');
        return;
      }
      setMissingServices([]);

      // Step 5: Check profile
      setAppState('checking_profile');
      try {
        const profile = await client.getProfile();
        if (profile && profile.status !== 'deleted') {
          // A reinstall or new device has the identity but no cached content.
          // Adopt the server's copy so the app opens on the real profile
          // instead of an empty one.
          await restoreProfileFromServer();
          setAppState('ready');
          return;
        }
      } catch (err) {
        // A transient failure must not be read as "no profile" — that would
        // send an existing member back through onboarding. Only trust the
        // local completion flag to tell those apart.
        if (!isServiceUnavailable(err) && (await storage.isOnboardingComplete())) {
          setAppState('error');
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load your profile. Please try again.'
          );
          return;
        }
      }

      setAppState('no_profile');
    } catch (err) {
      setAppState('error');
      setError(
        err instanceof Error ? err.message : 'Unable to connect to OpenDating'
      );
    } finally {
      bootingRef.current = false;
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const retry = useCallback(() => {
    void resetOpenDatingClient().then(() => {
      bootingRef.current = false;
      return bootstrap();
    });
  }, [bootstrap]);

  return { state: appState, error, missingServices, retry };
}
