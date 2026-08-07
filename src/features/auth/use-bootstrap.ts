// App bootstrap state machine
// Controls the deterministic startup sequence

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getOpenDatingClient,
  resetOpenDatingClient,
} from '@/lib/opendating/open-dating-client';
import { storage } from '@/lib/storage';
import type { AppBootstrapState, ConnectionState } from '@/types/opendating';

interface BootstrapResult {
  state: AppBootstrapState;
  error: string | null;
  retry: () => void;
}

export function useBootstrap(): BootstrapResult {
  const [appState, setAppState] = useState<AppBootstrapState>('loading');
  const [error, setError] = useState<string | null>(null);
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
        bootingRef.current = false;
        return;
      }

      // Step 2: Load identity
      const identity = await client.loadIdentity();
      if (!identity) {
        setAppState('no_identity');
        bootingRef.current = false;
        return;
      }

      // Step 3: Connect to relay
      setAppState('connecting');
      await client.connect();

      // Step 4: Check capabilities
      setAppState('fetching_capabilities');
      const caps = await client.fetchCapabilities();

      // Verify protocol compatibility
      if (!caps.protocol_versions.includes('0.1')) {
        setAppState('error');
        setError('This version of OpenDating is not supported. Please update the app.');
        bootingRef.current = false;
        return;
      }

      // Step 5: Check profile
      setAppState('checking_profile');
      try {
        const profile = await client.getProfile();
        if (profile && profile.status !== 'deleted') {
          setAppState('ready');
          bootingRef.current = false;
          return;
        }
      } catch {
        // Profile not found — needs onboarding
      }

      setAppState('no_profile');
      bootingRef.current = false;
    } catch (err) {
      setAppState('error');
      setError(
        err instanceof Error ? err.message : 'Unable to connect to OpenDating'
      );
      bootingRef.current = false;
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const retry = useCallback(() => {
    resetOpenDatingClient();
    bootingRef.current = false;
    bootstrap();
  }, [bootstrap]);

  return { state: appState, error, retry };
}
