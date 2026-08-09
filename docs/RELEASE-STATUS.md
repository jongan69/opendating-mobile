# Release Status

**Status: production blocked.** OpenDating Mobile 0.1.1 is a pre-release reference client. No current iOS or Android binary is approved to ship.

## Verified in this release branch

- Discovery deck gestures and candidate-profile navigation are repaired.
- Account deletion routes to the relay's advertised `deletion` service.
- Unmatch and block removal route to the policy service; the backend implements idempotent block removal.
- Inbound service responses require a valid signed seal, a valid rumor hash, the expected advertised sender, request ID, response type, and freshness window.
- Early direct messages are buffered during bootstrap and in-memory replay tracking is bounded.
- Typecheck, lint, unit tests, protocol conformance tests, dependency review, production audit exceptions, and release-manifest validation are CI gates.
- Both repositories protect `main`; GitHub staging environments are protected-branch-only and production environments require `jongan69` approval.

## Production blockers

1. Replace the JavaScript private-key lifetime and clipboard export with the native signer and passkey-encrypted recovery design.
2. Persist conversations, messages, outbox state, sync cursors, preferences, and blocks in an encrypted device database.
3. Enforce global blocks and active-match authorization before any inbound DM reaches UI state.
4. Add push delivery, liveness/age verification, profile moderation, appeals, and staffed trust-and-safety operations.
5. Complete legal review, country activation controls, vendor agreements, privacy labels, store review, and web deletion.
6. Resolve or renew the time-limited SDK dependency exceptions in `security/audit-exceptions.json`.
7. Pass physical-device E2E, load, restore/failover, and independent security tests from the exact release commit.

## External actions still required

- Withdraw or reject the stale iOS submission in App Store Connect and keep the Android artifact in draft.
- Authenticate npm, publish `opendating-protocol@0.1.1`, then update the mobile lockfile to that exact release.
- Obtain legal, security, verification, moderation, and store approvals. Repository changes cannot satisfy these operational gates by themselves.

The machine-readable state is in `release/manifest.json`. Production build and submit scripts refuse to run while it is blocked.
