# Contributing to OpenDating Mobile

## Getting Started

```bash
git clone https://github.com/jongan69/opendating-mobile.git
cd opendating-mobile
cp .env.example .env
npm install --legacy-peer-deps
npm run typecheck
```

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run the quality checks:
   ```bash
   npm run typecheck   # Must pass with 0 errors
   npm run lint        # Must pass with 0 errors
   npm test            # Must pass
   ```
4. Test on at least one platform (iOS simulator, Android emulator, or physical device)
5. Open a PR using the PR template

## Code Style

- **TypeScript strict mode** — all code must pass `tsc --noEmit`
- **Path aliases** — use `@/` for `src/` imports (e.g., `import { useTheme } from '@/state/theme-context'`)
- **Kebab-case filenames** — `use-discovery.ts`, `swipe-deck.tsx`
- **No default exports** in library code — prefer named exports

## Architecture Rules

1. **Screens never construct Nostr events.** Protocol operations go through `OpenDatingClient`.
2. **No backend imports.** The app is an independent client.
3. **No hardcoded service pubkeys.** Discover them from NIP-11.
4. **Plain language in UI.** Never use Nostr terminology in user-facing text.
5. **@expo/ui first.** Only escape to React Native primitives where @expo/ui can't handle it (swipe deck, complex gestures).

## Privacy Rules

- Raw GPS never leaves `src/lib/location/`
- Geohash precision never exceeds 5 characters
- nsec lives only in SecureStore — never in AsyncStorage, logs, or navigation params
- Blocks take effect locally before network confirmation
- Reports are encrypted to moderation service

## Commit Messages

Follow conventional commits:
- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code restructure
- `docs:` — documentation
- `test:` — tests
- `chore:` — build, CI, dependencies

## Questions?

Check `docs/ARCHITECTURE.md` for the system design, or `CLAUDE.md` for the project rules.
