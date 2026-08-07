# Security

## Identity & Keys

### Key Generation
- User identity is a Nostr keypair generated via `opendating-protocol`'s `generateKeypair()`
- Uses `@noble/curves` secp256k1 underneath
- Keys generated on-device, never transmitted

### Key Storage
- Private key (nsec) stored ONLY in OS secure storage via `expo-secure-store`
- iOS: Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`
- Android: EncryptedSharedPreferences backed by Android Keystore
- Private key NEVER enters: AsyncStorage, SQLite, logs, analytics, navigation params, clipboard

### Signer
- NDK Mobile manages signing operations
- Private key material never leaves the secure signer context
- NIP-42 AUTH events signed by the signer

## Network Security

### Transport
- All relay communication over WSS (WebSocket Secure)
- NIP-11 info fetched over HTTPS

### Authentication
- NIP-42 AUTH required by relay
- Challenge-response: relay issues challenge → client signs kind 22242 event
- Challenges expire after 60 seconds, single-use, bound to relay URL
- Reconnection requires re-authentication

### Encryption
- **NIP-44**: Application-level encryption for private content
- **NIP-59**: Gift wraps for private request/response routing
- Conversation keys derived via ECDH (secp256k1)
- Each private request uses a fresh random request_id

## Data Privacy

### Location
- Raw GPS coordinates consumed internally, never stored
- Only geohash_prefix (max 5 characters, ~5km precision) sent to backend
- Country code optionally included (not required)
- Location not persisted to any storage

### Messages
- NIP-17 direct messages encrypted end-to-end
- Message plaintext never sent to relay (only encrypted gift wraps)
- Decrypted messages not persisted to AsyncStorage
- NDK cache stores encrypted Nostr events only

### Profile Data
- Profile information sent only through authorized discovery
- Arbitrary profile enumeration prevented by relay
- Photos accessed through authorized media tokens (not permanent public URLs)

## Safety

### Blocks
- Applied locally immediately upon user action
- Backend block.create sent asynchronously
- Blocked users: cannot discover, like, or DM the blocker
- Relay enforces blocks server-side
- Blocks are private — blocked user is not notified

### Reports
- Reports encrypted to moderation service
- Reporter identity protected
- Evidence event IDs optionally included
- Report content never in public Nostr tags

### Unmatch
- Removes match and messaging capability
- Unmatched user not explicitly notified why
- Reporting remains available after unmatch

## Limitations

### Screenshots
- Anyone receiving information (profile, messages) can screenshot it
- The app cannot prevent this
- This limitation is disclosed in privacy screen

### Key Recovery
- No server-side key recovery
- Users must back up their private key
- Lost keys = lost account (same as self-custody crypto wallet)

### Relay Trust Model
- The relay could theoretically observe encrypted traffic metadata
- Content is encrypted, but timing and volume patterns are visible
- This is inherent to the Nostr architecture

## Security Best Practices

1. Never log private keys, nsec, or decrypted content
2. Never put sensitive data in React Navigation params
3. Never send raw GPS to any external service
4. Always validate service responses against expected service identity
5. Use fresh request_id for every operation
6. Clear sensitive state on logout/account deletion
