# YouTube preparation verification — 26 September 2026

Local macOS / Google Chrome 149 testing. Touch and device sizes below are Chrome emulation, **not physical-phone testing or YouTube Android/iOS certification**. Android APK was regression-built, not installed onto a physical device during this task. No changes were deployed.

| Check | Result |
| --- | --- |
| Root web production build | PASS |
| Existing rules suite | PASS, 9 tests |
| Android native-policy / isolation / platform suites | PASS, 6 tests |
| Android debug APK build | PASS, Gradle assembleDebug, installed JDK 21 / Android SDK; no publish/install |
| Deployed Vercel welcome | PASS, `TEST_URL=https://water-hole.vercel.app/ npm run test:welcome`; compact mobile welcome, text scaling, help, desktop layout |
| Existing web complete-round browser suite | PASS, real-time keyboard round, mouse, emulated touch, pause/blur, restart, storage-denied path and persistence; zero console errors |
| Existing web accessibility suite | PASS, focus/keyboard/dialogs, high contrast, reduced motion, persistence, 200% root text and accessibility-tree labels |
| Existing web controls suite | PASS, touch DPR 1/2/3, reversal/release and boundary behavior |
| Existing web responsive suite | PASS, phone, landscape, tablet, desktop, results/replay and long-score layout |
| Existing web production smoke | PASS after supplying the active development-server port; nested assets, disconnected network play, locked cargo, camera visibility and browser pause |
| YouTube production build/package | PASS |
| YouTube adapter unit suite | PASS, 6 tests; no SDK, load ordering, schema migration, bad/future/rejected loads, failed-write retry, score consistency, pause and concurrent saves |
| YouTube production browser suite | PASS, official CSP plus local SDK mock; complete 90-second round, replay, touch/mouse/keyboard, settings, Escape, host pause/resume, resized gameplay/results, no-SDK fallback |
| YouTube host edge cases | PASS, early and duplicate events, initial mute/audio transitions, frozen state, denied resume/settings actions during pause, browser visibility ignored, prior user/menu pause preserved |
| Strong-round supply/balance | PASS, 90.138 sec, 18,305 points, 132 captures, 59.25 median FPS, late minimum/median valuable ships 1/2, zero empty valuable-ship samples, max 88 objects |
| YouTube runtime network | PASS observed: local assets and official SDK endpoint only; no unexpected external calls |
| Isolation and production diagnostics | PASS: no native/ad boundary in YouTube; no YouTube APIs in web/Android bundles; development diagnostics absent from production |
| Official public bundle analyzer | PASS: published Python sample executed locally; empty report indicates no size/count/name violations |
| Official interactive suite | NOT YET VERIFIABLE: public page had empty article/no usable controls; no portal release test link available |
| Real YouTube services / phones / iOS | NOT YET VERIFIABLE; mock SDK and desktop Chrome are not substitutes |

The first smoke invocation completed its production checks but could not reach its default development port 5178. Re-running with `TEST_URL=http://127.0.0.1:5188/` completed the suite. This was a test-server configuration issue, not a game fix.

## YouTube observations

- Viewports: 288×1024, 360×840, 360×640, 600×800, 700×700, 800×600, 960×540, 1260×540, 1600×450. These cover the nine documented ratios. Checked welcome/help and playable-area/dock boundaries; extreme result-card buttons remain reachable. Resize did not restart the round.
- Enlarged text: 200% root font scaling; welcome/help/settings controls reachable. This is not proof for every OS/browser text-size mechanism.
- Readiness sequence: firstFrameReady with visible loading message → cloud load → gameReady with enabled Play and rendered harbor. Locally gameReady was at 343 ms; this is not a constrained-network or ingested-host result.
- Heap: 93 CDP samples, largest 37,081,868 bytes (~35.36 MiB). Sampling is not proof of an absolute peak or mobile memory compliance.
- Mock persistence: settings saved, best advanced from 100 to 235, reported best values matched persisted data. Browser localStorage/sessionStorage and navigator.language/languages getters were made to throw; game completed without accessing them.
- Host pause: timer and canvas pixels stayed fixed, audio suspended, DOM/input attempts blocked, resize deferred; resuming an already user-paused/menu-paused round did not start it automatically.
- Production and host tests use SDK mocks clearly confined to test code. A separate development strong-run used the official SDK's off-host local behavior.

## Artifact inventory

`release/water-hole-youtube.zip` contains 7 files totaling 1,392,148 uncompressed bytes; ZIP is approximately 366 KB. Largest file is Phaser at 1,208,149 bytes. All mandatory local size/count/name checks pass; Phaser exceeds the recommended 512 KiB per-file target. Exact SHA-256 and compressed length are regenerated into `release/youtube-package-report.json` by packaging.

Raw ignored artifacts: `tests/artifacts/youtube/{browser.json,host.json,replay.png,official-suite-attempt.json,official-bundle-report.txt}`, `tests/artifacts/balance-youtube/results.json`. Compact tracked evidence is in [YOUTUBE-EVIDENCE.json](YOUTUBE-EVIDENCE.json). The public documentation page's own analytics traffic is not game traffic and is not part of the package network result.

See [audit](YOUTUBE-AUDIT.md) for exact requirement URLs, before/after findings, name/licence decisions and invitation-stage blockers. No gameplay/scoring configuration changed.
