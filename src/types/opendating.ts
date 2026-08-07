// OpenDating domain types
// Mirror the opendating-protocol@0.1.0 schemas

// ---- Profile ----

export interface OpenDatingProfile {
  member_id: string;
  pubkey: string;
  status: 'active' | 'paused' | 'deleted';
  profile_event_id?: string;
  visibility?: string;
  created_at: number;
  updated_at: number;
}

// ---- Discovery ----

export interface DiscoveryPreferences {
  max_distance_km?: number;
  min_age?: number;
  max_age?: number;
  intent?: string;
  genders?: string[];
  relationship_intents?: string[];
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
  profile: CandidateProfile;
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
  text: string;
  created_at: number;
}

// ---- Services (from NIP-11) ----

export interface OpenDatingServices {
  system: { pubkey: string };
  profile: { pubkey: string };
  discovery: { pubkey: string };
  matcher: { pubkey: string };
  dm_policy: { pubkey: string };
  moderation: { pubkey: string };
}

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
  features: OpenDatingFeatures;
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
  | 'connecting'
  | 'authenticating'
  | 'fetching_capabilities'
  | 'checking_profile'
  | 'no_profile'
  | 'ready'
  | 'error';
