# Design

## Principles

1. **Context before judgment** — One person is introduced with an understandable reason
2. **Native feel** — iOS feels SwiftUI, Android feels Material 3
3. **Minimal** — White space, excellent typography, native controls
4. **Safe** — Safety controls never buried, always accessible
5. **Private** — Privacy is designed in, not added later

## Visual Identity

### Brand
- Original visual language — not a Tinder clone
- Warm, approachable, trustworthy
- Clean, modern, minimal

### Color System

**Light Mode**
- Background: Warm off-white (`#FAF9F7`)
- Surface: White (`#FFFFFF`)
- Text: Near-black (`#1A1A19`)
- Secondary text: Neutral gray (`#6B6B68`)
- Accent: Warm coral/rose (`#E8735A`)

**Dark Mode**
- Background: Near-black (`#141413`)
- Surface: Dark gray (`#1C1C1B`)
- Text: Off-white (`#F5F4F2`)
- Accent: Softer coral (`#F0856E`)

**Semantic**
- Success: Green (likes, matches)
- Destructive: Red (unmatch, block, delete)
- Warning: Orange (rate limits)

### Typography
- System fonts (SF Pro on iOS, Roboto on Android)
- Hierarchy: Display → Headline → Title → Body → Label → Caption
- Respects Dynamic Type / font scaling
- High contrast for readability

### Spacing
- 4px grid: 4, 8, 12, 16, 20, 24, 32, 48
- Generous white space
- Touch targets minimum 44pt

### Shape
- Continuous rounded corners on iOS where supported
- Standard rounded corners on Android
- Cards: radius 20-24
- Buttons: radius 10-16
- Full-radius for small elements

## Component Strategy

### Expo UI (Primary)
For conventional UI:
- Buttons, Text, TextFields, Forms
- Lists, List Rows
- Toggles, Pickers, Sliders
- Sheets, Dialogs
- Navigation controls

### React Native Primitives (Escape Hatch)
For interaction surfaces Expo UI isn't designed for:
- Candidate photo paging
- Complex gesture targets
- Custom photo overlays

### What We Don't Use
- No alternative UI frameworks (NativeWind, Tamagui, etc.)
- No CSS-in-JS solutions
- No custom component library bloat

## Platform Differences

### iOS
- SF Symbols for icons
- Native sheets and forms
- Subtle glass materials where appropriate
- System font rendering
- Native contextual menus
- Continuous border curves

### Android
- Material Symbols for icons
- Material 3 tonal surfaces
- Native navigation behavior
- Material typography feel
- Standard border radius

## Key Screens

### Private Introduction
- One candidate at a time; no endless deck
- Human-readable compatibility reasons above the profile
- Large photo with name, age, distance bucket, and interests
- Privacy receipt states what is shared, withheld, and unlocked after mutual interest
- Explicit **Skip privately** and **Express private interest** actions

### Privacy Passport
- Member-owned account identifier and backup path
- Live pause/resume control for introduction visibility
- Plain-language location, decision, and conversation boundaries

### Chat
- Clean message bubbles
- Sent: subtle accent
- Received: neutral surface
- Safety menu always accessible
- Simple text composer (MVP)

### Profile
- Large primary photo
- Clean form sections
- Native controls throughout

## Motion

- Match celebration: subtle scale + fade
- Navigation: native transitions
- Respects Reduce Motion
- Haptics: restrained, meaningful only

## Accessibility
- VoiceOver / TalkBack labels
- Dynamic Type support
- Reduce Motion support
- Minimum 4.5:1 contrast ratio
- Touch targets ≥ 44pt
- Decisions use explicit labeled buttons with clear accessibility labels
