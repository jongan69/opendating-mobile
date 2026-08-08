# Backend Complete — OpenDating Relay v0.1 Handoff

**Date:** 2026-08-07
**Relay:** `wss://opendating-relay.jonathang132298.workers.dev`
**Protocol:** `opendating-protocol@0.1.0`

The backend is complete. Every flow the mobile app depends on has been implemented,
verified live against production, and exercised through a scriptable harness
(`scripts/od-client.ts` in the backend repo). No further backend changes are
required for the app to function end-to-end.

---

## Deployed Services (all live)

| Service | Role | Verified |
|---|---|---|
| `system` | Health checks, capability discovery | ✅ |
| `profile` | CRUD, visibility, pause/resume | ✅ create/update/get |
| `discovery` | Location, preferences, candidate queries | ✅ grant tokens, pagination, batch hydration |
| `matcher` | One-way likes, match creation, unmatch | ✅ grant verification, like quota, mutual match |
| `dm_policy` | Block/unblock, relay-enforced message gating | ✅ implemented |
| `moderation` | Report submission, Workers AI screening | ✅ AI blocks abusive bios |
| `deletion` | Account deletion cascade | ✅ implemented |

The relay advertises all seven services in its [NIP-11](https://github.com/nostr-protocol/nips/blob/master/11.md) response. The app's
`src/lib/opendating/capabilities.ts` reads this advertisement — a missing role
degrades to "not available yet" rather than blocking the app.

---

## Response Contract (do not change without coordination)

### `profile.create` / `profile.update`

Request:
```jsonc
{ "type": "profile.create", "payload": {} }
{ "type": "profile.update",
  "payload": { "profile": { "display_name": "Ava", "age": 27, "gender": "woman",
    "bio": "…", "interests": ["…"], "relationship_intent": "long_term",
    "prompts": [{"question":"…","answer":"…"}],
    "photos": [{"id":"…","url":"https://…","order":0}], "v": "0.1" } } }
```

Errors: `invalid_profile`, `content_rejected` (AI moderation block — the member
sees the rejection reason and can edit their bio).

### `discovery.update_location`

```jsonc
{ "type": "discovery.update_location",
  "payload": { "geohash_prefix": "dr5ru", "country_code": "US" } }
```

Max precision stored: 5 characters (~5km). The relay truncates longer prefixes.

### `discovery.update_preferences`

```jsonc
{ "type": "discovery.update_preferences",
  "payload": { "min_age": 18, "max_age": 99, "max_distance_km": 100,
    "genders": ["woman","man","nonbinary","other"], "intent": "long_term" } }
```

Changing preferences invalidates the current deck (grants deleted, deck rebuilt).

### `discovery.get_candidates`

Request: `{ "type": "discovery.get_candidates", "payload": { "limit": 20, "cursor": "<from previous page>" } }`

Response:
```jsonc
{ "type": "discovery.get_candidates.result",
  "payload": { "candidates": [{
    "pubkey": "<64 hex>",              // real pubkey for like + DM
    "profile": { "display_name": "…", "age": 27, "bio": "…", "interests": […],
                 "photos": […], "prompts": […] },
    "distance_bucket": "nearby",        // nearby | within 10 mi | 10-50 mi
    "candidate_grant": "<32 hex token>" // required for intent.like
  }], "cursor": "<base64url> | null",   // null = end of deck
     "remaining_today": 49 }}
```

Quota: 50 candidates/day. Exhausted → `discovery_quota_exhausted`.
No location set → `invalid_location`.

Pagination: send the `cursor` value back on the next request to get the next
page. `cursor: null` means the deck is exhausted. The `od_seen_candidates`
ledger prevents repeats across pages and sessions.

### `intent.like`

Request:
```jsonc
{ "type": "intent.like",
  "payload": { "target_pubkey": "<64 hex>",
               "candidate_grant": "<token from discovery>" } }
```

**`candidate_grant` is required.** The like is rejected without it
(`invalid_candidate_grant` — maps to "This profile is no longer available.").
The grant is verified against `od_candidate_grants` (token match + expiry) and
consumed on first use (one-time, anti-replay).

Response: `{ "type": "intent.like.result", "payload": { "intent_id": "…", "match_created": false, "created_at": 1700000000 } }`

Like quota: 30/day. Exhausted → `rate_limited` ("You've reached your daily like
limit. Come back tomorrow!").

### `match.list`

Response: `{ "type": "match.list.result", "payload": { "matches": [{ "match_id": "…", "other_member": "<member_id>", "state": "active", "created_at": 1700000000 }] } }`

### NIP-17 Direct Messages

DMs are pure relay transport — no service involved. Send a kind-14 rumor wrapped
in kind-1059 (NIP-59 gift wrap) to the recipient's pubkey. The relay enforces
match-only messaging: a DM to someone you haven't matched with is rejected.

### Blossom Media (Profile Photos)

- **Upload:** `PUT /upload` with `Authorization: Nostr <base64(kind-24242 event)>`
  - Event tags: `t=upload`, `expiration` (max 10 min), `x=<sha256>`
  - Max 8 MB, image types only (jpeg/png/webp/gif/heic)
  - Returns `{ url, sha256, size, type }` with 201
- **Retrieve:** `GET /<sha256>[.ext]` — immutable, cached forever
- **Delete:** `DELETE /<sha256>` with `Authorization: Nostr <base64(kind-24242, t=delete)>`

The mobile app's reference implementation is at `src/lib/opendating/media.ts`.

---

## Error Codes Mapped in the Mobile App

All codes the app already handles (from `src/lib/opendating/errors.ts`):

| Code | Meaning | User sees |
|---|---|---|
| `content_rejected` | AI moderation blocked the bio | "Profile content was flagged. Please edit and try again." |
| `invalid_candidate_grant` | Grant expired/consumed/forged | "This profile is no longer available." |
| `rate_limited` | Daily like quota exhausted | "You've reached your daily like limit. Come back tomorrow!" |
| `discovery_quota_exhausted` | 50 candidates/day hit | "You've seen everyone for today. Check back tomorrow!" |
| `invalid_location` | No location set before discovery | "Set your location to discover people nearby." |
| `invalid_profile` | Profile validation failed | "Please check your profile and try again." |
| `unsupported_version` | Protocol version mismatch | "Please update the app to continue." |
| `internal_error` | Unexpected server error | "Something went wrong. Please try again." |

---

## Verification Harness

The backend repo has a scriptable client at `scripts/od-client.ts`:

```bash
# Full flow: profile → location → prefs → candidates → like → matches
npx tsx scripts/od-client.ts verify --name Ava --age 27 --gender woman --geohash dr5ru

# Seed a second member (discovery needs two people)
npx tsx scripts/od-client.ts seed --name Ben --age 31 --gender man --geohash dr5ru

# NIP-17 message between two members
npx tsx scripts/od-client.ts dm --from <hex> --to <hex>

# Blossom photo upload (kind-24242 auth, PUT to R2, GET back)
npx tsx scripts/od-client.ts upload

# Point at local worker
OD_RELAY_WS=ws://localhost:8787 OD_RELAY_HTTP=http://localhost:8787 npx tsx scripts/od-client.ts verify
```

---

## What Changed (for the mobile developer)

1. **`candidate_grant` is now enforced.** If the app wasn't sending it before,
   likes will fail. The harness (`od-client.ts verify`) sends it — check that
   the app's like flow echoes the `candidate_grant` from the candidate card.

2. **Cursor-based pagination works.** Send the `cursor` from a
   `discovery.get_candidates` response back on the next request to page through
   the deck. `cursor: null` = no more people.

3. **Like quota exists.** 30 likes/day. The app already maps `rate_limited` to
   a user-facing message.

4. **Batch hydration.** A 20-card discovery page issues 2 database queries total.
   Latency should be noticeably lower.

---

## Known Environment Issue (blocks Android builds on this machine)

`~/Library/Android/sdk` is a symlink to an exFAT volume. macOS writes AppleDouble
`._*` sidecars that break CMake globs in `react-native-worklets` and
`react-native-screens`. Quick fix:

```bash
dot_clean -m /Volumes/T9/DevTools/AndroidSDK
```

Durable fix: move the SDK to the internal APFS disk.

The APKs in `android/app/build/outputs/` are stale and must not be used.

---

## Definition of Done (backend)

- [x] Moderation rejection reaches the client as `content_rejected`
- [x] Like without valid grant → `invalid_candidate_grant`
- [x] 20-candidate page: 2 D1 queries
- [x] Two pages fetchable with cursor; null = end of deck
- [x] 31st like → `rate_limited`
- [x] Service SQL has test coverage (15 integration tests, 239 total)
- [x] Photo upload verified end-to-end against production R2
- [x] Test members removed, storage keys rotated
- [x] `npm run ci` green (typecheck + build + 239 tests)
- [x] Deployed and verified live
