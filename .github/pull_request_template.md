## Summary

<!-- What does this PR do? -->

## Checklist

- [ ] `npm run typecheck` passes (0 errors)
- [ ] `npm run lint` passes (0 errors)
- [ ] `npm test` passes
- [ ] No backend implementation imports or references
- [ ] No hardcoded service pubkeys
- [ ] User-facing text uses plain language (no Nostr terminology)
- [ ] Dark mode tested on the screens touched
- [ ] iOS and Android layouts verified
- [ ] No raw GPS in logs, storage, or payloads

## Screenshots

<!-- Screenshots of the changed screens in both light and dark mode -->

## Privacy checklist (if touching location, keys, messages, or reports)

- [ ] nsec never leaves device
- [ ] Exact GPS never reaches backend
- [ ] Geohash precision never exceeds 5 characters
- [ ] DM plaintext never reaches backend
- [ ] Blocks take effect locally before network response
- [ ] Reports go privately to moderation service
