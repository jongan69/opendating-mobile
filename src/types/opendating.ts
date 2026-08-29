// OpenDating domain types
// Mirror the opendating-protocol@0.1.0 schemas

// ---- Profile ----

export interface OpenDatingProfile {
  member_id: string;
  pubkey: string;
  status: 'active' | 'paused' | 'deleted';
  /** Content as stored by the service — present on profile.get. */
  profile?: ProfileContent | null;
  visibility?: string;
  completeness?: number;
  created_at: number;
  updated_at: number;
}

/**
 * The profile content other people actually see.
 *
 * The service-side `OpenDatingProfile` above is only a record — status,
 * timestamps, and a pointer to the event carrying this. This is the payload
 * of that event, and it mirrors `CandidateProfile` so a published profile
 * and a received candidate describe the same shape.
 */
export interface ProfileContent {
  display_name: string;
  age?: number;
  gender?: string;
  bio?: string;
  interests?: string[];
  relationship_intent?: string;
  prompts?: ProfilePrompt[];
  photos?: CandidatePhoto[];
  /** Schema version, so older clients can skip content they cannot render. */
  v: string;
}

// ---- Discovery ----

export interface DiscoveryPreferences {
  max_distance_km?: number;
  min_age?: number;
  max_age?: number;
  intent?: string;
  genders?: string[];
}

export interface CandidateQuery {
  radius_miles?: number;
  age_min?: number;
  age_max?: number;
  genders?: string[];
  relationship_intents?: string[];
  limit?: number;
  cursor?: string;
}

export interface DistanceBucket {
  bucket: string; // "nearby", "within 5 mi", "5-10 mi", etc.
}

export interface CandidateProfile {
  display_name?: string;
  age?: number;
  gender?: string;
  bio?: string;
  photos?: CandidatePhoto[];
  interests?: string[];
  relationship_intent?: string;
  verification_claims?: VerificationClaim[];
  prompts?: ProfilePrompt[];
}

export interface CandidatePhoto {
  id: string;
  url: string;
  order: number;
}

export interface ProfilePrompt {
  question: string;
  answer: string;
}

export interface Candidate {
  pubkey: string;
  profile: CandidateProfile;
  distance_bucket: string;
  candidate_grant: string;
}

export interface CandidatePage {
  candidates: Candidate[];
  cursor?: string;
  remaining_today: number;
}

// ---- Matching ----

export interface LikeResult {
  match_created: boolean;
  match_id?: string;
}

export interface Match {
  match_id: string;
  pubkey: string;
  profile?: CandidateProfile;
  distance_bucket?: string;
  created_at: number;
}

// ---- Safety ----

export interface Block {
  target_pubkey: string;
  created_at: number;
}

export type ReportType =
  | 'harassment'
  | 'scam'
  | 'catfish'
  | 'underage'
  | 'inappropriate_content'
  | 'other';

export interface ReportInput {
  subject_pubkey: string;
  report_type: ReportType;
  description_encrypted?: string;
  evidence_event_ids?: string[];
}

// ---- Verification ----

export interface VerificationClaim {
  claim_type: string;
  issuer?: string;
  verified_at?: number;
  evidence?: string;
}

// ---- Messaging ----

export interface ODMessage {
  id: string;
  sender_pubkey: string;
  recipient_pubkey: string;
  /**
   * The other party in this conversation, whichever direction the message
   * went. Routing on the sender alone loses our own sent messages, which
   * come back to us as self-addressed copies.
   */
  conversation_pubkey: string;
  text: string;
  created_at: number;
  /** True when we authored this message. */
  outgoing: boolean;
  /** Shown optimistically, not yet confirmed by the relay. */
  pending?: boolean;
}

// ---- Services (from NIP-11) ----

export type OpenDatingServiceRole =
  | 'system'
  | 'profile'
  | 'discovery'
  | 'matcher'
  | 'dm_policy'
  | 'moderation'
  | 'verification'
  | 'media'
  | 'deletion';

/**
 * Service pubkeys advertised by the relay.
 *
 * Partial by design: a relay advertises only the services it actually runs,
 * and the roster grows as the deployment matures. Callers must check for a
 * role before using it rather than assuming the full set is present.
 */
export type OpenDatingServices = Partial<
  Record<OpenDatingServiceRole, { pubkey: string }>
>;

export interface OpenDatingFeatures {
  match_only_dms: boolean;
  private_profiles: boolean;
  coarse_location: boolean;
  private_reports: boolean;
  vanish: boolean;
}

export interface OpenDatingCapabilities {
  protocol_versions: string[];
  roles: OpenDatingServices;
  features: Partial<OpenDatingFeatures>;
  server_time?: number;
  protocol_version?: string;
}

// ---- Envelope ----

export interface OpenDatingEnvelope {
  version: string;
  type: string;
  request_id: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface OpenDatingResponse {
  type: string;
  request_id: string;
  payload: Record<string, unknown>;
}

// ---- Error ----

export interface OpenDatingServiceError {
  type: 'service.error';
  payload: {
    code: string;
    message: string;
  };
}

// ---- Connection states ----

export type ConnectionState =
  | 'starting'
  | 'connecting'
  | 'authenticating'
  | 'fetching_capabilities'
  | 'connected'
  | 'reconnecting'
  | 'offline'
  | 'relay_unavailable'
  | 'protocol_incompatible'
  | 'account_unavailable';

// ---- App state ----

export type AppBootstrapState =
  | 'loading'
  | 'no_identity'
  | 'identity_locked'
  | 'connecting'
  | 'authenticating'
  | 'fetching_capabilities'
  | 'checking_profile'
  | 'no_profile'
  | 'ready'
  /**
   * Reached the relay, but it does not run the services the app needs. Not
   * an error — a staged rollout looks exactly like this — so it gets its own
   * state and its own screen rather than a generic failure.
   */
  | 'services_unavailable'
  | 'error';
