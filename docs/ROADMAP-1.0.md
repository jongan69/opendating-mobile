# OpenDating 1.0 Execution Roadmap

This is the implementation ledger for the marketplace-competitive 1.0 program. It is intentionally stricter than a feature checklist: a phase is complete only when its code, operational, legal, security, and marketplace exit gates are supported by evidence from an exact release commit.

**Current state:** 0.1.1 is approved for iOS and Android launch in `release/manifest.json`. Phases 1–6 remain the path to a marketplace-competitive 1.0 and are not complete.

## Release policy

- `0.1.1` is the critical routing, deletion-contract, release-containment, and documentation correction.
- `0.2.x` is the security-foundation and closed-beta line.
- `1.0.0` is reserved for GA after every technical and marketplace gate passes.
- `main` must stay releasable, protected, and CI-green. Work lands through reviewed pull requests.
- A production artifact must be traceable to a signed annotated tag and manifest containing the app/build version, source-candidate git SHA, protocol version, database schema, artifact IDs, checksums, and migration state. The tagged approval commit may differ from the source candidate only in `release/manifest.json`; the release guard verifies that boundary and the tag signature.
- Mobile and relay development, staging, and production resources must be isolated. A production app must never fall back to staging implicitly.

## Phase ledger

| Phase | Status | Required evidence before completion |
|---|---|---|
| 0. Release containment | In progress | Stale iOS submission withdrawn, Android held, mobile and protocol PRs merged with CI, `opendating-protocol@0.1.1` published and pinned, deletion/swiping/profile navigation verified from the release commit, public claims corrected |
| 1. Secure production foundation | Not started | Protocol 0.2, native signer migration, authenticated envelopes, SQLCipher repositories/outbox/cursors, global blocks, push, deterministic sync, dependency remediation, physical-device E2E, independent security review, zero open critical/high release defects |
| 2. Trust, safety, and legal operations | Not started | Persona/Hive integrations, fail-closed moderation, console/appeals/audit, accepted policy versions, country registry, deletion web flow, vendor DPAs, legal approval, and staffed 24/7 escalation coverage meeting documented SLAs |
| 3. Intentional competitive product | Not started | Adaptive daily batches, reciprocal eligibility/ranking reasons/fairness, richer profiles and reactions, Opening Moves, durable chat/voice notes, Share Date/check-ins, inclusive preferences, beta activation/matching/messaging/safety gates |
| 4. Sustainable marketplace | Not started | Ethical Plus via RevenueCat, restore/entitlement tests, density-aware activation/referrals, reviewed analytics allowlist, load/resilience work, backup restoration, passive relay failover |
| 5. Controlled beta to GA | Not started | Dogfood, alpha, closed/open beta, country signoffs, staged store rollout, technical GA gates, marketplace liquidity/retention gates, four weeks of trust-and-safety SLA compliance |
| 6. Federation | Post-GA | Signed provider manifests, interchangeable providers, portable profile/private-list export, conformance suite, multiple independent operators |

## Execution order and dependencies

### 0. Contain the current release

- Withdraw the stale iOS build and leave Android unsubmitted/draft.
- Merge the mobile release-containment PR and backend protocol 0.1.1 PR through CI.
- Publish and pin `opendating-protocol@0.1.1`; remove the temporary mobile routing mirror.
- Verify account deletion against the advertised deletion service and prove that immediate hiding and cascade receipts work.
- Keep the configured protected branches, protected staging environments, and reviewer-gated production environments aligned with the deployment workflows.
- Exit only with release-commit evidence for discovery gestures, profile navigation, deletion, documentation, and store hold state.

### 1. Secure the identity, transport, and local-data boundary

1. Make JSON Schema the protocol source of truth; generate TypeScript types, standalone validators, wire docs, and request-to-role metadata.
2. Add the signer-based protocol API and native Swift/Kotlin signer. Migrate legacy SecureStore keys once, verify the derived public key, then erase the transitional value without logging it.
3. Add passkey-PRF/recovery-code encrypted recovery, associated-domain verification, authenticated import, and device-to-device transfer.
4. Introduce encrypted SQLite repositories for messages, conversations, outbox, cursors, blocks, preferences, flags, and delivery state. Exclude the database from cloud backup.
5. Implement the startup state machine: database, hydration, processors, authenticated connection, overlapped cursor replay, validation/decryption, transactional writes, store projection, cursor advance.
6. Enforce active-match and global-block authorization before direct messages or candidates reach UI state.
7. Add privacy-safe push notifications, token lifecycle management, deep links, and reinstall/logout/delete cleanup.
8. Pass property/fuzz, process-death, replay, offline, clock-skew, physical-device, penetration, and dependency gates.

The native signer and encrypted repository work are prerequisites for public user acquisition. Push cannot carry user content. Recovery cannot expose a raw key by default.

