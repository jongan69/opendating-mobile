# OpenDating monetization contract

**Status:** development-only and disabled. Do not merge this integration into
the next App Review candidate merely because the SDK compiles. The app still
has no release-ready paid benefit, store products, webhook reconciliation, or
native purchase evidence.

OpenDating Plus may sell customization and convenience. It must never sell
ranking, boosts, hidden admirers, safety, verification, recovery, deletion,
matching, reactions, discovery, filters, or messaging.

## RevenueCat catalog

- Entitlement: `plus`
- Offering: `default`
- Products: `opendating_plus_monthly`, `opendating_plus_annual`
- Packages: `$rc_monthly`, `$rc_annual`
- Initial pricing hypothesis: $2.99 monthly or $19.99 annual in the US, with
  store-localized pricing everywhere else

Prices are never hardcoded in the app. The paywall renders the localized store
price delivered by RevenueCat.

## Privacy and release gates

The SDK derives a stable SHA-256 billing identifier from a domain-separated
value. A raw Nostr public key is never sent to RevenueCat or logged.

The paywall is fail closed and requires both
`EXPO_PUBLIC_REVENUECAT_ENABLED=true` and
`EXPO_PUBLIC_OPENDATING_PLUS_FEATURES_READY=true`. Feature readiness stays
false until at least one durable customization/convenience benefit exists and
the product's verification, account recovery, moderation, abuse-reporting,
deletion, and privacy acceptance gates have runtime evidence.

Before enabling, create and validate both store products, map the entitlement
and packages in RevenueCat, add signed webhook reconciliation to the backend,
then exercise purchase, renewal, cancellation, revocation, restore, identity
import, identity deletion, offline access, and app-reinstall paths in native
development builds.

The client fails closed unless RevenueCat reports `VERIFIED` or
`VERIFIED_ON_DEVICE` for the entitlement. App Privacy and the public
subprocessor list must be updated before either feature gate becomes true.
