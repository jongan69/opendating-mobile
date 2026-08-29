export type IdentityState = 'missing' | 'locked' | 'ready';

export interface StoredIdentity {
  pubkey: string;
  privkey: string;
}

export interface EncryptedIdentityRecordV1 {
  version: 1;
  kdf: 'PBKDF2';
  hash: 'SHA-256';
  iterations: number;
  salt: string;
  cipher: 'AES-GCM';
  iv: string;
  ciphertext: string;
}

export interface IdentityVault {
  getState(): Promise<IdentityState>;
  save(identity: StoredIdentity, passphrase?: string): Promise<void>;
  unlock(passphrase: string): Promise<StoredIdentity>;
  load(): Promise<StoredIdentity | null>;
  clear(): Promise<void>;
  lock(): Promise<void>;
}

export class IdentityVaultLockedError extends Error {
  constructor() {
    super('This browser is locked. Enter your browser lock passphrase.');
    this.name = 'IdentityVaultLockedError';
  }
}

export class IdentityVaultUnavailableError extends Error {
  constructor() {
    super(
      'Secure browser storage is unavailable. Leave private browsing or enable site storage and try again.'
    );
    this.name = 'IdentityVaultUnavailableError';
  }
}

export class IdentityVaultUnlockError extends Error {
  constructor() {
    super('That passphrase did not unlock this browser. Check it and try again.');
    this.name = 'IdentityVaultUnlockError';
  }
}
