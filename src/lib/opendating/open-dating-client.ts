// OpenDating Client Facade
// Wraps NDK Mobile + opendating-protocol into a clean domain API.
// Screens never construct Nostr events, gift wraps, or envelopes directly.

import NDK, {
  NDKEvent,
  NDKFilter,
  NDKSubscription,
} from '@nostr-dev-kit/ndk-mobile';
import {
  createEnvelope,
  buildGiftWrap,
  nip44Decrypt,
  generateKeypair,
  type OpenDatingEnvelope,
} from 'opendating-protocol';
import * as SecureStore from 'expo-secure-store';
import {
  type OpenDatingCapabilities,
  type OpenDatingServices,
  type CandidatePage,
  type CandidateQuery,
  type LikeResult,
  type Match,
  type Block,
  type ReportInput,
  type VerificationClaim,
  type DiscoveryPreferences,
  type OpenDatingProfile,
  type ConnectionState,
  type ODMessage,
} from '@/types/opendating';
import { mapServiceError } from './errors';

// ---- Constants ----

const RELAY_URL =
  process.env.EXPO_PUBLIC_OPENDATING_RELAY_URL ??
  'wss://opendating-relay.jonathang132298.workers.dev';
const INFO_URL =
  process.env.EXPO_PUBLIC_OPENDATING_INFO_URL ??
  'https://opendating-relay.jonathang132298.workers.dev';
const PROTOCOL_VERSION =
  process.env.EXPO_PUBLIC_OPENDATING_PROTOCOL_VERSION ?? '0.1';

const SECURE_STORE_PRIVKEY_KEY = 'opendating_privkey';
const SECURE_STORE_PUBKEY_KEY = 'opendating_pubkey';
const SERVICES_CACHE_KEY = 'opendating_services_cache';

const REQUEST_TIMEOUT_MS = 30_000;

// ---- Types ----

interface PendingRequest {
  resolve: (value: OpenDatingEnvelope) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface OpenDatingClientConfig {
  relayUrl?: string;
  infoUrl?: string;
}

// ---- Client Implementation ----

class OpenDatingClientImpl {
  private ndk: NDK | null = null;
  private userPubkey: string = '';
  private userPrivkey: string = '';
  private services: OpenDatingServices | null = null;
  private capabilities: OpenDatingCapabilities | null = null;
  private connectionState: ConnectionState = 'starting';
  private pendingRequests = new Map<string, PendingRequest>();
  private responseSub: NDKSubscription | null = null;
  private matchSub: NDKSubscription | null = null;
  private messageSub: NDKSubscription | null = null;
  private stateListeners = new Set<(state: ConnectionState) => void>();
  private matchListeners = new Set<(match: Match) => void>();
  private messageListeners = new Set<(msg: ODMessage) => void>();

  // ---- Connection State ----

  getState(): ConnectionState {
    return this.connectionState;
  }

  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private setState(state: ConnectionState) {
    this.connectionState = state;
    this.stateListeners.forEach((fn) => fn(state));
  }

  // ---- Identity ----

  async hasIdentity(): Promise<boolean> {
    const pubkey = await SecureStore.getItemAsync(SECURE_STORE_PUBKEY_KEY);
    const privkey = await SecureStore.getItemAsync(SECURE_STORE_PRIVKEY_KEY);
    return !!(pubkey && privkey);
  }

  async getPubkey(): Promise<string | null> {
    return SecureStore.getItemAsync(SECURE_STORE_PUBKEY_KEY);
  }

  async createIdentity(): Promise<{ pubkey: string }> {
    const kp = generateKeypair();
    await SecureStore.setItemAsync(SECURE_STORE_PRIVKEY_KEY, kp.privateKey);
    await SecureStore.setItemAsync(SECURE_STORE_PUBKEY_KEY, kp.publicKey);
    this.userPubkey = kp.publicKey;
    this.userPrivkey = kp.privateKey;
    return { pubkey: kp.publicKey };
  }

