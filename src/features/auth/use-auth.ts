// Auth hook
// Wraps the client's identity methods (SecureStore-backed keypair) and
// exposes the current authentication state to the UI.

import { useCallback, useEffect, useRef, useState } from 'react';
import { getOpenDatingClient } from '@/lib/opendating/open-dating-client';

export interface UseAuthResult {
  isAuthenticated: boolean;
  pubkey: string | null;
  loading: boolean;
  error: string | null;
  createAccount: () => Promise<{ pubkey: string }>;
  importAccount: (privkey: string) => Promise<{ pubkey: string }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

function toUserMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

export function useAuth(): UseAuthResult {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Restore identity from SecureStore on mount.
  useEffect(() => {
    mountedRef.current = true;

    const client = getOpenDatingClient();
    (async () => {
      try {
        const has = await client.hasIdentity();
        if (!has) return;
        const storedPubkey = await client.getPubkey();
        if (mountedRef.current) {
          setIsAuthenticated(true);
          setPubkey(storedPubkey);
        }
      } catch {
        // SecureStore read failed — treat as signed out.
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Auth actions rethrow on failure so callers can branch on success/failure;
  // the error state is also set for display purposes.

  const createAccount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getOpenDatingClient().createIdentity();
      if (mountedRef.current) {
        setIsAuthenticated(true);
        setPubkey(result.pubkey);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) setError(toUserMessage(err));
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const importAccount = useCallback(async (privkey: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getOpenDatingClient().importIdentity(privkey);
      if (mountedRef.current) {
        setIsAuthenticated(true);
        setPubkey(result.pubkey);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) setError(toUserMessage(err));
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await getOpenDatingClient().deleteIdentity();
      if (mountedRef.current) {
        setIsAuthenticated(false);
        setPubkey(null);
      }
    } catch (err) {
      if (mountedRef.current) setError(toUserMessage(err));
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const client = getOpenDatingClient();
      // Ask the server to delete the account first, then wipe local identity.
      await client.deleteAccount();
      await client.deleteIdentity();
      if (mountedRef.current) {
        setIsAuthenticated(false);
        setPubkey(null);
      }
    } catch (err) {
      if (mountedRef.current) setError(toUserMessage(err));
      throw err;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  return {
    isAuthenticated,
    pubkey,
    loading,
    error,
    createAccount,
    importAccount,
    logout,
    deleteAccount,
  };
}
