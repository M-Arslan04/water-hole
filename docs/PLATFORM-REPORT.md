# Water Hole platform preparation — review report

25 September 2026 · branch `accessibility-android-preparation` · baseline `bde0d09`.

**Historical snapshot:** this report describes the initial preparation pass. Subsequent work installed the SDK, built a debug APK, validated it on an Android emulator, and refined the shared mobile UI. See [Android device testing](ANDROID-DEVICE-TEST.md) and [testing follow-ups](TESTING.md) for current evidence and remaining release requirements.

**The shared web implementation, independent Android project and submission drafts are ready for code review. Android is not store-ready: no APK/AAB was produced because the SDK is missing.** Nothing was committed, pushed, deployed, published, signed, paid for or submitted in this pass. No live ads were requested.

## What changed

| Area | Files / outcome |
| --- | --- |
| Shared boot and browser boundary | `src/bootstrap.ts`, `src/main.ts`, `src/platform.ts`: one game with separate browser/native entry points; root Vercel build stays independent |
| Accessibility | `src/accessibility.ts`, `src/accessibility.css`, `src/ui.ts`, `src/input.ts`, `src/game.ts`: settings/instructions, focus and keyboard fixes, restrained announcements, persistent contrast/motion/mute, larger essential text, shape-coded harbor |
| Native app | `apps/android/`: separate package/lock/Vite config, generated Gradle wrapper/project, Preferences and app lifecycle/back handling, local asset bundle, provisional swirl icon/splash, API 36 target/min 24 |
| Ads | Native Java `WaterHoleAdsPlugin` + `AdBreakPolicy`; UMP permission gate, privacy choices, official test interstitial only at qualifying replay; release requests disabled |
| Tests | `tests/accessibility.mjs`; corrected waypoint stopping/clearance in `tests/balance.mjs`; native Java policy and mocked TypeScript adapter tests; bundle separation/local asset checks |
| Release hygiene | `.gitignore`, `.vercelignore`, README/notices: exclude native package from Vercel, ignore outputs/signing secrets; native dependency notices generated locally |
| Owner packages | YouTube application/naming, Android setup/signing, accessibility/nonvisual plan, AdMob/privacy, Play listing/checklist and iOS assessment linked below |

Verified byte-identical against baseline: `src/config.ts`, `src/rules.ts`, `src/spawning.ts`, `src/steering-rules.ts`, `src/art.ts`, `src/audio.ts`. Ninety-second timing, six thresholds, scoring, suction forces, steering values and ship-supply values were not retuned. Scene changes concern presentation and menu/lifecycle integration.

## Verification

Host: macOS 26.3.1 (a); installed Google Chrome 149.0.7827.156 driven by Playwright. Browser tests use real input and real time with read-only development diagnostics. Phone sizes/DPR are **emulations**. Java 21 was used for the standalone ad-policy test. Native CLI 8.5.2 / App 8.1.1 / Preferences 8.0.1; native commands ran with host Node 25.2.1 (Node 22+ required).

