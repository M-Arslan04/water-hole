# Mobile gameplay polish — review report

27 September 2026. Baseline: committed `79b8eda`; candidate: `mobile-playability-polish` branch. Implementation and testing were completed locally before PR preparation. No production deployment, YouTube submission or Android release publication was performed.

- **Production web preview:** http://127.0.0.1:5193/
- Development diagnostics: http://127.0.0.1:5192/ ; YouTube development preview: http://127.0.0.1:5194/
- **[Before/after screenshots and clips](../tests/artifacts/mobile-polish/review.html)** — local ignored artifacts, available on this Mac.
- **[Compact measured evidence](MOBILE-POLISH-EVIDENCE.json)** — tracked results; raw samples are in `tests/artifacts/balance-{before,after}-*/results.json`.

## What changed

### Touch steering

Only one gameplay configuration value changed. Input still uses CSS displacement converted to the capped backing-canvas pixel ratio; DPR does not multiply physical sensitivity. The floating touch origin and exponential response are retained.

| Setting | Before | Candidate |
| --- | ---: | ---: |
| Touch joystick radius | 36 CSS px | **42 CSS px** |
| Touch top speed | 340 world px/s | 340 |
| Touch response | 24 /s | 24 |
| Touch normalized deadzone | 0.06 | 0.06 |
| Effective deadzone | 2.16 CSS px | 2.52 CSS px |
| Touch camera response | 10 /s | 10 |
| Desktop speed / response | 285 / 11 | 285 / 11 |

A 12px drag measured about **113 → 97 world px/s**, 14.3% gentler. A 6px drag measured about 48.5px/s. Long drags reached about 338.6px/s in both versions. An 80px reversal after a long drag produced −248px/s within 100ms at DPR 1/2/3; baseline was approximately −277 to −298px/s. The reversal still responds promptly, but that fixed reverse gesture reaches a little less than full stick travel with the larger radius. Releasing for 180ms reduced residual speed below 5.1px/s; retouching elsewhere moved only 0.11–0.17 world px during the check. No reset or jump was observed. Subjective finger feel remains a physical-phone check.

### HUD and camera

At width ≤650px **or** height ≤550px, score, timer and a 44×44px pause button occupy a separate grid row. The actual Phaser water canvas occupies the middle row; the existing progress/minimap dock remains below it. Normal phone HUD height is 55px. Desktop/tablet layouts outside those breakpoints retain the existing overlay design.

At 390×844 the water is 364×603 CSS px. At 320×568 it is 294×310; at 844×390 landscape it is 818×204. Existing viewport/safe-area handling is retained. Resizing uses the remaining canvas dimensions and preserves round state. Tests navigate to all four world edges and check player visibility/reachability. At 200% root text size the tested layouts remain operable; this is not certification of every OS font-size setting or Safari browser-bar behavior.

### Capture presentation

Eligible objects crossing the outer ring render above the vortex body and below its foam. On capture, the **existing sprite** moves to foreground depth 9, above vortex/foam/particles, and follows a 360ms inward spiral toward the moving whirlpool center while shrinking/fading. Score labels remain above it. Reduced motion uses a 180ms direct inward shrink/fade without added spin.

Scoring and removal from collision happen immediately at the original capture threshold. The presentation cannot score twice. Pause stops capture progress and score-label/arrival tweens; YouTube host pause is covered. Effects are destroyed on completion or replay. No particles were added. The existing 90 seconds, six stages, capture eligibility/radius, XP thresholds, point values, spawn populations, object caps, placement constraints and replenishment delays are unchanged.

### Late-round navigation

The minimap now draws outlined diamonds for existing eligible fishing boats, tugs and cargo ships, a ring around the nearest by **straight-line distance**, and an outline of the current camera view. The phone map is 76×52 instead of 64×44px. Player and target markers have distinct shapes. High contrast and the map's accessible description are supported. The status hint explains the markers after valuable ships unlock; short landscape still hides the hint to preserve water space.

**No spawn adjustment was made.** The ring is a navigation cue, not a route planner: an island can make another ship quicker to reach. Empty views still happen; these changes make existing offscreen targets easier to find rather than promise a constantly full screen.

## Player-relative measurements and score differences

