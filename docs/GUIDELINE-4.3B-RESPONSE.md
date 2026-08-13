# Guideline 4.3(b) Remediation

**Submission:** `39b836d6-fdcd-4920-94fa-2a54b5b8a4ce`

**Rejected:** August 13, 2026

**Reviewed:** 0.1.0 (1), iPad Air 11-inch (M3)

**Status:** Do not appeal or resubmit the rejected binary. Prepare 0.1.1 with
the product and evidence below.

## Why the reviewed experience failed

The reviewed build led with a familiar photo swipe deck, pass/like controls,
matches, and chat. Its actual differences were mostly explained in onboarding,
Settings, or metadata. Apple evaluates the primary experience under 4.3(b), so
privacy architecture alone was not enough when the visible interaction was
indistinguishable from established dating apps.

## Material product changes in 0.1.1

1. **Deliberate private introductions replace swiping.** The app presents one
   person at a time with explicit `Skip privately` and `Express private
   interest` actions. There is no swipe gesture or public engagement count.
2. **Every introduction explains itself.** The explanation uses only shared
   interests, matching relationship intent, and the existing coarse distance
   bucket. It does not claim an opaque compatibility score.
3. **Every introduction includes a privacy receipt.** It states what is shared
   now, what remains withheld, and that encrypted chat opens only after mutual
   interest.
4. **Privacy Passport is a primary tab and the first post-onboarding screen.**
   Members can inspect account ownership, the on-device location boundary,
   private-decision behavior, encrypted-conversation behavior, visibility,
   backup/restore, and deletion.
5. **Store presentation leads with the control model.** New metadata and
   screenshots must show Passport and the privacy receipt before matches/chat.

## Reviewer walkthrough

1. Launch and tap **Create Account**. No phone, email, password, or social login
   is requested.
2. Complete onboarding. On Location, observe that the permission is reduced to
   an approximate area before it is sent.
3. Finish onboarding. The app opens **Privacy Passport**, not a swipe deck.
4. Pause and resume introductions on Passport. Open account backup to verify
   that a recovery-key flow exists; do not expose a real recovery key in video.
5. Open **Introductions**. Read **Why this introduction** and the three-line
   **Privacy receipt**.
6. Open the full profile and use **Skip privately** or **Private interest**.
7. With two seeded accounts, choose each other and open the resulting
   end-to-end encrypted chat.
8. Demonstrate report, block, and permanent account deletion.

## App Review reply after the new build and evidence exist

```text
Hello App Review,

Thank you for the Guideline 4.3(b) feedback. We agreed that version 0.1.0 (1)
presented its primary experience too much like a conventional swipe-based
dating app, even though its underlying privacy model differed. We have not
resubmitted that binary.

Version 0.1.1 materially changes the product experience:

- Swipe browsing has been removed. OpenDating now provides one deliberate
  private introduction at a time with explicit private actions.
- Every introduction explains the visible shared signals behind it and shows a
  privacy receipt: what is shared, what is withheld, and what unlocks only
  after mutual interest.
- A new Privacy Passport is a primary tab and the first destination after
  onboarding. It gives members live visibility, account backup/restore,
  location-boundary, encrypted-conversation, and deletion controls.
- Accounts remain self-owned and require no phone number, email address,
  password, or third-party login. Exact GPS is reduced on-device before
  sharing, interest remains private unless mutual, and chat is end-to-end
  encrypted.

Reviewer path: create an account -> complete onboarding -> Privacy Passport ->
Introductions -> open a full introduction -> private interest -> Matches.

We attached a physical-device walkthrough beginning at launch and showing the
new Passport, introduction explanation, privacy receipt, mutual-interest chat,
report/block controls, permission prompts, and account deletion.

We respectfully request review of the materially revised 0.1.1 build under
Guideline 4.3(b).
```

Do not send the reply with a claimed attachment until the physical-device video
has been recorded, inspected, and uploaded.
