# Protocol Integration

## Overview

OpenDating Mobile integrates with the OpenDating v0.1 protocol through:

1. **`opendating-protocol@0.1.0`** — Types, constants, validators, crypto helpers
2. **NIP-11 Service Advertisement** — Service pubkey discovery
3. **NIP-42 Authentication** — Relay auth challenge
4. **NIP-44 Encryption** — Application-level encryption
5. **NIP-59 Gift Wraps** — Private request/response routing
6. **NIP-17 Direct Messages** — End-to-end encrypted messaging

## Service Discovery

On connect, the client fetches the relay's NIP-11 document:

```
GET https://opendating-relay.jonathang132298.workers.dev
Accept: application/nostr+json
```

The response includes an `opendating` block with service pubkeys:

```json
{
  "opendating": {
    "protocol_versions": ["0.1"],
    "roles": {
      "system": { "pubkey": "<hex>" },
      "profile": { "pubkey": "<hex>" },
      "discovery": { "pubkey": "<hex>" },
      "matcher": { "pubkey": "<hex>" },
      "dm_policy": { "pubkey": "<hex>" },
      "moderation": { "pubkey": "<hex>" }
    },
    "features": {
      "match_only_dms": true,
      "private_profiles": true,
      "coarse_location": true,
      "private_reports": true,
      "vanish": true
    }
  }
}
```

Service pubkeys are cached locally but refreshed on reconnect.

## Request Lifecycle

Every private OpenDating command follows:

```
1. Build OpenDating envelope
   createEnvelope(type, crypto.randomUUID(), payload)

2. NIP-59 wrap to target service
   buildGiftWrap(78, JSON.stringify(envelope), userPrivKey, userPubKey, servicePubKey)

3. Publish kind 1059 EVENT through NDK

4. Wait for response gift wrap on kind 1059 subscription (#p = user pubkey)

5. Decrypt: outer → seal (kind 13) → rumor (kind 78) → OpenDating envelope

6. Match request_id with pending request

7. Return domain result
```

## Idempotency

- Every request uses a fresh `crypto.randomUUID()` as `request_id`
- Backend prevents double execution based on request_id
- On network retry, reuse the same request_id for the same mutation
- Never create two logical likes/blocks/reports from one user action

## Available Operations

### System Service
| Operation | Payload | Response |
|---|---|---|
| `system.ping` | `{}` | `system.pong` (server_time, protocol_version) |
| `system.capabilities` | `{}` | `system.capabilities.result` |

### Profile Service
| Operation | Payload | Response |
|---|---|---|
| `profile.create` | `{}` | `profile.create.result` |
| `profile.get` | `{}` | Full profile |
| `profile.update` | `{ profile_event_id? }` | — |
| `profile.pause` | `{}` | — |
| `profile.resume` | `{}` | — |
| `profile.delete` | `{}` | — |
| `visibility.update` | `{ visibility }` | — |
| `verification.list` | `{}` | `verification.list.result` |
| `account.delete` | `{}` | `account.delete.result` |

### Discovery Service
| Operation | Payload | Response |
|---|---|---|
| `discovery.update_location` | `{ geohash_prefix, country_code? }` | — |
| `discovery.update_preferences` | `{ max_distance_km?, min_age?, max_age?, intent?, genders? }` | — |
| `discovery.get_candidates` | `{ radius_miles?, age_min?, age_max?, genders?, relationship_intents?, limit?, cursor? }` | `{ candidates[], cursor?, remaining_today }` |

### Matcher Service
| Operation | Payload | Response |
|---|---|---|
| `intent.like` | `{ target_pubkey, candidate_grant }` | `intent.like.result` (match_created) |
| `intent.revoke` | `{ target_pubkey }` | — |
| `match.list` | `{}` | `match.list.result` (matches[]) |
| `unmatch.create` | `{ target_pubkey }` | — |

### DM Policy Service
| Operation | Payload | Response |
|---|---|---|
| `block.create` | `{ target_pubkey }` | — |
| `block.remove` | `{ target_pubkey }` | — |
| `block.list` | `{}` | `block.list.result` |

### Moderation Service
| Operation | Payload | Response |
|---|---|---|
| `report.create` | `{ subject_pubkey, report_type, description_encrypted?, evidence_event_ids? }` | — |

## Error Handling

### Relay-Level Errors
| Prefix | Meaning |
|---|---|
| `auth-required:` | NIP-42 auth needed |
| `restricted:` | Policy restriction (od:not-matched, od:blocked, etc.) |
| `rate-limited:` | Rate limit (od:discovery, od:likes) |
| `invalid:` | Invalid request (od:profile-schema, od:expired-request, od:unsupported-version) |
| `blocked:` | Operation blocked |

### Service-Level Errors
```json
{
  "type": "service.error",
  "payload": {
    "code": "...",
    "message": "..."
  }
}
```

All errors are mapped to user-friendly messages. Raw technical codes are never shown to normal users.

## Location Privacy

- Client uses `expo-location` to get GPS
- Immediately converts to geohash using local implementation
- Truncates to max 5 characters (~5 km precision)
- Sends only `geohash_prefix` to backend
- Raw coordinates discarded from application state
- Country code optionally derived from reverse geocode

## Message Flow (NIP-17)

```
Send:
  1. Build message content (text + timestamp)
  2. Create kind 14 rumor
  3. NIP-59 gift wrap to recipient
  4. Publish kind 1059 outer event

Receive:
  1. Subscribe to kind 1059 (#p = current user)
  2. On event, attempt NIP-44 decryption
  3. Parse rumor content
  4. Dispatch to conversation UI
```