All runs used actual emulated touch input at 390×844, DPR 2, for 90 real-time seconds. The automated strong driver pursues eligible targets; the “average” proxy pauses for 3 seconds out of each 15; the edge proxy plays strongly for 55 seconds, then approaches and lingers near the lower-right edge. These are repeatable behavior probes, **not human skill cohorts**. No clock/position/score/XP mutation was used.

“Valuable” means an eligible fishing boat, tug or cargo ship. Visibility counts its center inside the canvas and outside the old HUD bounding band; this conservatively treats gaps between old HUD controls as obscured. Route distance uses a water-aware waypoint graph around obstacles. Travel estimates divide by 340px/s and exclude acceleration, shallow-water slowing, moving targets and decision time. They are optimistic traversal estimates, not measured human acquisition times. Median/max distance omit samples with no eligible ship.

| Profile | Score before → after | Change | No valuable target visible, final ~30s | Median nearest route, world px | Median full-speed travel estimate |
| --- | ---: | ---: | ---: | ---: | ---: |
| Strong | 19,620 → 20,430 | +4.1% | 10.93s → 10.03s | 398 → 402 | 1.17s → 1.18s |
| Average proxy | 16,625 → 18,265 | **+9.9%** | 4.45s → 6.30s | 350 → 369 | 1.03s → 1.09s |
| Edge proxy | 13,185 → 12,375 | −6.1% | 16.08s → 0s | 793 → 556 | 2.33s → 1.63s |
| Average repeat | 16,805 → 15,940 | −5.1% | 6.68s → 7.42s | 303 → 420 | 0.89s → 1.24s |

The median visible target count was one for active profiles. Edge visibility changed from a median of zero to one on these particular trajectories; this is not proof that the HUD alone caused the whole improvement. Updated maximum route estimates were 2.62s / 2.96s / 1.80s / 2.87s for the four rows. The test's “no target within 8s” condition lasted 2.88s / 1.04s / 0s / 0.52s after, versus 1.05s / 0s / 0s / 0s before. Those intervals were missing eligible ships during replenishment, not finite routes taking over 8 seconds. Brief global supply gaps remain allowed by the unchanged cooldowns.

The repeated average pair also measured elapsed time and player travel from a ship first becoming the nearest route target until its eventual capture: **16 before / 15 after** completed observations; median time **1.53 → 1.80s**, max **6.47 → 4.69s**; median player travel **460 → 531px**, max **1,066 → 1,024px**. These intervals include decision pauses and target switches, omit targets not caught before the round ended, and do not measure uninterrupted pursuit of every ship.

**Score review flag:** +9.9% in one pair is large enough to disclose before shipping. Its repeat was −5.1%; average-proxy mean scores were 16,715 before and 17,102.5 after (+2.3%). There is no evidence here of systematic score inflation, but this sample cannot establish score equivalence or maximum achievable score. The navigation cues and softer steering can change routes even with identical game rules. Human review is required before deployment; nothing is being shipped by this task.

Median FPS was approximately 59 in the first six runs. The recorded average repeat measured 59.01 before and 57.86 after. Max live object count remained 88; placement, 100-object cap, valuable-ship ceiling, cargo/tug delays and arrival-spacing assertions passed. Desktop-host results do not establish performance on low-end phones. These automated drivers know entity positions, so they cannot measure whether humans understand the new minimap better.

## Verification

| Target/check | Result |
| --- | --- |
| Root TypeScript/Vite production build | PASS |
| Rules and focused capture-pose unit tests | PASS, 10 tests |
| Controls | PASS, short/fine/long/reverse/lift/retouch, DPR 1/2/3, portrait/landscape/boundary |
| Focused shared layout/capture tests | PASS, bounds, paused resize state, foreground ownership, effect expiry, reduced-motion capture, high contrast, settings/help, 200% text |
| Four-edge touch camera test | PASS |
| Existing web responsive suite, production build | PASS, phones/landscape/tablet/desktop, complete 90s active touch round, results/replay |
| Existing welcome, accessibility and production smoke suites | PASS, including keyboard/dialog behavior, nested assets, offline play, locked cargo, camera and pause |
| Measured profile rounds | PASS, eight full 90s touch rounds across baseline and candidate; zero recorded console errors |
| Android production assets + debug APK | PASS, JDK 21, Gradle assembleDebug |
| Android policy/isolation/platform tests | PASS, 6 tests |
| Installed Android API 36 emulator APK | PASS, actual launch/touch, HUD/dock bounds, pause score/timer freeze, settings, resume; game visually checked with ADB screenshot |
| YouTube TypeScript/build/package and adapter unit tests | PASS, 6 unit tests |
| YouTube production browser suite | PASS, complete 90s round/replay, nine aspect ratios through 288×1024 and 1600×450, text/settings, mock persistence/audio/host pause, no-SDK fallback |
| YouTube focused active-capture host pause | PASS, frozen capture pose and score, completion after resume |
| YouTube host edge-case suite | PASS |
| YouTube runtime network/CSP checks | PASS under the existing test SDK mock; no unexpected external game calls |
| Physical Android / iPhone / live YouTube host | **Not performed** in this pass |

