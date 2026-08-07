# App Store Screenshots

## Required sizes for iOS App Store

| Device | Resolution | Required |
|---|---|---|
| iPhone 6.7" (Pro Max) | 1290×2796 | Yes (3-5 screenshots) |
| iPhone 6.1" (Pro) | 1179×2556 | Yes (3-5 screenshots) |
| iPhone 5.5" (SE) | 1242×2208 | Optional |
| iPad 12.9" (6th gen) | 2048×2732 | Optional |

## How to capture

1. Build a preview build with EAS: `eas build --profile preview --platform ios`
2. Install on a real device or iOS Simulator
3. Take screenshots of key screens:
   - Discover (card deck with a profile)
   - Candidate detail (full profile view)
   - Matches (match celebration screen)
   - Chat (conversation view)
   - Privacy screen
4. Place PNG files in this directory named like: `6.7-discover.png`, `6.7-matches.png`, etc.
