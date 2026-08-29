# Release Status

**Status: proposed launch candidate.** OpenDating Mobile 0.1.1 is a proposed iOS App Store and Google Play release. Launch approval is not effective until Phase 0 release-containment gates pass and `release/manifest.json` records the reviewed source SHA, artifact IDs, build numbers, and checksums.

Apple rejected the previous submission under Guideline 4.3(b). Fresh production
build 0.1.1 (5), built from `c505b83a11b986bb29879c178327460f187ec370`,
is valid in App Store Connect and attached to the editable 0.1.1 version. It is
not submitted for review. Replacement screenshots, physical-device recording,
purchase/restore proof, and the evidence in `docs/GUIDELINE-4.3B-RESPONSE.md`
remain required.

## Verified in this release

- One-at-a-time private introductions and candidate-profile navigation are implemented.
- Every introduction explains its visible compatibility facts and includes a privacy receipt.
- The Privacy Passport exposes account, visibility, location, decision, and conversation boundaries.
- Account deletion routes to the relay's advertised `deletion` service.
- Unmatch and block removal route to the policy service; the backend implements idempotent block removal.
- Inbound service responses require a valid signed seal, a valid rumor hash, the expected advertised sender, request ID, response type, and freshness window.
- Early direct messages are buffered during bootstrap and in-memory replay tracking is bounded.
- Typecheck, lint, unit tests, protocol conformance tests, dependency review, production audit exceptions, and release-manifest validation are CI gates.
- Both repositories protect `main`; GitHub staging environments are protected-branch-only and production environments require `jongan69` approval.
- The production web app and Cloudflare Worker respond successfully over HTTPS, and the web export includes the restrictive CSP.
- RevenueCat project `proj3363ecdc` contains the App Store product, `plus` entitlement, current `default` offering, and `$rc_lifetime` package used by build 5.

## Tracked for follow-up releases

These are post-launch engineering priorities, not launch gates:

1. Replace the JavaScript private-key lifetime and clipboard export with the native signer and passkey-encrypted recovery design.
2. Persist conversations, messages, outbox state, sync cursors, preferences, and blocks in an encrypted device database.
3. Enforce global blocks and active-match authorization before any inbound DM reaches UI state.
4. Add push delivery, liveness/age verification, profile moderation, appeals, and staffed trust-and-safety operations.
5. Resolve or renew the time-limited SDK dependency exceptions in `security/audit-exceptions.json`.
6. Validate RevenueCat purchase, restore, revocation, identity changes, reinstall, and offline behavior on a physical iOS device.

## Release mechanics

The machine-readable state is in `release/manifest.json`, which remains
`blocked` until its evidence requirements are satisfied. Product implementation
or a successful local build alone does not approve a release.

The production build and submit scripts still call `scripts/release/assert-release-ready.mjs`, which additionally requires:

- `manifest.gitSha` pinned to the source-candidate commit, with the approval commit changing only `release/manifest.json`;
- a signed annotated tag `opendating-mobile-v0.1.1` (or a numbered `-rc.*`) on the approval commit;
- `OPENDATING_RELEASE_APPROVED=true` in the protected release environment.

These are operational steps performed by the release manager at ship time. See
[Deployment](DEPLOYMENT.md) for the ordered command sequence.
