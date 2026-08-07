// NIP-11 capability parsing.
//
// The relay advertises which OpenDating services it runs inside the
// `opendating` block of its NIP-11 document. Two key spellings are in the
// wild and both must be accepted:
//
//   deployed:   { versions: [...],          services: { … } }
//   documented: { protocol_versions: [...], roles:    { … } }
//
// Reading only one spelling makes startup fail closed — an empty version
// list reads as "protocol incompatible" and the app never leaves the splash
// screen. Everything here is defensive: a relay is remote input, so a
// malformed or partial document degrades the feature set instead of
// throwing.

import type {
  OpenDatingCapabilities,
  OpenDatingFeatures,
  OpenDatingServiceRole,
  OpenDatingServices,
} from '@/types/opendating';

const KNOWN_ROLES: OpenDatingServiceRole[] = [
  'system',
  'profile',
  'discovery',
  'matcher',
  'dm_policy',
  'moderation',
  'verification',
  'media',
];

/** Nostr pubkeys are 32-byte hex. Anything else is not usable as a peer. */
const HEX_64 = /^[0-9a-f]{64}$/i;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function parseVersions(block: Record<string, unknown>): string[] {
  const raw = block.protocol_versions ?? block.versions;
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === 'string' && v.length > 0);
}

function parseServices(block: Record<string, unknown>): OpenDatingServices {
  const raw = asRecord(block.roles) ?? asRecord(block.services);
  const services: OpenDatingServices = {};
  if (!raw) return services;

  for (const role of KNOWN_ROLES) {
    const entry = asRecord(raw[role]);
    const pubkey = entry?.pubkey;
    // Silently skip malformed entries: a bad pubkey for one role must not
    // cost us the roles that are well-formed.
    if (typeof pubkey === 'string' && HEX_64.test(pubkey)) {
      services[role] = { pubkey: pubkey.toLowerCase() };
    }
  }
  return services;
}

function parseFeatures(block: Record<string, unknown>): Partial<OpenDatingFeatures> {
  const raw = asRecord(block.features);
  const features: Partial<OpenDatingFeatures> = {};
  if (!raw) return features;

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'boolean') {
      features[key as keyof OpenDatingFeatures] = value;
    }
  }
  return features;
}

/**
 * Extract OpenDating capabilities from a parsed NIP-11 document.
 * Returns null when the relay does not advertise OpenDating at all.
 */
export function parseCapabilities(nip11: unknown): OpenDatingCapabilities | null {
  const doc = asRecord(nip11);
  if (!doc) return null;

  const block = asRecord(doc.opendating);
  if (!block) return null;

  return {
    protocol_versions: parseVersions(block),
    roles: parseServices(block),
    features: parseFeatures(block),
  };
}

/**
 * Human-readable name for a service role, for use in "not available yet"
 * messaging. Deliberately plain language — no protocol jargon reaches the UI.
 */
export function serviceLabel(role: OpenDatingServiceRole): string {
  switch (role) {
    case 'profile':
      return 'Profiles';
    case 'discovery':
      return 'Discovery';
    case 'matcher':
      return 'Matching';
    case 'dm_policy':
      return 'Messaging';
    case 'moderation':
      return 'Reporting';
    case 'verification':
      return 'Verification';
    case 'media':
      return 'Photos';
    case 'system':
      return 'Connection';
  }
}

export { KNOWN_ROLES };
