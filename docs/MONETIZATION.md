# OpenDating monetization contract

**Status:** implementation and catalogs are connected in production candidate
0.1.1 (5). The feature remains a blocked release candidate until the
purchase/restore flow passes on a physical iOS device.

OpenDating Plus may sell customization and convenience. It must never sell
ranking, boosts, hidden admirers, safety, verification, recovery, deletion,
matching, reactions, discovery, filters, or messaging.

## RevenueCat catalog

- Project: `proj3363ecdc`
- iOS app: `app8aaadf2571`
- Entitlement: `plus`
- Offering: `default`
- Product: `opendating_plus_lifetime` (non-consumable)
- App Store Connect product ID: `6806640623`
- App Store Connect version ID: `c62d972a-949a-4148-822a-6ae49f98dbe9`
- Package: `$rc_lifetime`
- Price: $4.99 in the US, with store-localized pricing elsewhere
- Benefit: Sage, Ocean, and Plum app accent themes
- EAS build: `cf5d4b22-f7aa-430b-980f-f4b191718612`
- App Store Connect build: `12dd3ff2-f9bd-491a-984f-b14aafd02ef8` (0.1.1 build 5, valid)

Prices are never hardcoded in the app. The paywall renders the localized store
price delivered by RevenueCat.

## Privacy and release gates

The SDK derives a stable SHA-256 billing identifier from a domain-separated
value. A raw Nostr public key is never sent to RevenueCat or logged.

The purchase screen is fail closed and requires both
`EXPO_PUBLIC_REVENUECAT_ENABLED=true` and
`EXPO_PUBLIC_OPENDATING_PLUS_FEATURES_READY=true`. The paid entitlement changes
only local accent colors. It never changes discovery, ranking, matching,
messaging, recovery, deletion, or safety behavior.

Before enabling, validate the store product, map the entitlement and lifetime
package in RevenueCat, then exercise purchase, refund/revocation, restore,
identity import, identity deletion, offline access, and app-reinstall paths in
a native build.

The client fails closed unless RevenueCat reports `VERIFIED` or
`VERIFIED_ON_DEVICE` for the entitlement. App Privacy and the public
subprocessor list must be updated before either feature gate becomes true.
