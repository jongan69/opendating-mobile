// OpenDating Client Facade
// Wraps NDK + opendating-protocol into a clean domain API.
// Screens never construct Nostr events, gift wraps, or envelopes directly.

// NDK core, not @nostr-dev-kit/ndk-mobile. The mobile wrapper adds React
// hooks, a session-storage adapter, a SQLite cache, and NIP-55 external-signer
// support — none of which this app uses, since keys live in SecureStore and
// every protocol operation is driven from this facade. What it did add was
// four duplicate module copies (its own expo-image and expo-secure-store, plus
// react and react-native nested under expo-nip55), and two React Native
// runtimes in one bundle break TurboModule registration at startup.
import NDK, {
  NDKEvent,
  NDKFilter,
  NDKPrivateKeySigner,
  NDKRelayAuthPolicies,
  NDKRelayStatus,
  NDKSubscription,
} from '@nostr-dev-kit/ndk';
import {
  createEnvelope,
  buildGiftWrap,
  checkRequestFreshness,
  generateKeypair,
  validateEnvelope,
  type OpenDatingEnvelope,
} from 'opendating-protocol';
import { randomUUID } from 'expo-crypto';
import {
  type OpenDatingCapabilities,
  type OpenDatingServices,
  type OpenDatingServiceRole,
  type CandidatePage,
  type CandidatePhoto,
  type CandidateQuery,
  type LikeResult,
  type Match,
  type Block,
  type ReportInput,
  type VerificationClaim,
  type DiscoveryPreferences,
  type OpenDatingProfile,
  type ProfileContent,
  type ConnectionState,
  type ODMessage,
} from '@/types/opendating';
import { mapServiceError, ServiceUnavailableError } from './errors';
import { parseCapabilities, serviceLabel } from './capabilities';
import { unwrapGiftWrap } from './gift-wrap';
import { uploadPendingPhotos } from './media';
import { identityVault, type IdentityState } from '@/lib/storage/identity-vault';
import { storage } from '@/lib/storage';
import {
  getRequestRoute,
  type ClientRequestType,
} from './request-routing';

// ---- Constants ----

const RELAY_URL =
  process.env.EXPO_PUBLIC_OPENDATING_RELAY_URL ??
  'wss://opendating-relay.jonathang132298.workers.dev';
const INFO_URL =
  process.env.EXPO_PUBLIC_OPENDATING_INFO_URL ??
  'https://opendating-relay.jonathang132298.workers.dev';
const PROTOCOL_VERSION =
  process.env.EXPO_PUBLIC_OPENDATING_PROTOCOL_VERSION ?? '0.1';

const CONNECT_TIMEOUT_MS = 15_000;
/** How long to wait for NIP-42 before proceeding without it. */
const AUTH_TIMEOUT_MS = 10_000;
const REQUEST_TIMEOUT_MS = 30_000;

/** Inner rumor kinds we route on. */
const KIND_OD_COMMAND = 78;
const KIND_DM = 14;
const KIND_GIFT_WRAP = 1059;

/**
 * NIP-59 randomises seal and wrap timestamps up to two days into the past to
 * defeat timing analysis. A relay `since` filter matches on that randomised
 * wrap timestamp, so the window has to be widened by the same amount or
 * freshly-sent messages are filtered out before they ever reach us.
 */
const GIFT_WRAP_BACKDATE_SEC = 2 * 24 * 60 * 60;
/** How far back to pull the encrypted inbox on connect. */
const INBOX_HISTORY_SEC = 14 * 24 * 60 * 60;

// ---- Types ----

interface PendingRequest {
  resolve: (value: OpenDatingEnvelope) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  expectedSenderPubkey: string;
  expectedResultType: string;
}

interface OpenDatingClientConfig {
  relayUrl?: string;
  infoUrl?: string;
}

