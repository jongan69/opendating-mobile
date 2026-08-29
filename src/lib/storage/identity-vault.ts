import * as SecureStore from 'expo-secure-store';

import type { IdentityVault } from './identity-vault.types';

const PRIVKEY_KEY = 'opendating_privkey';
const PUBKEY_KEY = 'opendating_pubkey';

export const identityVault: IdentityVault = {
  async getState() {
    const [pubkey, privkey] = await Promise.all([
      SecureStore.getItemAsync(PUBKEY_KEY),
      SecureStore.getItemAsync(PRIVKEY_KEY),
    ]);
    return pubkey && privkey ? 'ready' : 'missing';
  },

  async save(identity) {
    await SecureStore.setItemAsync(PRIVKEY_KEY, identity.privkey);
    try {
      await SecureStore.setItemAsync(PUBKEY_KEY, identity.pubkey);
    } catch (error) {
      await SecureStore.deleteItemAsync(PRIVKEY_KEY).catch(() => {});
      throw error;
    }
  },

  async unlock() {
    const identity = await this.load();
    if (!identity) throw new Error('No account is stored on this device.');
    return identity;
  },

  async load() {
    const [pubkey, privkey] = await Promise.all([
      SecureStore.getItemAsync(PUBKEY_KEY),
      SecureStore.getItemAsync(PRIVKEY_KEY),
    ]);
    return pubkey && privkey ? { pubkey, privkey } : null;
  },

  async clear() {
    await Promise.all([
      SecureStore.deleteItemAsync(PRIVKEY_KEY),
      SecureStore.deleteItemAsync(PUBKEY_KEY),
    ]);
  },

  async lock() {
    // Native keys remain protected by the OS keychain. Browser-only locking
    // clears an in-memory decrypted key in identity-vault.web.ts.
  },
};

export type {
  EncryptedIdentityRecordV1,
  IdentityState,
  StoredIdentity,
} from './identity-vault.types';
