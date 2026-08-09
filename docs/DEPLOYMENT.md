# OpenDating Mobile Deployment Guide

**Last updated:** 2026-08-09

**App:** OpenDating Mobile 0.1.1 pre-release

**Bundle IDs:** `com.jongan69.opendating` (iOS and Android)

## Release hold

Production builds and submissions are blocked. The existing iOS 0.1.0 build 4 and Android 0.1.0 build 3 predate required fixes and must not be released. See [Release Status](RELEASE-STATUS.md), [1.0 Execution Roadmap](ROADMAP-1.0.md), and `release/manifest.json`.

The production build and submit scripts call `scripts/release/assert-release-ready.mjs`. They refuse to run unless:

1. the release manifest status is `approved`;
2. the manifest's git SHA equals the exact checked-out commit; and
3. an authorized release manager explicitly sets the production approval variable.

Do not bypass this guard. A successful EAS build is an artifact, not approval to ship.

## Known remote artifacts

| Platform | Artifact | Required action |
|---|---|---|
| iOS | EAS build `79e9b81e-6f66-4dcc-b46f-4ae53da4ae67`, app version 0.1.0 build 4 | Withdraw/reject the stale App Store Connect submission and do not promote the binary |
| Android | EAS build `f5b79c72-91ee-4dd3-96e7-0343911e2ca2`, app version 0.1.0 build 3 | Keep out of production and leave any Play release in draft |

EAS confirms that both store artifacts finished. App Store Connect submission state must be verified in App Store Connect itself; repository documentation is not authoritative for live review state.

## Environments

Before a production release is approved, create distinct development, staging, and production resources for:

- relay Workers, routes, domains, secrets, and signed bootstrap manifests;
- D1, R2, KV, Queues, backups, and observability;
- EAS build/update profiles and store credentials;
- verification, moderation, push, billing, analytics, and crash-reporting vendors.

Production builds must receive production endpoints explicitly and must never silently fall back to staging. Required production bindings fail closed.

## Required local configuration

The checked-in `.env.example` documents non-secret local values. Copy it to the ignored `.env` for development. Never commit App Store, Play, EAS, relay, vendor, signing, recovery, or database secrets.

Store automation expects credential paths through environment variables:

- `ASC_API_KEY_PATH` and `ASC_API_KEY_ISSUER_ID` for App Store Connect;
- `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` for Play Console.

Their presence is not evidence of release approval. Keys must be least-privilege, rotated, and stored in the approved secret manager. Do not record credential locations or availability in this guide.

## Pre-release verification

Run from the exact candidate commit:

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --runInBand
npm run security:audit
npm run release:validate
```

CI also checks for backend source imports, creates an SBOM, reviews dependency changes, and uploads test evidence. Warnings permitted by the project policy must be reviewed; errors are not permitted.

Before promoting a release, also verify:

- protocol package/version and relay capabilities match the manifest;
- account deletion, discovery gestures, candidate profiles, blocks, reports, unmatch, and recovery on physical devices;
- no raw GPS, secret keys, message plaintext, sensitive profile content, or stable identity keys appear in logs, analytics, crash reports, push payloads, URLs, or navigation state;
- merged iOS/Android permission manifests contain only exercised permissions;
- store privacy/data-safety disclosures, policies, deletion URL, moderation coverage, and country approvals match runtime behavior;
- restore/failover, rollback, load, security, and operational evidence is attached to the release ticket.

## Building after approval

EAS is the primary store-build path. Only after the manifest and external gates are approved:

```bash
npm run build:ios
npm run build:android
```

The exact EAS artifact IDs and checksums then belong in `release/manifest.json`. Verify the signed binaries and store metadata before submission.

Submit only the recorded artifacts:

```bash
npm run submit:ios
npm run submit:android
```

Android submission targets an internal draft. Promotion is a separate, evidence-backed release decision. iOS review submission is also separate from artifact upload.

## Screenshots and listing assets

Generate store screenshots with the isolated screenshot profile:

```bash
./scripts/capture-screenshots.sh
./scripts/capture-screenshots-ios.sh
./scripts/resize-screenshots.sh
```

Screenshot mode may use fixture data only. It must not connect a store asset generator to real user accounts or production private content. Listing copy comes from [Store Listing](STORE_LISTING.md) and must receive legal/product review before submission.

## Release sequence

1. Merge reviewed changes through protected `main` branches in both repositories.
2. Publish and pin the canonical protocol package.
3. Create a signed release candidate tag.
4. Populate the release manifest with the exact SHA, protocol/schema/migration state, artifacts, and checksums.
5. Run CI, release-build E2E, security, deletion, backup/restore, and rollback evidence from that tag.
6. Obtain engineering, security, legal, trust-and-safety, operations, and country go/no-go approvals.
7. Change the manifest to approved in its own reviewed PR.
8. Build, verify, submit, and roll out through the staged percentages in the roadmap.
9. Monitor each stage for 48–72 hours and roll back or disable affected services through signed flags if a gate regresses.

## Live store containment

- In App Store Connect, select OpenDating 0.1.0 build 4 and remove it from review if its current status permits. Record the resulting state and timestamp in the release ticket.
- In Play Console, keep 0.1.0 build 3 out of production. Do not upload it merely to complete console setup.
- Do not replace either stale artifact until the exact new candidate commit passes the approved release gates.

Store consoles and EAS are the authorities for live artifact state; this file describes policy and the last verified artifact identities only.