interface IdentityPersistenceOptions {
  vaultPassphrase?: string;
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
  private inboxSub: NDKSubscription | null = null;
  private stateListeners = new Set<(state: ConnectionState) => void>();
  private matchListeners = new Set<(match: Match) => void>();
  private messageListeners = new Set<(msg: ODMessage) => void>();
  /** Rumor ids already delivered — relays re-send, and we must not double-fire. */
  private seenRumorIds = new Set<string>();
  /** DMs that arrive during bootstrap, before the conversation hook mounts. */
  private bufferedMessages: ODMessage[] = [];
  /** From the relay's NIP-11 `limitation.auth_required`. */
  private relayRequiresAuth = true;

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
    return (await identityVault.getState()) === 'ready';
  }

  async getIdentityState(): Promise<IdentityState> {
    return identityVault.getState();
  }

  async getPubkey(): Promise<string | null> {
    if (this.userPubkey) return this.userPubkey;
    try {
      return (await identityVault.load())?.pubkey ?? null;
    } catch {
      return null;
    }
  }

  async createIdentity(
    options: IdentityPersistenceOptions = {}
  ): Promise<{ pubkey: string }> {
    const kp = generateKeypair();
    await identityVault.save(
      { privkey: kp.privateKey, pubkey: kp.publicKey },
      options.vaultPassphrase
    );
    this.userPubkey = kp.publicKey;
    this.userPrivkey = kp.privateKey;
    return { pubkey: kp.publicKey };
  }

  async importIdentity(
    privkeyHex: string,
    options: IdentityPersistenceOptions = {}
  ): Promise<{ pubkey: string }> {
    const { derivePublicKey } = await import('opendating-protocol');
    const pubkey = derivePublicKey(privkeyHex);
    await identityVault.save(
      { privkey: privkeyHex, pubkey },
      options.vaultPassphrase
    );
    this.userPubkey = pubkey;
    this.userPrivkey = privkeyHex;
    return { pubkey };
  }

  async unlockIdentity(vaultPassphrase: string): Promise<{ pubkey: string }> {
    const identity = await identityVault.unlock(vaultPassphrase);
    this.userPubkey = identity.pubkey;
    this.userPrivkey = identity.privkey;
    return { pubkey: identity.pubkey };
  }

  async loadIdentity(): Promise<{ pubkey: string; privkey: string } | null> {
    const identity = await identityVault.load();
    if (!identity) return null;
    this.userPubkey = identity.pubkey;
    this.userPrivkey = identity.privkey;
    return identity;
  }

  async deleteIdentity(): Promise<void> {
    await identityVault.clear();
    this.userPubkey = '';
    this.userPrivkey = '';
    this.bufferedMessages = [];
  }

  async lockIdentity(): Promise<void> {
    await this.disconnect();
    await identityVault.lock();
    this.userPubkey = '';
    this.userPrivkey = '';
    this.bufferedMessages = [];
  }

  // ---- Connection ----

  async connect(): Promise<void> {
    if (!this.userPubkey || !this.userPrivkey) {
      throw new Error('No identity loaded. Call loadIdentity() or createIdentity() first.');
    }

    this.setState('connecting');

    try {
      // Talk to exactly one relay. The outbox model would discover and connect
      // to a user's own relay list, which for a dating app means leaking who
      // you are to servers outside the service boundary.
      //
      // The signer exists for NIP-42 only. Every event this client publishes is
      // already signed by hand — gift wraps are sealed with an ephemeral key,
      // and profile content is signed before it reaches NDK — but the relay
      // sets auth_required, and answering its challenge means signing a kind
      // 22242 event. Without a signer NDK cannot answer, the relay rejects
      // everything, and publish fails with "Not enough relays received the
      // event (0 publish, 1 required)".
      this.ndk = new NDK({
        explicitRelayUrls: [RELAY_URL],
        autoConnectUserRelays: false,
        enableOutboxModel: false,
        signer: new NDKPrivateKeySigner(this.userPrivkey),
        clientName: 'OpenDating Mobile',
        clientNip89: undefined,
      });

      // Sign the challenge rather than dropping the connection. Without an
      // explicit policy NDK leaves an authenticating relay unauthenticated.
      this.ndk.relayAuthDefaultPolicy = NDKRelayAuthPolicies.signIn({
        ndk: this.ndk,
      });

      // Connect with timeout — don't hang forever if the relay is unreachable
      await this.withTimeout(
        this.ndk!.connect(),
        CONNECT_TIMEOUT_MS,
        'Could not reach OpenDating. Please check your internet connection.'
      );

      this.setState('authenticating');

      // Wait for relay connection
      await this.waitForRelay();

      // NIP-42 is handled by NDK, but we verify connectivity
      this.setState('connected');

      // Fetch capabilities
      await this.withTimeout(
        this.fetchCapabilities(),
        REQUEST_TIMEOUT_MS,
        'Could not verify OpenDating services. Please try again.'
      );

      // Start the single inbound gift-wrap subscription
      this.startInboxSubscription();
    } catch (err) {
      this.setState('offline');
      throw err;
    }
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    message: string
  ): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    });
    try {
      return await Promise.race([promise, timeout]);
    } finally {
      // Without this the pending timer keeps the JS timer queue alive well
      // past a fast success, which shows up as a stalled splash on reconnect.
      if (timer) clearTimeout(timer);
    }
  }

  /**
   * Wait until the relay has actually completed NIP-42, not just opened a
   * socket.
   *
   * This used to sleep for a second and hope. That is not good enough on two
   * counts: a slow handshake means the first publish is rejected outright
   * ("Not enough relays received the event"), and a REQ sent before auth
   * completes is dropped *silently* — the subscription looks established, no
   * error is raised, and every service response afterwards arrives with
   * nobody listening. Polling a real status is the difference between a
   * working session and one that times out on every request.
   */
  private async waitForRelay(): Promise<void> {
    const deadline = Date.now() + AUTH_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const relay = this.ndk?.pool?.relays?.get(RELAY_URL);
      if (relay?.status === NDKRelayStatus.AUTHENTICATED) return;
      // The relay may not require auth at all; a plain connection is then the
      // terminal state and waiting for AUTHENTICATED would hang until timeout.
      if (relay?.status === NDKRelayStatus.CONNECTED && !this.relayRequiresAuth) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // Proceed anyway rather than failing the whole connect: some operations
    // (reading the NIP-11 document, cached capabilities) still work, and the
    // individual request that needs auth will surface its own error.
    console.warn('[OpenDating] Relay did not authenticate before timeout.');
  }

  async disconnect(): Promise<void> {
    this.inboxSub?.stop();
    // Drop the handle too: a later connect() must be able to re-subscribe,
    // which a stale non-null ref would silently skip.
    this.inboxSub = null;

    // Reject all pending requests
    for (const [, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Disconnected'));
    }
    this.pendingRequests.clear();
    this.seenRumorIds.clear();
    this.bufferedMessages = [];

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

      const doc = await response.json();
      // Drives how long connect() waits for NIP-42: a relay that does not
      // demand auth reaches its terminal state at CONNECTED, and waiting for
      // AUTHENTICATED would stall until timeout on every launch.
      this.relayRequiresAuth =
        (doc as { limitation?: { auth_required?: boolean } })?.limitation
          ?.auth_required !== false;

      const parsed = parseCapabilities(doc);

      if (!parsed) {
        throw new Error('Relay does not advertise OpenDating support');
      }

      // Validate protocol version
      if (!parsed.protocol_versions.includes(PROTOCOL_VERSION)) {
        this.setState('protocol_incompatible');
        throw new Error(
          `Protocol version ${PROTOCOL_VERSION} not supported. Relay supports: ${parsed.protocol_versions.join(', ')}`
        );
      }

      this.services = parsed.roles;
      this.capabilities = parsed;

      // Cache services
      try {
        await storage.saveServicesCache(this.capabilities);
      } catch {
        // Non-critical
      }

      return this.capabilities;
    } catch (err) {
      // Try cached services
      try {
        const parsed = await storage.getServicesCache<OpenDatingCapabilities>();
        if (parsed) {
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

  /** True when the relay advertises the service backing a given feature. */
  hasService(role: OpenDatingServiceRole): boolean {
    return !!this.services?.[role]?.pubkey;
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
    const result = await this.sendRequest('system.ping', {});
    return result.payload as { server_time: number; protocol_version: string };
  }

  // ---- Core Request / Response ----

  private async sendRequest(
    type: ClientRequestType,
    payload: Record<string, unknown>
  ): Promise<OpenDatingEnvelope> {
    if (!this.services) {
      throw new Error('Services not discovered. Call fetchCapabilities() first.');
    }
    if (!this.ndk) {
      throw new Error('Not connected. Call connect() first.');
    }

    const route = getRequestRoute(type);
    const servicePubkey = this.services[route.role]?.pubkey;
    if (!servicePubkey) {
      // The relay simply doesn't run this service. Callers turn this into a
      // "not available yet" state rather than a generic error.
      throw new ServiceUnavailableError(route.role, serviceLabel(route.role));
    }

    const requestId = randomUUID();
    const envelope = createEnvelope(type, requestId, payload);

    const { giftWrap } = await buildGiftWrap(
      KIND_OD_COMMAND,
      JSON.stringify(envelope),
      this.userPrivkey,
      this.userPubkey,
      servicePubkey
    );

    // Register the pending request BEFORE publishing: a fast service can
    // answer before publish() resolves, and the response would otherwise
    // arrive with nothing waiting for it.
    const responsePromise = new Promise<OpenDatingEnvelope>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timed out: ${type}`));
      }, REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timer,
        expectedSenderPubkey: servicePubkey,
        expectedResultType: route.resultType,
      });
    });

    try {
      const ndkEvent = new NDKEvent(this.ndk, giftWrap);
      await ndkEvent.publish();
    } catch (err) {
      const pending = this.pendingRequests.get(requestId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(requestId);
      }
      throw err;
    }

    return responsePromise;
  }

  // ---- Inbound gift wraps ----

  /**
   * One subscription carries everything addressed to us: service responses,
   * server pushes, and direct messages. They are indistinguishable on the
   * wire (all kind 1059), so they are routed after unwrapping by rumor kind.
   */
  private startInboxSubscription(): void {
    if (this.inboxSub || !this.ndk || !this.userPubkey) return;

    const filter: NDKFilter = {
      kinds: [KIND_GIFT_WRAP],
      '#p': [this.userPubkey],
      since:
        Math.floor(Date.now() / 1000) - INBOX_HISTORY_SEC - GIFT_WRAP_BACKDATE_SEC,
    };

    this.inboxSub = this.ndk.subscribe(filter, { closeOnEose: false });
    this.inboxSub.on('event', (event: NDKEvent) => {
      this.handleIncomingGiftWrap(event);
    });
  }

  private handleIncomingGiftWrap(event: NDKEvent): void {
    const unwrapped = unwrapGiftWrap(
      { pubkey: event.pubkey, content: event.content },
      this.userPrivkey
    );
    // Not addressed to us, or not a well-formed seal/rumor pair. Relays fan
    // out gift wraps broadly, so this is the common case, not an error.
    if (!unwrapped) return;

    // Relays re-deliver; the rumor id is deterministic, so it dedupes across
    // reconnects as well as within a session.
    if (unwrapped.rumorId && this.seenRumorIds.has(unwrapped.rumorId)) return;

    let accepted = false;

    if (unwrapped.kind === KIND_OD_COMMAND) {
      accepted = this.handleCommandEnvelope(
        unwrapped.content,
        unwrapped.senderPubkey
      );
    }

    if (unwrapped.kind === KIND_DM) {
      accepted = this.handleDirectMessage(unwrapped);
    }

    if (accepted && unwrapped.rumorId) {
      this.rememberRumorId(unwrapped.rumorId);
    }
  }

  private rememberRumorId(rumorId: string): void {
    this.seenRumorIds.add(rumorId);
    // A relay replay must not create an unbounded process-lifetime set.
    if (this.seenRumorIds.size > 4_096) {
      const oldest = this.seenRumorIds.values().next().value;
      if (oldest) this.seenRumorIds.delete(oldest);
    }
  }

  private handleCommandEnvelope(content: string, senderPubkey: string): boolean {
    let envelope: OpenDatingEnvelope;
    try {
      envelope = JSON.parse(content) as OpenDatingEnvelope;
    } catch {
      return false;
    }
    if (!validateEnvelope(envelope).valid) return false;
    if (checkRequestFreshness(envelope.created_at) !== null) return false;

    const pending = this.pendingRequests.get(envelope.request_id);
    if (pending) {
      if (senderPubkey !== pending.expectedSenderPubkey) return false;

      const isError =
        envelope.type === 'system.error' || envelope.type === 'service.error';
      if (!isError && envelope.type !== pending.expectedResultType) return false;

      clearTimeout(pending.timer);
      this.pendingRequests.delete(envelope.request_id);

      // The protocol emits `system.error`; older builds emitted
      // `service.error`. Accept both so an error is never mistaken for a
      // successful result.
      if (isError) {
        const errPayload = envelope.payload as { code?: string; message?: string };
        const mapped = mapServiceError(errPayload?.code ?? 'unknown');
        pending.reject(new Error(mapped.userMessage));
      } else {
        pending.resolve(envelope);
      }
      return true;
    }

    // Server push (no request waiting on it).
    if (envelope.type === 'match.created') {
      if (senderPubkey !== this.services?.matcher?.pubkey) return false;
      this.handleMatchCreatedPush(envelope);
      return true;
    }
    return false;
  }

  private handleDirectMessage(unwrapped: {
    senderPubkey: string;
    content: string;
    createdAt: number;
    rumorId: string;
  }): boolean {
    let text: string | undefined;
    let to: string | undefined;
    try {
      const parsed = JSON.parse(unwrapped.content) as {
        text?: unknown;
        to?: unknown;
      };
      if (typeof parsed?.text === 'string') text = parsed.text;
      if (typeof parsed?.to === 'string') to = parsed.to;
    } catch {
      // Tolerate a rumor carrying bare text rather than a JSON body.
      text = unwrapped.content;
    }
    if (!text) return false;

    // Our own sent messages come back as self-addressed copies, so the peer
    // is the `to` field for those and the sender for everything else.
    const outgoing = unwrapped.senderPubkey === this.userPubkey;
    const conversationPubkey = outgoing ? to : unwrapped.senderPubkey;
    if (!conversationPubkey) return false; // Unroutable — drop rather than misfile.

    const msg: ODMessage = {
      // The rumor id is stable across re-delivery; the wrap id is not, since
      // the same message is re-wrapped under a fresh ephemeral key each time.
      id: unwrapped.rumorId,
      sender_pubkey: unwrapped.senderPubkey,
      recipient_pubkey: outgoing ? conversationPubkey : this.userPubkey,
      conversation_pubkey: conversationPubkey,
      text,
      created_at: unwrapped.createdAt,
      outgoing,
    };

    if (this.messageListeners.size === 0) {
      this.bufferedMessages.push(msg);
      if (this.bufferedMessages.length > 100) this.bufferedMessages.shift();
    } else {
      for (const listener of this.messageListeners) {
        listener(msg);
      }
    }
    return true;
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
    const result = await this.sendRequest('profile.create', {});
    return result.payload as unknown as OpenDatingProfile;
  }

  async getProfile(): Promise<OpenDatingProfile> {
    const result = await this.sendRequest('profile.get', {});
    return result.payload as unknown as OpenDatingProfile;
  }

  /**
   * Publish the user's profile content.
   *
   * Content travels inside the gift-wrapped `profile.update` payload and the
   * service stores it encrypted at rest, rather than being published as a
   * separate Nostr event. Discovery has to read it to build the card other
   * members see, and keeping it out of the relay's public event store means a
   * profile is never queryable by anyone the service has not granted access.
   */
  async updateProfile(content: ProfileContent): Promise<void> {
    await this.sendRequest('profile.update', { profile: content });
  }

  /**
   * Upload local photos to the relay's Blossom media endpoint and return the
   * list with hosted URLs. Device `file://` URIs are meaningless to anyone
   * else, so this has to happen before a profile is published.
   */
  async uploadPhotos(photos: CandidatePhoto[]): Promise<CandidatePhoto[]> {
    if (!this.userPrivkey || !this.userPubkey) {
      throw new Error('No identity loaded.');
    }
    return uploadPendingPhotos(photos, INFO_URL, this.userPrivkey, this.userPubkey);
  }

  async pauseProfile(): Promise<void> {
    await this.sendRequest('profile.pause', {});
  }

  async resumeProfile(): Promise<void> {
    await this.sendRequest('profile.resume', {});
  }

  async deleteProfile(): Promise<void> {
    await this.sendRequest('profile.delete', {});
  }

  async updateVisibility(visibility: string): Promise<void> {
    await this.sendRequest('visibility.update', { visibility });
  }

  // ---- Discovery Operations ----

  async updateLocation(
    geohashPrefix: string,
    countryCode?: string
  ): Promise<void> {
    await this.sendRequest('discovery.update_location', {
      geohash_prefix: geohashPrefix,
      country_code: countryCode,
    });
  }

  async updateDiscoveryPreferences(
    preferences: DiscoveryPreferences
  ): Promise<void> {
    await this.sendRequest('discovery.update_preferences', {
      max_distance_km: preferences.max_distance_km,
      min_age: preferences.min_age,
      max_age: preferences.max_age,
      intent: preferences.intent,
      genders: preferences.genders,
    });
  }

  async getCandidates(query: CandidateQuery): Promise<CandidatePage> {
    const result = await this.sendRequest('discovery.get_candidates', {
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
    const result = await this.sendRequest('intent.like', {
      target_pubkey: targetPubkey,
      candidate_grant: candidateGrant,
    });
    return result.payload as unknown as LikeResult;
  }

  async revokeLike(targetPubkey: string): Promise<void> {
    await this.sendRequest('intent.revoke', {
      target_pubkey: targetPubkey,
    });
  }

  async getMatches(): Promise<Match[]> {
    const result = await this.sendRequest('match.list', {});
    const payload = result.payload as { matches?: Match[] };
    return payload.matches ?? [];
  }

  // ---- Safety Operations ----

  async createBlock(targetPubkey: string): Promise<void> {
    await this.sendRequest('block.create', {
      target_pubkey: targetPubkey,
    });
  }

  async removeBlock(targetPubkey: string): Promise<void> {
    await this.sendRequest('block.remove', {
      target_pubkey: targetPubkey,
    });
  }

  async getBlocks(): Promise<Block[]> {
    const result = await this.sendRequest('block.list', {});
    const payload = result.payload as { blocks?: Block[] };
    return payload.blocks ?? [];
  }

  async unmatch(targetPubkey: string): Promise<void> {
    await this.sendRequest('unmatch.create', {
      target_pubkey: targetPubkey,
    });
  }

  async report(report: ReportInput): Promise<void> {
    await this.sendRequest('report.create', {
      subject_pubkey: report.subject_pubkey,
      report_type: report.report_type,
      description_encrypted: report.description_encrypted,
      evidence_event_ids: report.evidence_event_ids,
    });
  }

  // ---- Verification ----

  async getVerificationClaims(): Promise<VerificationClaim[]> {
    const result = await this.sendRequest('verification.list', {});
    const payload = result.payload as { claims?: VerificationClaim[] };
    return payload.claims ?? [];
  }

  // ---- Account ----

  async deleteAccount(): Promise<void> {
    await this.sendRequest('account.delete', {});
  }

  // ---- Messaging (NIP-17) ----

  async sendMessage(recipientPubkey: string, text: string): Promise<void> {
    const ndk = this.ndk;
    if (!ndk) throw new Error('Not connected');

    // NIP-17: kind 14 rumor → NIP-59 gift wrap → kind 1059 outer.
    // `to` names the peer so a self-addressed copy can be filed against the
    // right conversation; the rumor's own tags are empty by NIP-59 rule.
    const rumorContent = JSON.stringify({
      text,
      to: recipientPubkey,
      created_at: Math.floor(Date.now() / 1000),
    });

    const wrapFor = async (audience: string) => {
      const { giftWrap } = await buildGiftWrap(
        KIND_DM,
        rumorContent,
        this.userPrivkey,
        this.userPubkey,
        audience
      );
      return new NDKEvent(ndk, giftWrap).publish();
    };

    // The recipient's copy is encrypted to them alone, so without a second
    // copy addressed to ourselves our own sent messages would be gone the
    // next time the app starts. NIP-17 specifies both.
    await wrapFor(recipientPubkey);
    try {
      await wrapFor(this.userPubkey);
    } catch {
      // The message did reach the recipient; losing only our archive copy
      // must not surface as a send failure.
    }
  }

  subscribeToMessages(callback: (msg: ODMessage) => void): () => void {
    this.messageListeners.add(callback);
    const buffered = this.bufferedMessages;
    this.bufferedMessages = [];
    for (const message of buffered) callback(message);
    // The inbox subscription is opened on connect and shared by every
    // listener, so attaching here never opens a second relay subscription.
    this.startInboxSubscription();
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

export async function resetOpenDatingClient(): Promise<void> {
  if (clientInstance) {
    const instance = clientInstance;
    clientInstance = null;
    // Awaited so a retry cannot race a half-torn-down subscription.
    await instance.disconnect();
  }
}

export { OpenDatingClientImpl };
export type { OpenDatingClientConfig, PendingRequest };