| Check | Baseline | After implementation |
| --- | --- | --- |
| `npm run build` | Pass, standalone `dist/` | Pass, no native dependency required |
| `npm test` | 9 passed | 9 passed |
| `test:browser` | Pass; 90-second round, 15,205 points, cargo, median 58.90 FPS | Pass; final full round/replay/storage/mouse/touch/audio/blur suite; no console errors |
| `test:responsive` | Pass | Pass; actual 90-second production mobile round and 11 viewport sizes, long-score/result/replay layout |
| `test:controls` | Pass DPR 1/2/3 | Pass; short steering ≈113 px/s, long ≈339, reversed within 100 ms, near-stop within 180 ms; ≈58.7–59.1 FPS |
| `test:smoke` | Pass | Pass; nested URL, local-only requests, production diagnostics absent, offline continuing play, locked ship, viewport/visibility checks |
| `test:balance` | Failed driver assertion after bot stalled near scenery | Corrected driver + EXPECT_SUPPLY=1 passed: 17,505 points, stage 6 at 35s, 90.213s duration, 58.66 median FPS; no late samples without a valuable target |
| `test:accessibility` | New suite | Pass: keyboard controls/focus, pause semantics, saved settings, reduced motion, restrained announcements, 200% text reflow, touch sizes, accessible tree |
| Android `build` / `sync` | Not present | Pass TypeScript/Vite and copy to local native assets |
| Android host tests | Not present | 6 passed: actual Java ad policy, mocked Preferences/lifecycle, web isolation, asset identity, CLI UUID compatibility |
| Android Gradle `assembleDebug` | SDK absent | Blocked at dependency/task setup: `SDK location not found`; no native Java compilation or APK |
| Native dependency audit | Not present | 0 reported vulnerabilities after a CLI-only patched UUID override; no guarantee about untested native SDK runtime |
| Emulator / physical Android | Unavailable | Not tested |
| VoiceOver / TalkBack | Not validated | Not tested; Safari computer-use access was denied, and no Android device was available |

Scores are not balance benchmarks: real-time test drivers vary with frame/input timing. The broad browser driver's final run scored 3,805 and stopped finding useful routes late (the suite still completed/replayed and passed its assertions); an earlier after-change run scored 16,775 with cargo. The dedicated corrected balance driver is the useful late-supply check. Its change fixes waypoint steering, not game physics. Baseline failure and final samples are retained rather than hidden.

Web bundle: **1,267,918 → 1,278,025 raw bytes**; summed per-file gzip **350,844 → 353,859 bytes**. Phaser's chunk is unchanged. Final production smoke measured about 59 FPS in its live segment and about 34 MB reported JS heap. These host measurements do not predict low-end Android performance.

`PLATFORM-BASELINE.json` preserves baseline reports and the driver failure; `PLATFORM-REPORT.json` records current summaries. Screenshots/raw samples are local, ignored artifacts in `tests/artifacts/`; rerun commands to regenerate after checkout. The native build failure is preserved in `docs/evidence/android-build.txt` and host tests in `docs/evidence/android-host-tests.txt`.

## Material limits / owner decisions

1. Install Android SDK/Studio, then compile and exercise both debug and release on an emulator and physical phone. Native plugin/API correctness, WebView audio, consent forms, actual test-ad display, offline cold launch, insets and process behavior are **unverified on Android**. Host mocks cannot establish these.
2. Complete manual screen-reader and low-vision testing. Menus are improved; continuous spatial play still needs vision. The future nonvisual design has explicit user-test criteria.
3. Choose/clear a final title and owned package ID. Provisional `com.example.waterhole` is not for publication. Genuine Android screenshots and final store graphics remain pending.
4. Supply owner/account/contact/privacy/audience information yourself. Review child/mixed-audience requirements before any ad activation. Default demo consent configuration can safely yield no ad; testing configured UMP messages requires an owner-controlled AdMob app.
5. Review actual native dependency permissions, privacy disclosures, 16 KB compatibility, signing and current Console requirements after a build exists. No certification, revenue, account approval or store acceptance is implied.
6. Review and deploy the web changes separately if approved. The supplied public demo remains the old deployment; application claims must match what is actually live.

## Deliverable index

- [YouTube application and preliminary names](YOUTUBE-APPLICATION.md)
- [Accessibility implementation, evidence and future nonvisual plan](ACCESSIBILITY.md)
- [Exact Mac setup, debug install and signed AAB workflow](ANDROID.md)
- [AdMob test code, privacy choices and owner activation checklist](ADMOB.md)
- [Privacy policy template requiring owner review](PRIVACY-POLICY-DRAFT.md)
- [Play listing draft, assets, testing and submission checklist](GOOGLE-PLAY-SUBMISSION.md)
- [iOS feasibility, costs, Xcode and review requirements](IOS-ASSESSMENT.md)

Local review preview: `http://127.0.0.1:5189/` while the preview process remains running. To restart: `npm run build`, then `npm run preview -- --port 5189`.
