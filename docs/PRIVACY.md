# Privacy

## OpenDating Privacy Model

OpenDating is designed so that your dating activity is private by default.

## What OpenDating Knows

### Your Identity
- Your public key (npub) is known to the relay
- Your private key (nsec) **never** leaves your device

### Your Location
- Only your **general area** (~5 km precision) is shared
- Your exact GPS coordinates are **never** sent to the server
- How it works: GPS → geohash on device → truncate to 5 chars → send only the prefix
- Location is only updated when it changes significantly

### Your Profile
- Your dating profile is only shared through authorized discovery
- No one can enumerate all profiles
- You control who sees your profile through visibility settings
- Pausing hides you from new discovery

### Your Activity
- **Likes are private** — the other person only knows if you match
- **Blocks are private** — blocked users are not notified
- **Reports are private** — encrypted to the moderation service
- **Passes are local** — no data sent to server when you pass

### Your Messages
- Messages are **end-to-end encrypted** (NIP-44)
- Message content never reaches the server in plaintext
- Only you and your match can read your conversation
- Messages are routed through encrypted gift wraps (NIP-59)

## What Others Can See

- Your dating profile (as you've configured it)
- Your general distance bucket ("5-10 mi", not "2.17 miles")
- That you matched with them (mutual only)
- Messages you send them (encrypted in transit)

## What Others Cannot See

- Your exact location
- Your private key
- Whether you liked them (unless mutual)
- Whether you passed on them
- Whether you blocked them
- Your private discovery preferences
- Your message history with other people

## Limitations (Honest Disclosure)

### Screenshots
**People you interact with can still screenshot information they receive.**

Your matches can screenshot:
- Your profile
- Your photos
- Your messages

This is inherent to digital communication. No dating app can prevent this.

### Account Deletion
Deleting your account removes your presence from OpenDating, but it:
- Cannot erase copies someone intentionally saved (screenshots, etc.)
- Cannot delete messages already received by matched users' devices

### Metadata
While content is encrypted, the relay can observe:
- When you are active (connection timing)
- How many requests you make (traffic volume)
- This is inherent to client-server architecture

## Your Controls

| Control | What It Does |
|---|---|
| Pause Discovery | Hides you from new discovery; existing matches remain active |
| Block | Prevents all interaction; they won't know |
| Unmatch | Ends a match; removes messaging access |
| Report | Alerts moderation; your identity is protected |
| Delete Account | Removes your presence from OpenDating |
| Location Permission | You can deny or revoke at any time |

## Privacy Checklist

Before using OpenDating, verify:

- [ ] Your private key is stored in secure OS storage
- [ ] Your exact GPS is never sent to the server
- [ ] Your likes are private (not public)
- [ ] Your blocks are private (not public)
- [ ] Your reports are encrypted
- [ ] Your messages are end-to-end encrypted
- [ ] You understand the screenshot limitation
