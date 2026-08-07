# OpenDating Mobile — Agent Instructions

## First: Read CLAUDE.md

The project rules, architecture, and critical constraints are in `CLAUDE.md`. Read it before writing any code.

## Docs before code

Read the exact versioned Expo docs at https://docs.expo.dev/versions/v57.0.0/ before using any Expo API. Do not assume old APIs.

Read the installed `opendating-protocol` package types at `node_modules/opendating-protocol/dist/index.d.ts` before using any protocol function. Do not assume signatures.

Read the installed `@expo/ui` package types. Its component API differs from React Native primitives — universal components like `Button`, `TextInput`, `Picker`, `Switch` use different prop shapes than their RN equivalents.

## Environment

The app connects to:
- Relay: `wss://opendating-relay.jonathang132298.workers.dev`
- Info: `https://opendating-relay.jonathang132298.workers.dev`
- Protocol: `0.1`

These are in `.env.example`. The `.env` file is gitignored — create it from the example before running.

## Quality gates

Before marking work complete:
- `npm run typecheck` — 0 errors in strict mode
- `npm run lint` — 0 errors (warnings OK for set-state-in-effect and Reanimated immutability)
- No backend source imports
- No raw GPS, nsec, or decrypted message plaintext in new code paths

## Code generation note

Files generated in parallel agents may need lint fixes (duplicate imports, variable ordering). The CI workflow enforces these — run lint after resolving merge conflicts from parallel work.
