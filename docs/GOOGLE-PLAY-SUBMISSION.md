# Google Play submission package

Prepared 25 September 2026. **Draft only; no Console submission, account creation, signing or publication.** Android compilation and device tests are blocked by the missing SDK. Follow ANDROID.md first.

## Current requirements and blockers

- New ordinary Android apps/updates must target **API 36** from 31 August 2026. This project sets compile/target 36 and min 24, but configuration is not proof of a compatible build. [Target API policy](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).
- New personal accounts created after 13 November 2023 need a closed test with at least **12 continuously opted-in testers for 14 days**, then a production-access application explaining the testing. Meeting the numbers is not automatic approval. [Personal-account testing](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).
- Owner must complete account/identity/contact/device verification and the applicable registration payment. Google lists a **US$25 one-time registration fee**. No payment or registration was attempted. [Getting started](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en), [real-device verification](https://support.google.com/googleplay/android-developer/answer/14316361?hl=en), [required identity information](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en).
- Review [16 KB page support](https://developer.android.com/guide/practices/page-sizes) for the final bundle and all SDK libraries. The core is JS and the custom bridge Java, but that does not certify transitive native libraries. Inspect the actual artifact and test a 16 KB device/emulator; do not rely on old extension dates.
- Final title, owned package ID, policy URL, contact information, audience declaration, real Android screenshots, signed AAB and all device tests are pending. Production ads are deliberately disabled and require a separate review.

## Store listing draft

**Title:** `[FINAL NAME — at most 30 characters]` (Water Hole remains provisional).

**Short description:** “Grow a tiny whirlpool into a ship-swallowing force in 90-second harbor rounds.”

**Full description:**

Start with a ripple. Finish with a cargo ship.

Guide a hungry whirlpool through a colorful harbor. Collect driftwood and bottles, grow through six stages, and chase bigger boats before your 90 seconds run out. Find a route around docks and islands, avoid the slowing shallows, and try to beat your personal best.

• Short, replayable rounds with six growth stages.
• Touch steering with gentle adjustments and quick reversals.
• A locally stored personal best—no sign-up.
• High-contrast markers, reduced-motion settings and optional sound.
• The harbor is bundled with the app for offline play.

`[IF ADS ARE ENABLED IN THE FINAL REVIEWED BUILD: disclose that optional network connectivity is used for ads/consent and describe between-round ads accurately.]`

The menus support accessibility features; this spatial real-time game does not yet offer fully nonvisual play.

**Category:** Game → Arcade (draft). **Support email / website / privacy URL:** `[OWNER TO SUPPLY]`. No premium benefits, rewards, rankings, revenue or multiplayer claims.

## Art and screenshots

- [ ] Choose/clear final title and replace provisional `com.example.waterhole` before first upload.
- [ ] Review the provisional swirl launcher vector. Produce a final **512×512** store icon and **1024×500** feature graphic consistent with the selected title. Do not ship Capacitor placeholder branding.
- [ ] Capture genuine screenshots from a running Android build on representative phones; include harbor gameplay, late growth, results and accessibility settings. At least two screenshots are required; follow current dimension/aspect/format guidance. Browser emulation images are evidence for web QA, not Android store screenshots.
- [ ] Inspect all localized claims and cropping. Final store graphics are pending naming approval/device build; none are falsely marked complete. [Preview asset requirements](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).

## Declarations for owner review

- [ ] Complete IARC content-rating questionnaire truthfully. The visible game has stylized object/boat swallowing, no chat, gambling or purchases; the rating is assigned by the questionnaire, not this document.
- [ ] Choose the real intended age groups. Colorful art does not establish an audience decision. Review child/mixed-audience requirements before enabling ads; no age-screening solution is implemented.
- [ ] Declare ads according to the final distributable behavior. The debug integration contains test interstitials; release currently disables serving. Reconcile with Console guidance when deciding what build to submit.
- [ ] Publish an owner-reviewed privacy policy and complete Data safety using the actual SDK/configuration and network findings; use ADMOB.md as inputs, not preapproved answers.
- [ ] Inspect Advertising ID and all merged manifest permissions. No camera, microphone, location or storage runtime permission is requested by the shared game; verify transitive SDK manifests.
- [ ] Confirm app access: no login/account needed. Review any other current Console declarations, applicable regional trader/developer-verification requirements, countries, pricing and distribution decisions personally.

## Release sequence

1. Build/install debug after SDK setup; complete the native acceptance matrix, including TalkBack, offline launch, full rounds, best-score restart, lifecycle and test-ad failures.
2. Finalize identifier/title. Create and securely retain the upload key; enroll in Play App Signing; produce a signed **AAB** per ANDROID.md. Debug APKs are for sideload testing and are not this final artifact.
3. Create the app in Console yourself. Supply real support/privacy/identity details and owner-approved listing/declarations.
4. Upload the signed AAB to internal testing. Inspect pre-launch reports, ANRs/crashes, permissions, SDK warnings and install/update behavior. Resolve failures.
5. Run closed testing with real feedback and any personal-account requirements above. Keep evidence of fixes; apply for production access if required.
6. Recheck current policies, API/SDK notices, release signing, versionCode, store assets, privacy, consent and ad readiness. Choose a staged rollout where available, monitor vitals and retain a rollback plan through a corrected higher-version release.
7. Owner approves and submits the final release. No submission or live-ad activation is authorized by this preparation task.