### 2. Establish trust, safety, and legal operations

1. Add server-created Persona inquiries, verified signed webhooks, claim-only retention, 72-hour grace enforcement, retry/manual review, and appeals.
2. Add deterministic bio rules plus provider-assisted profile moderation. Keep changes pending if moderation dependencies are down.
3. Build the moderation console inside the relay repository with Cloudflare Access, strong authentication, least privilege, immutable audit events, reason codes, evidence logging, and action previews.
4. Add consent-based encrypted evidence reporting; never send private conversations to vendors by default.
5. Implement account/device farm, spam, replay, copied-profile, link-abuse, and repeat-ban risk signals with human review for high-impact enforcement.
6. Complete Terms, Community Standards, Safety Center, retention/subprocessor disclosures, policy acceptance records, country controls, web deletion, DPAs, counsel approval, and 24/7 escalation contracts.

Public beta stays blocked until imminent-harm coverage is staffed continuously and the deletion, appeal, and vendor-outage runbooks have been exercised.

### 3. Build an intentional-dating product

- Produce 8–15 adaptive recommendations per local day without recycling rejects to disguise low supply.
- Apply reciprocal hard eligibility before ranking and return human-readable reason codes.
- Rank with compatibility, completeness, activity buckets, preference overlap, exploration, diversity, and exposure fairness; exclude payment status, private messages, popularity-only ranking, and exact location.
- Add stable prompt/photo IDs, private item reactions, Opening Moves, richer/inclusive profiles, relationship styles, completion coaching, and post-match feedback.
- Add durable delivery states and encrypted voice notes up to 60 seconds. Keep photo DMs and video calling out of 1.0 until their separate safety gates exist.
- Add encrypted Share Date links, local check-ins, and trusted-contact escalation without address-book uploads.

### 4. Monetize and scale without degrading trust

- Add one RevenueCat `plus` entitlement with monthly/annual store products, opaque billing IDs, signed webhooks, offline mirroring, purchase restore, and refund/revocation handling.
- Keep discovery, reactions, matching, messaging, verification, recovery, filters, deletion, and every safety capability free.
- Limit Plus to convenience and customization; never sell ranking, boosts, messaging, safety priority, verification, or access to hidden admirers.
- Add the reviewed analytics allowlist and scrubbed reliability reporting. Reject payloads containing content, pubkeys, location identifiers, photos, messages, or vendor references.
- Instrument eligible supply, recommendation fulfillment, matches, conversations, retention, reports, SLA adherence, reliability, queue age, and storage growth per coarse market.
- Implement D1 indexes/query-plan assertions, bounded pagination, idempotency, sessions/read replication, storage routing, backup exports, Time Travel, R2 versioning, restore drills, and a signed primary/passive bootstrap manifest.

### 5. Roll out by evidence

| Stage | Maximum cohort | Promotion condition |
|---|---:|---|
| Internal dogfood | 50 | Staging only; functional, privacy, and incident runbooks exercised |
| Invited alpha | 250 verified | Production-isolated cohort; no open release-blocking defect |
| Closed beta | 2,500 verified | Core English markets with legal/vendor/moderation approval and beta KPI gates |
| Open beta | 25,000 verified | Load, restore, security, deletion, support, liquidity, and retention gates passing |
| Store rollout | 1% → 5% → 25% → 100% | 48–72 healthy hours per step; country/service rollback flags proven |

GA requires the thresholds in the approved product plan, including crash-free sessions, latency and availability SLOs, successful restore/failover, deletion completion, physical-device accessibility coverage, onboarding/verification/recommendation/match/message/retention targets, and four consecutive weeks of safety SLA compliance.

## Workstream ownership

Each workstream requires a named directly responsible individual before execution:

- Protocol/identity/crypto: founder engineer plus independent cryptography reviewer.
- Mobile data/reliability: founder engineer plus mobile security review.
- Relay/storage/resilience: founder engineer plus Cloudflare/operations review.
- Trust and safety: accountable operations lead plus contracted 24/7 coverage.
- Verification/moderation vendors: product owner plus privacy counsel.
- Legal/country policy/store: counsel plus founder signoff.
- Marketplace/product/growth: product owner; acquisition cannot override safety or fairness gates.
- Release: one release manager who owns the manifest, evidence bundle, rollback, and go/no-go record.

## Evidence and decision records

For every exit gate, attach CI runs, test artifacts, security/legal/vendor approvals, operational drill results, dashboards, and a release SHA to the release ticket. A dashboard screenshot or statement of intent is not evidence that a destructive or recovery workflow works. Any waived gate needs an owner, rationale, expiry, and compensating control; critical security, deletion, age assurance, or safety staffing gates cannot be waived for public release.
