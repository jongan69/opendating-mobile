---
title: "What OpenDating's Coarse Location and Message Encryption Protect"
description: "Understand what OpenDating's on-device coarse location and encrypted messages protect, what metadata remains, and where the limits are."
pubDate: 2026-08-29
draft: true
category: "evergreen"
keywords: ["OpenDating privacy", "coarse location", "encrypted dating messages"]
---

OpenDating's genuine privacy advantage is narrow and technical: its mobile location flow does not send raw coordinates, and direct-message content is end-to-end encrypted. Those choices reduce what the current service operator can learn. They do not make the service anonymous or decentralized today.

## What happens to location

The mobile app obtains coordinates, converts them on-device into a geohash, truncates that value to at most five characters, and passes only the prefix onward. A geohash cell is an approximate area whose shape and real-world dimensions vary by latitude and boundary.

The service still needs the prefix to find introductions in nearby areas. It can observe when an account asks for discovery and can associate those requests with an account identifier. Profile details, photos, repeated behavior, and conversations may reveal more precise location than the geohash itself.

## What happens to messages

Direct-message content is encrypted for the matched recipient before transport. The operator does not receive the plaintext needed to display the conversation.

Encryption does not hide every fact. The service can observe delivery timing, traffic volume, and routing identifiers. A recipient can screenshot, copy, or forward a message. When someone reports abuse, they may intentionally include selected evidence for moderation. Content already delivered to another device cannot be remotely erased.

## Current operator and recovery limits

OpenDating uses an open protocol, but the deployed discovery, matching, policy, moderation, media, and deletion roles are currently operated by OpenDating. Independent providers, federation, full portability, and provider migration are post-GA work.

Account identity is based on a cryptographic key. The current JavaScript signer and legacy recovery-key export are pre-release limitations. A safer native signer and passkey-encrypted recovery remain release blockers.

## Pricing, platforms, and availability

The intended platforms are iOS and Android. OpenDating is not generally available. The core is free, and the current candidate contains an optional one-time purchase for themes only. That purchase does not change discovery, ranking, matching, messaging, recovery, deletion, or safety.

## Who should choose another product

Choose another service if you need current store availability, a large member network, conventional password recovery, independent-provider portability, or mature support. OpenDating's approach is relevant to technical reviewers and early users who value minimized location precision and encrypted message content enough to accept those limits.

## Sources checked

Draft checked August 29, 2026 against the [privacy model](https://github.com/jongan69/opendating-mobile/blob/main/docs/PRIVACY.md), [security model](https://github.com/jongan69/opendating-mobile/blob/main/docs/SECURITY.md), [location source](https://github.com/jongan69/opendating-mobile/tree/main/src/lib/location), [roadmap](https://github.com/jongan69/opendating-mobile/blob/main/docs/ROADMAP-1.0.md), and [release status](https://pages.jongan.com/opendating-mobile/status/).
