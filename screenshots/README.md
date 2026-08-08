# Store Screenshots

## Required sizes

| Device | Resolution | Required |
|---|---|---|
| iPhone 6.7" (Pro Max) | 1290x2796 | Yes, `APP_IPHONE_67` |
| iPhone 6.1" (Pro) | 1179x2556 | Yes, `APP_IPHONE_61` |
| iPad 13" / 12.9" | 2048x2732 | Yes, `APP_IPAD_PRO_129` and `APP_IPAD_PRO_3GEN_129` |
| Google Play phone | 1080x1920 | Yes |

## How to capture

1. Build or provide an Android APK with `EXPO_PUBLIC_SCREENSHOT_MODE=true`.
2. Connect and unlock the Android device.
3. Run:

   ```bash
   ./scripts/capture-screenshots.sh --apk android/app/build/outputs/apk/release/app-release.apk
   ```

4. Verify the generated raw captures in `screenshots/`.
5. Generate the store assets:

   ```bash
   ./scripts/resize-screenshots.sh 01-welcome 02-create-account 12-discover 13-matches 14-profile
   ./scripts/resize-screenshots.sh --store google 01-welcome 02-create-account 12-discover 13-matches 14-profile
   ```

`screenshots/app-store/` must contain 15 files: five each for `6.7`, `6.1`,
and `ipad-13`. `store.config.json` references those same App Store files.

`screenshots/play-store/` must contain the five `phone-*` files for Google Play.