  async importIdentity(privkeyHex: string): Promise<{ pubkey: string }> {
    const { derivePublicKey } = await import('opendating-protocol');
    const pubkey = derivePublicKey(privkeyHex);
    await SecureStore.setItemAsync(SECURE_STORE_PRIVKEY_KEY, privkeyHex);
    await SecureStore.setItemAsync(SECURE_STORE_PUBKEY_KEY, pubkey);
    this.userPubkey = pubkey;
    this.userPrivkey = privkeyHex;
    return { pubkey };
  }

  async loadIdentity(): Promise<{ pubkey: string; privkey: string } | null> {
    const pubkey = await SecureStore.getItemAsync(SECURE_STORE_PUBKEY_KEY);
    const privkey = await SecureStore.getItemAsync(SECURE_STORE_PRIVKEY_KEY);
    if (!pubkey || !privkey) return null;
    this.userPubkey = pubkey;
    this.userPrivkey = privkey;
    return { pubkey, privkey };
  }

  async deleteIdentity(): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_STORE_PRIVKEY_KEY);
    await SecureStore.deleteItemAsync(SECURE_STORE_PUBKEY_KEY);
    this.userPubkey = '';
    this.userPrivkey = '';
  }

  // ---- Connection ----

  async connect(): Promise<void> {
    if (!this.userPubkey || !this.userPrivkey) {
      throw new Error('No identity loaded. Call loadIdentity() or createIdentity() first.');
    }

    this.setState('connecting');

    try {
      // Initialize NDK
      this.ndk = new NDK({
        explicitRelayUrls: [RELAY_URL],
        autoConnectUserRelays: false,
        autoFetchUserMutelist: false,
        clientName: 'OpenDating Mobile',
        clientNip89: undefined,
      });

      // Connect
      await this.ndk.connect();
      this.setState('authenticating');

      // Wait for relay connection
      await this.waitForRelay();

      // NIP-42 is handled by NDK, but we verify connectivity
      this.setState('connected');

      // Fetch capabilities
      await this.fetchCapabilities();

      // Start response subscription
      await this.startResponseSubscription();
    } catch (err) {
      this.setState('offline');
      throw err;
    }
  }

  private async waitForRelay(): Promise<void> {
    // NDK Mobile handles relay connection and NIP-42 AUTH internally.
    // We wait a moment for connection to stabilize.
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const relay = this.ndk?.pool?.getRelay(RELAY_URL);
    if (!relay || relay.status !== 1) { // 1 = CONNECTED
      // Try pinging the relay to verify
      await this.ping();
    }
  }

  async disconnect(): Promise<void> {
    this.responseSub?.stop();
    this.matchSub?.stop();
    this.messageSub?.stop();

    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Disconnected'));
    }
    this.pendingRequests.clear();

    // NDK manages relay connections via its pool; no explicit disconnect() method.
    // Just drop the reference and let GC handle cleanup.
    this.ndk = null;
    this.setState('offline');
  }

  // ---- Capabilities / Service Discovery ----

  async fetchCapabilities(): Promise<OpenDatingCapabilities> {
    this.setState('fetching_capabilities');

    try {
      const response = await fetch(INFO_URL, {
        headers: { Accept: 'application/nostr+json' },
      });

      if (!response.ok) {
        throw new Error(`NIP-11 fetch failed: ${response.status}`);
      }

      const nip11 = await response.json();
      const odInfo = nip11?.opendating;

      if (!odInfo) {
        throw new Error('Relay does not advertise OpenDating support');
      }

      // Validate protocol version
      const versions: string[] = odInfo.protocol_versions ?? [];
      if (!versions.includes(PROTOCOL_VERSION)) {
        this.setState('protocol_incompatible');
        throw new Error(
          `Protocol version ${PROTOCOL_VERSION} not supported. Relay supports: ${versions.join(', ')}`
        );
      }

      this.services = odInfo.roles as OpenDatingServices;
      this.capabilities = {
        protocol_versions: versions,
        roles: this.services,
        features: odInfo.features ?? {},
      };

      // Cache services
      try {
        await SecureStore.setItemAsync(
          SERVICES_CACHE_KEY,
          JSON.stringify(this.capabilities)
        );
      } catch {
        // Non-critical
      }

      return this.capabilities;
    } catch (err) {
      // Try cached services
      try {
        const cached = await SecureStore.getItemAsync(SERVICES_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as OpenDatingCapabilities;
          this.capabilities = parsed;
          this.services = parsed.roles;
          return parsed;
        }
      } catch {
        // No cache available
      }
      throw err;
    }
  }

  getCapabilities(): OpenDatingCapabilities | null {
    return this.capabilities;
  }

  getServices(): OpenDatingServices | null {
    return this.services;
  }

  getRelayUrl(): string {
    return RELAY_URL;
  }

  getInfoUrl(): string {
    return INFO_URL;
  }

  getProtocolVersion(): string {
    return PROTOCOL_VERSION;
  }

  // ---- System ----

  async ping(): Promise<{ server_time: number; protocol_version: string }> {
    const result = await this.sendRequest('system', 'system.ping', {});
    return result.payload as { server_time: number; protocol_version: string };
  }

  // ---- Core Request / Response ----

  private async sendRequest(
    service: keyof OpenDatingServices,
    type: string,
    payload: Record<string, unknown>
  ): Promise<OpenDatingEnvelope> {
    if (!this.services) {
      throw new Error('Services not discovered. Call fetchCapabilities() first.');
    }
    if (!this.ndk) {
      throw new Error('Not connected. Call connect() first.');
    }

    const servicePubkey = this.services[service]?.pubkey;
    if (!servicePubkey) {
      throw new Error(`Service pubkey not found for: ${service}`);
    }

    const requestId = crypto.randomUUID();
    const envelope = createEnvelope(type, requestId, payload);

    const { giftWrap } = await buildGiftWrap(
      78, // kind 78 = OpenDating rumor
      JSON.stringify(envelope),
      this.userPrivkey,
      this.userPubkey,
      servicePubkey
    );

    // Create promise for response
    const responsePromise = new Promise<OpenDatingEnvelope>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timed out: ${type}`));
      }, REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(requestId, { resolve, reject, timer });
    });

    // Publish gift wrap through NDK
    const ndkEvent = new NDKEvent(this.ndk, giftWrap);
    await ndkEvent.publish();

    return responsePromise;
  }

  private async startResponseSubscription(): Promise<void> {
    if (!this.ndk || !this.userPubkey) return;

    // Subscribe to kind 1059 gift wraps addressed to us
    const filter: NDKFilter = {
      kinds: [1059],
      '#p': [this.userPubkey],
      since: Math.floor(Date.now() / 1000),
    };

    this.responseSub = this.ndk.subscribe(filter, {
      closeOnEose: false,
    });

    this.responseSub.on('event', async (event: NDKEvent) => {
      try {
        await this.handleIncomingGiftWrap(event);
      } catch {
        // Silently skip undecryptable events
      }
    });
  }

  private async handleIncomingGiftWrap(event: NDKEvent): Promise<void> {
    // Try to unwrap as a gift wrap addressed to us
    // The gift wrap contains: outer (kind 1059) → seal (kind 13) → rumor (kind 78)
    // We need to decrypt the outer to get the seal, then the rumor
    try {
      const decrypted = await this.decryptGiftWrap(event);
      if (!decrypted) return;

      const envelope = JSON.parse(decrypted) as OpenDatingEnvelope;

      // Check if this is a response to a pending request
      const pending = this.pendingRequests.get(envelope.request_id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(envelope.request_id);

        if (envelope.type === 'service.error') {
          const errPayload = envelope.payload as { code?: string; message?: string };
          const mapped = mapServiceError(errPayload.code ?? 'unknown');
          pending.reject(new Error(mapped.userMessage));
        } else {
          pending.resolve(envelope);
        }
        return;
      }

      // Check if this is a server-pushed event
      if (envelope.type === 'match.created') {
        this.handleMatchCreatedPush(envelope);
      }
    } catch {
      // Not decryptable by us, or not a valid envelope
    }
  }

  private async decryptGiftWrap(event: NDKEvent): Promise<string | null> {
    // NIP-59 gift wrap: use nip44Decrypt with conversation key
    // The gift wrap is encrypted to us (the recipient)
    try {
      // For incoming gift wraps, the sender is the service and we're the recipient
      // We need to try decrypting with each service key
      if (!this.services) return null;

      const allServiceKeys = Object.values(this.services).map((s) => s.pubkey);
      // Also try with our own pubkey for user-to-user messages
      allServiceKeys.push(this.userPubkey);

      for (const senderPubkey of allServiceKeys) {
        try {
          const decrypted = nip44Decrypt(event.content, this.userPrivkey, senderPubkey);
          if (decrypted && decrypted.length > 0) {
            return decrypted;
          }
        } catch {
          continue;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // ---- Match push handling ----

  private handleMatchCreatedPush(envelope: OpenDatingEnvelope) {
    const payload = envelope.payload as unknown as Match;
    if (payload?.pubkey) {
      for (const listener of this.matchListeners) {
        listener(payload);
      }
    }
  }

  onMatch(listener: (match: Match) => void): () => void {
    this.matchListeners.add(listener);
    return () => this.matchListeners.delete(listener);
  }

  // ---- Profile Operations ----

  async createProfile(): Promise<OpenDatingProfile> {
    const result = await this.sendRequest('profile', 'profile.create', {});
    return result.payload as unknown as OpenDatingProfile;
  }

  async getProfile(): Promise<OpenDatingProfile> {
    const result = await this.sendRequest('profile', 'profile.get', {});
    return result.payload as unknown as OpenDatingProfile;
  }

  async updateProfile(profileEventId?: string): Promise<void> {
    await this.sendRequest('profile', 'profile.update', {
      profile_event_id: profileEventId,
    });
  }

  async pauseProfile(): Promise<void> {
    await this.sendRequest('profile', 'profile.pause', {});
  }

  async resumeProfile(): Promise<void> {
    await this.sendRequest('profile', 'profile.resume', {});
  }

  async deleteProfile(): Promise<void> {
    await this.sendRequest('profile', 'profile.delete', {});
  }

  async updateVisibility(visibility: string): Promise<void> {
    await this.sendRequest('profile', 'visibility.update', { visibility });
  }

  // ---- Discovery Operations ----

  async updateLocation(
    geohashPrefix: string,
    countryCode?: string
  ): Promise<void> {
    await this.sendRequest('discovery', 'discovery.update_location', {
      geohash_prefix: geohashPrefix,
      country_code: countryCode,
    });
  }

  async updateDiscoveryPreferences(
    preferences: DiscoveryPreferences
  ): Promise<void> {
    await this.sendRequest('discovery', 'discovery.update_preferences', {
      max_distance_km: preferences.max_distance_km,
      min_age: preferences.min_age,
      max_age: preferences.max_age,
      intent: preferences.intent,
      genders: preferences.genders,
    });
  }

  async getCandidates(query: CandidateQuery): Promise<CandidatePage> {
    const result = await this.sendRequest('discovery', 'discovery.get_candidates', {
      radius_miles: query.radius_miles,
      age_min: query.age_min,
      age_max: query.age_max,
      genders: query.genders,
      relationship_intents: query.relationship_intents,
      limit: query.limit ?? 20,
      cursor: query.cursor,
    });
    return result.payload as unknown as CandidatePage;
  }

  // ---- Matching Operations ----

  async like(targetPubkey: string, candidateGrant: string): Promise<LikeResult> {
    const result = await this.sendRequest('matcher', 'intent.like', {
      target_pubkey: targetPubkey,
      candidate_grant: candidateGrant,
    });
    return result.payload as unknown as LikeResult;
  }

  async revokeLike(targetPubkey: string): Promise<void> {
    await this.sendRequest('matcher', 'intent.revoke', {
      target_pubkey: targetPubkey,
    });
  }

  async getMatches(): Promise<Match[]> {
    const result = await this.sendRequest('matcher', 'match.list', {});
    const payload = result.payload as { matches?: Match[] };
    return payload.matches ?? [];
  }

  // ---- Safety Operations ----

  async createBlock(targetPubkey: string): Promise<void> {
    await this.sendRequest('dm_policy', 'block.create', {
      target_pubkey: targetPubkey,
    });
  }

  async removeBlock(targetPubkey: string): Promise<void> {
    await this.sendRequest('dm_policy', 'block.remove', {
      target_pubkey: targetPubkey,
    });
  }

  async getBlocks(): Promise<Block[]> {
    const result = await this.sendRequest('dm_policy', 'block.list', {});
    const payload = result.payload as { blocks?: Block[] };
    return payload.blocks ?? [];
  }

  async unmatch(targetPubkey: string): Promise<void> {
    await this.sendRequest('matcher', 'unmatch.create', {
      target_pubkey: targetPubkey,
    });
  }

  async report(report: ReportInput): Promise<void> {
    await this.sendRequest('moderation', 'report.create', {
      subject_pubkey: report.subject_pubkey,
      report_type: report.report_type,
      description_encrypted: report.description_encrypted,
      evidence_event_ids: report.evidence_event_ids,
    });
  }

  // ---- Verification ----

  async getVerificationClaims(): Promise<VerificationClaim[]> {
    const result = await this.sendRequest('profile', 'verification.list', {});
    const payload = result.payload as { claims?: VerificationClaim[] };
    return payload.claims ?? [];
  }

  // ---- Account ----

  async deleteAccount(): Promise<void> {
    await this.sendRequest('profile', 'account.delete', {});
  }

  // ---- Messaging (NIP-17) ----

  async sendMessage(recipientPubkey: string, text: string): Promise<void> {
    // NIP-17: kind 14 rumor → NIP-59 gift wrap → kind 1059 outer
    const rumorContent = JSON.stringify({
      text,
      created_at: Math.floor(Date.now() / 1000),
    });

    const { giftWrap } = await buildGiftWrap(
      14, // kind 14 = NIP-17 DM rumor
      rumorContent,
      this.userPrivkey,
      this.userPubkey,
      recipientPubkey
    );

    if (!this.ndk) throw new Error('Not connected');
    const ndkEvent = new NDKEvent(this.ndk, giftWrap);
    await ndkEvent.publish();
  }

  subscribeToMessages(callback: (msg: ODMessage) => void): () => void {
    this.messageListeners.add(callback);

    if (!this.messageSub && this.ndk && this.userPubkey) {
      const filter: NDKFilter = {
        kinds: [1059],
        '#p': [this.userPubkey],
        since: Math.floor(Date.now() / 1000),
      };

      this.messageSub = this.ndk.subscribe(filter, { closeOnEose: false });

      this.messageSub.on('event', async (event: NDKEvent) => {
        try {
          const decrypted = await this.decryptGiftWrap(event);
          if (!decrypted) return;

          // Try to parse as a DM or service message
          try {
            const envelope = JSON.parse(decrypted) as OpenDatingEnvelope;
            // Service messages handled by response subscription
            if (envelope.type) return;
          } catch {
            // Not JSON envelope, might be raw DM
          }

          // Parse as NIP-17 message
          try {
            const parsed = JSON.parse(decrypted);
            if (parsed.text) {
              const msg: ODMessage = {
                id: event.id,
                sender_pubkey: event.pubkey,
                recipient_pubkey: this.userPubkey,
                text: parsed.text,
                created_at: parsed.created_at ?? Math.floor(Date.now() / 1000),
              };
              for (const listener of this.messageListeners) {
                listener(msg);
              }
            }
          } catch {
            // Not a DM we can parse
          }
        } catch {
          // Can't decrypt
        }
      });
    }

    return () => {
      this.messageListeners.delete(callback);
    };
  }

  subscribeToMatches(callback: (match: Match) => void): () => void {
    return this.onMatch(callback);
  }
}

// ---- Singleton ----

let clientInstance: OpenDatingClientImpl | null = null;

export function getOpenDatingClient(): OpenDatingClientImpl {
  if (!clientInstance) {
    clientInstance = new OpenDatingClientImpl();
  }
  return clientInstance;
}

export function resetOpenDatingClient(): void {
  if (clientInstance) {
    clientInstance.disconnect();
    clientInstance = null;
  }
}

export { OpenDatingClientImpl };
export type { OpenDatingClientConfig, PendingRequest };
