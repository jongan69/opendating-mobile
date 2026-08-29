import { generateKeypair } from 'opendating-protocol';

import { identityVault } from '../identity-vault.web';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('browser identity vault', () => {
  const storage = new MemoryStorage();

  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  });

  beforeEach(async () => {
    storage.clear();
    await identityVault.lock();
  });

  it('encrypts, locks, rejects wrong/tampered records, unlocks, and clears', async () => {
    const pair = generateKeypair();
    await identityVault.save(
      { privkey: pair.privateKey, pubkey: pair.publicKey },
      'a long browser passphrase'
    );

    const persisted = storage.getItem('opendating_identity_vault_v1')!;
    expect(persisted).not.toContain(pair.privateKey);
    expect(persisted).not.toContain(pair.publicKey);
    expect(await identityVault.getState()).toBe('ready');

    await identityVault.lock();
    expect(await identityVault.getState()).toBe('locked');
    await expect(identityVault.unlock('wrong passphrase')).rejects.toThrow(/did not unlock/);
    await expect(identityVault.unlock('a long browser passphrase')).resolves.toEqual({
      privkey: pair.privateKey,
      pubkey: pair.publicKey,
    });

    await identityVault.lock();
    const record = JSON.parse(persisted) as { ciphertext: string };
    record.ciphertext = `${record.ciphertext.slice(0, -2)}AA`;
    storage.setItem('opendating_identity_vault_v1', JSON.stringify(record));
    await expect(identityVault.unlock('a long browser passphrase')).rejects.toThrow(/did not unlock/);

    await identityVault.clear();
    expect(await identityVault.getState()).toBe('missing');
  });

  it('surfaces unavailable browser storage', async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new Error('blocked'); },
    });
    await expect(identityVault.getState()).rejects.toThrow(/storage is unavailable/);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  });
});
