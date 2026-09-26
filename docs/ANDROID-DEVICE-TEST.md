# Existing APK validation — 26 September 2026

Tested the owner's existing `apps/android/android/app/build/outputs/apk/debug/app-debug.apk`, built at 10:39. No APK rebuild, Capacitor sync, Gradle upgrade, commit, push, or deployment was performed during this validation.

SHA-256 before and after testing:

```text
f43dcd7052324249adb1582f88c70d7769aa4789850bb234ff5f09bf4ecfc5ef
```

## Package and host checks

- APK signature verified (v2), ZIP integrity verified, and `zipalign -c -P 16 4` passed. No packaged `.so` libraries.
- Application name Water Hole; provisional package `com.example.waterhole`; version 0.1.0 (1); minimum API 24; target/compile API 36; debug build.
- All 11 packaged web files matched the synced local assets byte for byte. No remote game URL is configured.
- Merged manifest uses Google's demo AdMob app ID. Live ads are not enabled by this test.
- All six existing Android host tests passed: JVM frequency policy, web/native separation, bundled assets, patched CLI dependency, mocked Preferences persistence, and mocked lifecycle behavior.

## Runtime checks

Created `Water_Hole_API_36`, a Pixel 7 profile with Android 16 / API 36 Google APIs ARM64 revision 7. Installed the exact APK above using ADB. No personal phone was connected or modified.

The default graphics backend failed to create display surfaces on this Mac. The working emulator used SwiftShader software graphics, 3 GB memory, audio output disabled, and a 360×800 / 160 dpi test override. This is a functional test environment, not a phone performance benchmark.

`ANDROID_SERIAL=emulator-5554 node tests/android-device.mjs` passed:

1. Android WebView launch with the bundled production game and no development diagnostic API.
2. Settings, contrast, reduced motion, and bundled license notices.
3. Touch drag moves the player's minimap marker; round timer advances.
4. Pause freezes the timer. Home/background and foreground return to a paused round.
5. Android Back pauses gameplay; Back closes settings without resuming.
6. Portrait/landscape rotation preserves the round and has no horizontal overflow.
7. Full timed round: **2,780 points, 67 captures, biggest catch Fishing boat**. Elapsed wall time was 141 seconds including deliberate pauses and emulator overhead; this is not a timing/performance certification.
8. Replay starts another round.
9. Wi-Fi and mobile data disabled: process restart, stored best score, mute/contrast/motion persistence, and starting another round all passed. Networking was restored afterward.

An additional settled-rotation check verified the landscape Resume button lies entirely within the WebView (755×308 viewport; button x=204.5, y=200.23, width=346, height=54). The first rotation screenshot was taken before Android's compositor settled; the follow-up screenshot renders the full landscape layout correctly.

No AndroidRuntime crash was recorded. The attached WebView test recorded no uncaught page errors. Earlier native logs did contain a nonfatal Capacitor `SystemBars.java` warning when safe-area CSS was injected before the document element existed. Native insets and the tested layouts remained usable; retain this warning for dependency follow-up rather than claiming completely clean startup logs.

## Evidence and remaining checks

Reproducible test: `tests/android-device.mjs` (never builds or installs an APK). Screenshots and machine-readable results are in ignored `tests/artifacts/android-device/`. A copy of the runtime results is in `docs/evidence/android-device-results.json`.

Still unverified: audible sound, real-device performance/thermals/touch feel, TalkBack and other assistive technology, additional Android versions/device sizes, and actual rendered AdMob/UMP consent flows using an owner-configured test application. Existing demo IDs are not proof of completed consent/ad integration validation. This APK remains a debug testing artifact, not a signed store release.

The emulator was left open at the welcome screen with default game visual settings and networking restored. Its high score reflects the automated test run. Audio output remains disabled for this emulator session.

## Follow-up: separate status dock — 26 September 2026

After the owner identified boats hidden behind the bottom HUD, the shared UI now reserves a separate row for progression, minimap, and a compact steering tip. Phaser resizes its actual canvas to the remaining water area; the bottom bar no longer overlays boats. Gameplay rules are unchanged.

The owner explicitly approved rebuilding and installing this update after reviewing the browser checks. Updated APK SHA-256:

```text
341f66d4688f5454ba9b2c3fcccaa555446ecb479c9b0735cf832a4b58738f26
```

Build and signature verification passed. All six native host tests and all ten updated device checks passed, including the non-overlapping dock, touch movement, rotation, full round (2,695 points; 122 seconds wall time including pauses), replay, and offline restart with persisted score/settings. Results are preserved in `docs/evidence/android-status-dock-results.json`; the screenshot folder now contains this latest test run. The earlier six-host/nine-device report above applies to its original APK hash.

The original APK is retained at ignored `release/water-hole-before-status-dock.apk`. The updated build is at the usual `apps/android/android/app/build/outputs/apk/debug/app-debug.apk` path and installed on `Water_Hole_API_36`. The same emulator, audio, real-phone, assistive-technology, and AdMob validation limitations still apply.

## Follow-up: compact welcome and touch-first help — 26 September 2026

With owner approval, the phone welcome was shortened and a separate How to play dialog added to welcome and pause. Touch instructions appear first; alternate controls expand on demand. Desktop retains its longer introduction. The same shared layout serves the mobile browser and Android.

The first updated APK (`9db9328649eec65ec90842d77818541f1ada9501310971b147d1b5dc49c1fa00`) passed all six native host checks and twelve emulator runtime checks. New checks verify that personal best fits on the welcome screen, touch help opens, Android Back closes help, and help preserves a paused timer. The full round scored 4,465 points in 127 seconds wall time including deliberate pauses, followed by replay and offline restart with persisted preferences. No uncaught WebView errors were recorded. Evidence: `docs/evidence/android-compact-welcome-results.json`.

Visual review found retained cargo artwork behind small guide icons in this Android WebView. Explicitly clearing each icon canvas fixed it. The final build was signature-verified, installed, and passed targeted native pixel checks plus the browser welcome suite. Final APK SHA-256:

```text
2ef3ba67a227854dab66df495e3528e16fd54ecf2b7190dc967dfb7f5deb54c5
```

Reproducible final check: `ANDROID_SERIAL=emulator-5554 node tests/android-welcome.mjs`. Evidence: `docs/evidence/android-welcome-visual-results.json`, `tests/artifacts/android-device/help-icons-corrected.png`, and `welcome-final.png`. The full round was not repeated after the isolated icon-clear change. The emulator is left on welcome with default visual settings, networking restored, and the owner's existing 15,870 best score preserved. No physical phone was modified; installing the new APK is required to see this update there. No public web deployment was performed.

### Welcome height adjustment

The next owner-approved update removes the unused area below the welcome card by allowing the harbor preview to grow. APK SHA-256: `02eb48c62bdeca5a5346291bd8e6d5765bb081de685d2d80e10546d78a8b2b57`. Build, emulator installation, targeted native layout/help/icon checks, and visual review passed. The welcome ends 12px above the WebView bottom; all menu controls remain visible. The emulator is left on welcome with the owner's 16,740 best preserved. The phone and public website were not updated. Evidence: `docs/evidence/android-welcome-fill-results.json`.
