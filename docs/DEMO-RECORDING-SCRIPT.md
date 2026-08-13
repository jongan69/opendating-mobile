# Demo Recording Script

A shot list for the App Review screen recording Apple requested. Target length
is 4–6 minutes. Record in one continuous take if you can; a single unedited take
is the most credible evidence that the app works.

## Before you record

- [ ] **Use a physical device.** Apple asked for one specifically. The connected
      11-inch iPad Pro (3rd generation) on iPadOS 26.6 is the test target.
- [ ] **Use a real build, not the screenshot build.** `EXPO_PUBLIC_SCREENSHOT_MODE`
      must be unset or `false`. The `screenshot` EAS profile sets it to `true`,
      which replaces discovery, matches, and profile with fabricated demo data.
      Recording that build would show content that is not real.
- [ ] **Start from a clean install** so the account-creation flow and every
      permission prompt actually fire. Delete the app first if it is installed.
- [ ] Silence notifications (Focus / Do Not Disturb) so banners do not cover the UI.
- [ ] Have a second account ready on another device if you want to demonstrate a
      real match and a real conversation. Without one, the match and chat
      sections will be empty — see "If the network is empty" below.
- [ ] Start the recording from Control Center **before** tapping the app icon.
      Apple asked that the recording begin with launching the app.

## Shot list

Timings are guidance, not targets. Pause on each screen long enough to read it.

### 1. Launch (0:00–0:15)
Home screen, tap the OpenDating icon. Let the splash screen and welcome screen
load without cutting.

From the welcome screen, briefly open **I already have an account** to show the
existing-account access path. The recovery-key field is masked by default. Do
not paste, reveal, or record a real recovery key. Go back and continue with a
new disposable account. There is no email/password or third-party login.

### 2. Account registration (0:15–1:45)
Apple explicitly asked for registration, login, and deletion. This app has no
separate login step — the account is created on-device and persists. Narrate
that, or note it in the reply text.

| Screen | What to show |
|---|---|
| Welcome | Tap **Create Account** |
| Create account | Create a disposable account for this recording. The recovery key is generated and stored securely but is not displayed |
| Privacy | Scroll the privacy summary, open the Terms and Community Standards, return, check the consent box, then continue |
| Basics | Type a display name, an age of 18+, pick a gender |
| Preferences | Set match preferences |
| Intent | Pick what you are looking for |
| About | Type a short bio |
| Photos | **Permission prompt fires here.** Tap Allow and pick at least two photos |
| Location | **Permission prompt fires here.** Tap Allow While Using App. Pause on the coarse-area readout — it shows the ~5 km region, which demonstrates that exact GPS is not used |
| Review | Scroll the assembled profile |
| Finish | Tap **View My Privacy Passport** |

Both permission prompts must be visible in the recording. Do not pre-grant them.

### 3. Privacy Passport and introductions (1:45–2:45)
Pause on **Privacy Passport** and show the account, visibility, location,
decision, and conversation cards. Toggle introduction visibility off and back
on. Open **Introductions**. Pause on the compatibility reasons and privacy
receipt, then tap the card to open the full candidate profile. Return and use
the explicit **Skip privately** or **Express private interest** action. There is
no swipe gesture or public engagement count.

### 4. User-generated content: reporting (2:45–3:15)
From a candidate profile, open the safety menu and tap **Report**. Show the
report screen with its reason options. Submit one, or back out — either
demonstrates the mechanism, but submitting is stronger evidence.

### 5. User-generated content: blocking (3:15–3:35)
Open the safety menu again and tap **Block**. Show the confirmation dialog and
confirm. Show that the profile is gone from introductions afterward.

### 6. Matches and encrypted messaging (3:35–4:25)
The Matches tab. Open a match, send a message, and show it delivered. If you
have a second device, show the message arriving there.

### 7. Account deletion (4:25–5:15)
Profile tab → Settings → Account → **Delete Account**. Show the confirmation
dialog listing what deletion does, confirm it, and show the app returning to the
welcome screen. Then relaunch the app once to show the account is genuinely gone
and you land back at onboarding.

This is the section reviewers most often find missing. Do not rush it.

### 8. Close
End on the welcome screen. Stop the recording.

## If the network is empty

The app runs against a live relay and shows real nearby users. If nobody else is
in your coarse area, introductions and matches will be empty.

Do not fake it with the screenshot build. Instead, either:

1. Create two or three accounts on other devices in the same coarse area shortly
   before recording, so introductions has real profiles; or
2. Record the empty states honestly and say so in the reply, offering to
   coordinate seeded accounts in Apple's review region.

Option 1 produces a much stronger submission.

## After recording

- Trim only the dead air at the very start and end. Do not cut between sections.
- Keep it under Apple's upload limit; H.264 MP4 is safest.
- Attach it in the App Store Connect reply along with the notes from
  [App Review Information](APP-REVIEW-NOTES.md).