Local YouTube gameReady measured 276.6ms; maximum of 93 sampled heaps was 36,580,588 bytes. These are local observations, not phone/host performance certification. The SDK mocks remain in tests. Android lifecycle/storage/audio/advertising adapters and YouTube SDK adapters were not modified. The separate YouTube target still omits the ordinary web landing page.

Updated local YouTube ZIP: 7 files, 1,395,652 uncompressed bytes, 367,288 compressed bytes. SHA-256: `c6cb0add76a98cbe97fea265c29f2c6c5f50cec69cd443c03ec14354f67e6349`. The existing large Phaser chunk warning remains; no new engine dependency was added.

Updated test APK: `apps/android/android/app/build/outputs/apk/debug/app-debug.apk`. Installed only on the emulator; no physical phone was connected. The emulator's stored personal best was retained. A WebView CDP screenshot omitted GPU canvas contents, so the delivered Android image uses the actual ADB framebuffer capture instead.

## Short phone test with friends

1. Use the updated local build or updated debug APK. The live Vercel site still has the old version. On an existing same-signature APK installation, install as an update to retain the best score.
2. Make tiny drags around bottles, then a long drag and quick reversal. Lift and retouch elsewhere. Confirm it feels gentler without making ship chasing sluggish.
3. Play a full 90s round. Visit all edges, rotate once, pause/resume, open settings, finish and replay. Score/timer/pause and the lower dock must never cover the water. Check browser bars and the device cutout as well.
4. Watch a small and a large capture with reduced motion off, then on. Confirm objects remain visible over the vortex and pause freezes the effect.
5. During the last 30s, use the map's diamonds and nearest ring. Record final score, phone/browser, confusing markers, prolonged empty views, and any frame drops. Try two comparable rounds per version; individual routes vary.

Also check high contrast and the phone's larger text setting. Physical Android and iOS Safari safe-area/browser-bar behavior, real-device frame pacing and human score balance remain outstanding.

## Changed files and reproduction

Runtime: `src/config.ts`, `src/game-layout.css`, `src/game.ts`, `src/ui.ts`, new `src/capture-visual.ts`, new `src/minimap.ts`.

Tests: `tests/controls.mjs`, `tests/rules.test.ts`, new `tests/mobile-polish.mjs`, `tests/camera-edges.mjs`, `tests/mobile-runs.mjs`.

Documentation: this report, `MOBILE-POLISH-EVIDENCE.json`, updated `TUNING.md`, historical-version note in `YOUTUBE-VERIFICATION.md`. Generated artifacts and package outputs remain ignored.

Focused test commands (development preview required for readonly diagnostics):

```sh
TEST_URL=http://127.0.0.1:5192/ node tests/mobile-polish.mjs
TEST_URL=http://127.0.0.1:5192/ node tests/camera-edges.mjs
TEST_URL=http://127.0.0.1:5192/ PROFILE=strong RUN_LABEL=after node tests/mobile-runs.mjs
TEST_URL=http://127.0.0.1:5192/ PROFILE=average RUN_LABEL=after node tests/mobile-runs.mjs
TEST_URL=http://127.0.0.1:5192/ PROFILE=edge RUN_LABEL=after node tests/mobile-runs.mjs
TEST_URL=http://127.0.0.1:5194/ YOUTUBE=1 node tests/mobile-polish.mjs
```

For paired comparison, run the same profile driver against the isolated `79b8eda` baseline at port 5191, with `RUN_LABEL=before`. Set `RECORD_CAPTURE=1` to retain a round video. Older raw runs predate the added observed-capture interval metric; the repeated average pair includes it.
