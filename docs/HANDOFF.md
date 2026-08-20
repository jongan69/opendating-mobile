# OpenDating Mobile Handoff

Last reviewed: August 20, 2026.

## Handoff status

The repository is ready for another engineer to clone, test, and continue.
Release 0.1.1 is **not approved for launch**: `release/manifest.json` is blocked,
Apple rejected the previous submission under Guideline 4.3(b), and the next
candidate still needs external and physical-device evidence.

`main` remains the production branch. `dev` contains the reconciled remote
baseline plus disabled, development-only monetization work. Do not merge that
work into the next App Review candidate until `docs/MONETIZATION.md` is
satisfied; the safest next candidate is the private-introductions redesign
without paid features.

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
bun install --frozen-lockfile
bun run typecheck
bun run lint
bun run test
bun run security:audit
bun run release:validate
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

`security/audit-exceptions.json` is the only allowed dependency exception
source. The audit fails when Bun reports a new high/critical advisory, when the
documented advisory set changes, or when the exception expires. Do not expand
the exception merely to make CI green; first update the Expo-compatible
dependency set and inspect the remaining paths.

## Immediate continuation order

1. Keep `dev` clean and run the Bun quality gates above before new work.
2. Authenticate npm, publish and verify `opendating-protocol@0.1.1`, then pin the exact artifact here and remove the temporary request-routing mirror.
3. Resolve the dependency audit without broad or permanent exceptions.
4. Choose a release commit without unfinished RevenueCat behavior, then perform the complete iOS and Android physical-device walkthroughs.
5. Capture fresh Passport/private-introduction screenshots and the App Review video; create a fresh 0.1.1 build with a new build number.
6. Confirm App Privacy, Regulations and Permits, release notes, pricing/availability, and the 0.1.1 Store version before resubmitting with the prepared 4.3(b) response.
7. Do not start public beta until the trust-and-safety, legal, vendor, deletion, security, and staffing gates are evidenced.

## Release handoff rule

A green CI run is necessary but not sufficient to ship. A release manager must attach the exact source SHA, signed tag, manifest approval commit, EAS artifact identifiers and checksums, migrations, store state, rollback evidence, and every non-waivable gate to the release record.
