# OpenDating Mobile Handoff

Last reviewed: August 9, 2026.

## Handoff status

The repository is ready for another engineer to clone, test, and continue. Release 0.1.1 is approved for iOS and Android launch in `release/manifest.json`. The broader technical, operational, legal, and marketplace gates in `ROADMAP-1.0.md` remain the path toward 1.0.

The source of truth for current readiness is:

1. `docs/RELEASE-STATUS.md` for verified behavior and follow-up work.
2. `docs/ROADMAP-1.0.md` for execution order and exit evidence.
3. `release/manifest.json` for the machine-enforced release state.
4. `CLAUDE.md` and `AGENTS.md` for implementation constraints.

Historical documents with `COMPLETE` in their filenames describe the v0.1 feature baseline, not production or marketplace completion.

## Repository boundary

- This repository owns Expo/React Native screens, feature hooks, client state, protocol integration, local privacy enforcement, store metadata, and mobile release evidence.
- The relay and canonical protocol package live in `jongan69/OpenDating`.
- Mobile code must never import backend implementation source.
- Registry package `opendating-protocol@0.1.0` remains the installed public artifact. Backend source contains the `0.1.1` contract repair, but it must not be pinned here until npm publication and artifact verification succeed.

## Bootstrap and quality gates

```bash
cp .env.example .env
npm ci
npm run typecheck
npm run lint
npm test -- --passWithNoTests
npm run security:audit
npm run release:validate
```

Expo SDK 57 APIs must be checked against the versioned Expo documentation. Protocol calls must be checked against the installed package declarations in `node_modules/opendating-protocol/dist/index.d.ts`.

## Access that must be transferred

Do not put credential values in issues, documentation, chat, or Git.

| System | Required access | Current handoff note |
|---|---|---|
| GitHub | Admin or maintainer on both repositories | `main` is protected; staging and reviewer-gated production environments exist |
| npm | Publish rights for `opendating-protocol` | Current session is unauthenticated; registry remains `0.1.0` |
| Expo/EAS | Project owner or developer | Production builds remain release-manifest gated |
| Apple | App Store Connect access | Ship a fresh 0.1.1 build; 0.1.0 build 4 is superseded |
| Google | Play Console and service account | Ship a fresh 0.1.1 bundle; 0.1.0 version code 3 is superseded |
| Cloudflare | Read access for integration diagnosis | Resource ownership and deployments belong to the backend repository |
| Future vendors | Persona, Hive, RevenueCat, Sentry, moderation provider | Not approved or active for production data |

## Known dependency state

The mobile lockfile currently contains two high `image-size` advisories without patched releases and one medium `uuid` advisory through Expo/Metro/Xcode build tooling. `security/audit-exceptions.json` binds exceptions to exact advisories, affected ranges, owners, and a September 30, 2026 expiry. They must be removed or explicitly renewed with evidence before expiry.

## Immediate continuation order

1. Authenticate npm, publish and verify `opendating-protocol@0.1.1`, then pin the exact artifact here.
2. Record App Store withdrawal and Android hold evidence.
3. Begin Phase 1 with the native signer boundary and SQLCipher repositories; these precede public acquisition.
4. Implement deterministic sync/outbox/global blocks, then push and verification.
5. Do not start public beta until the trust-and-safety, legal, vendor, deletion, security, and staffing gates are evidenced.

## Release handoff rule

A green CI run is necessary but not sufficient to ship. A release manager must attach the exact source SHA, signed tag, manifest approval commit, EAS artifact identifiers and checksums, migrations, store state, rollback evidence, and every non-waivable gate to the release record.
