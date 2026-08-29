import { derivePublicKey } from 'opendating-protocol';

import {
  IdentityVaultLockedError,
  IdentityVaultUnavailableError,
  IdentityVaultUnlockError,
  type EncryptedIdentityRecordV1,
  type IdentityVault,
  type StoredIdentity,
} from './identity-vault.types';

const VAULT_KEY = 'opendating_identity_vault_v1';
const VAULT_AAD = new TextEncoder().encode('OpenDating identity vault v1');
const KDF_ITERATIONS = 600_000;
const HEX_KEY = /^[0-9a-f]{64}$/;

let unlockedIdentity: StoredIdentity | null = null;

function getBrowserStorage(): Storage {
  try {
    const storage = globalThis.localStorage;
    if (!storage) throw new Error('missing');
    return storage;
  } catch {
    throw new IdentityVaultUnavailableError();
  }
}

function readVaultRecord(): string | null {
  try {
    return getBrowserStorage().getItem(VAULT_KEY);
  } catch (error) {
    if (error instanceof IdentityVaultUnavailableError) throw error;
    throw new IdentityVaultUnavailableError();
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return globalThis.btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function parseRecord(raw: string): EncryptedIdentityRecordV1 {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new IdentityVaultUnlockError();
  }
  if (
    typeof value !== 'object' ||
    value === null ||
    (value as EncryptedIdentityRecordV1).version !== 1 ||
    (value as EncryptedIdentityRecordV1).kdf !== 'PBKDF2' ||
    (value as EncryptedIdentityRecordV1).hash !== 'SHA-256' ||
    (value as EncryptedIdentityRecordV1).iterations !== KDF_ITERATIONS ||
    (value as EncryptedIdentityRecordV1).cipher !== 'AES-GCM' ||
    typeof (value as EncryptedIdentityRecordV1).salt !== 'string' ||
    typeof (value as EncryptedIdentityRecordV1).iv !== 'string' ||
    typeof (value as EncryptedIdentityRecordV1).ciphertext !== 'string'
  ) {
    throw new IdentityVaultUnlockError();
  }
  return value as EncryptedIdentityRecordV1;
}

function assertIdentity(value: unknown): asserts value is StoredIdentity {
  if (
    typeof value !== 'object' ||
    value === null ||
    typeof (value as StoredIdentity).pubkey !== 'string' ||
    typeof (value as StoredIdentity).privkey !== 'string' ||
    !HEX_KEY.test((value as StoredIdentity).pubkey) ||
    !HEX_KEY.test((value as StoredIdentity).privkey) ||
    derivePublicKey((value as StoredIdentity).privkey) !== (value as StoredIdentity).pubkey
  ) {
    throw new IdentityVaultUnlockError();
  }
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
  usages: KeyUsage[]
): Promise<CryptoKey> {
  const material = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: KDF_ITERATIONS,
      salt: salt as BufferSource,
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    usages
  );
}

export async function encryptIdentity(
  identity: StoredIdentity,
  passphrase: string
): Promise<EncryptedIdentityRecordV1> {
  if (passphrase.length < 12) {
    throw new Error('Use at least 12 characters for your browser lock passphrase.');
  }
  assertIdentity(identity);
  if (!globalThis.crypto?.subtle) throw new IdentityVaultUnavailableError();

  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, ['encrypt']);
  const plaintext = new TextEncoder().encode(JSON.stringify(identity));
  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource, additionalData: VAULT_AAD },
    key,
    plaintext
  );

  return {
    version: 1,
    kdf: 'PBKDF2',
    hash: 'SHA-256',
    iterations: KDF_ITERATIONS,
    salt: toBase64(salt),
    cipher: 'AES-GCM',
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptIdentity(
  record: EncryptedIdentityRecordV1,
  passphrase: string
): Promise<StoredIdentity> {
  if (!globalThis.crypto?.subtle) throw new IdentityVaultUnavailableError();
  try {
    const salt = fromBase64(record.salt);
    const iv = fromBase64(record.iv);
    if (salt.length !== 16 || iv.length !== 12) throw new Error('invalid record');
    const key = await deriveKey(passphrase, salt, ['decrypt']);
    const plaintext = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource, additionalData: VAULT_AAD },
      key,
      fromBase64(record.ciphertext) as BufferSource
    );
    const identity: unknown = JSON.parse(new TextDecoder().decode(plaintext));
    assertIdentity(identity);
    return identity;
  } catch (error) {
    if (error instanceof IdentityVaultUnavailableError) throw error;
    throw new IdentityVaultUnlockError();
  }
}

export const identityVault: IdentityVault = {
  async getState() {
    if (unlockedIdentity) return 'ready';
    return readVaultRecord() ? 'locked' : 'missing';
  },

  async save(identity, passphrase) {
    if (!passphrase) {
      throw new Error('Create a browser lock passphrase before saving this account.');
    }
    const record = await encryptIdentity(identity, passphrase);
    try {
      getBrowserStorage().setItem(VAULT_KEY, JSON.stringify(record));
    } catch {
      throw new IdentityVaultUnavailableError();
    }
    unlockedIdentity = identity;
  },

  async unlock(passphrase) {
    const raw = readVaultRecord();
    if (!raw) throw new Error('No account is stored in this browser.');
    const identity = await decryptIdentity(parseRecord(raw), passphrase);
    unlockedIdentity = identity;
    return identity;
  },

  async load() {
    if (unlockedIdentity) return unlockedIdentity;
    if (readVaultRecord()) throw new IdentityVaultLockedError();
    return null;
  },

  async clear() {
    try {
      getBrowserStorage().removeItem(VAULT_KEY);
    } catch {
      throw new IdentityVaultUnavailableError();
    } finally {
      unlockedIdentity = null;
    }
  },

  async lock() {
    unlockedIdentity = null;
  },
};

export type {
  EncryptedIdentityRecordV1,
  IdentityState,
  StoredIdentity,
} from './identity-vault.types';
