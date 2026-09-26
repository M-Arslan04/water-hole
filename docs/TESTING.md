# Gameplay improvement verification — 2026-09-24

This report covers the local revision after the initial Vercel launch. **Not deployed.** The 90-second round, six growth stages, art, object scores/XP and suction constants are unchanged. Baseline code was read from Git commit `eb49fb6` and served separately; all playthroughs used ordinary browser input in real time, with read-only diagnostics. No test injected score, XP, position or clock changes.

## Diagnoses and fixes

- **Touch:** a fixed touch-down origin made fast reversals keep steering in the old direction. 58 CSS px of travel, shared 11/s smoothing, 285px/s speed and 5/s camera response compounded the delay. Coordinate conversion is correct; there is no size slowdown. A floating origin plus touch-only tuning resolves this without touching capture force/time.
- **Empty harbor:** the old random replacement pool stops at fishing boats. Consumed tugs/cargo never return. It counts debris toward its 100-object cap and has no target-population policy. There are no entity lifetimes, spawn queues or outside-map entry delays. Population-based fishing/tug/cargo supply now shares a 2s spacing, with separate big-ship delays, safe placements and reserved slots.

Implementation files: `src/config.ts`, `src/input.ts`, `src/steering-rules.ts`, `src/spawning.ts`, `src/game.ts`, and the final-stage objective in `src/ui.ts`. New regression files: `tests/controls.mjs`, `tests/balance.mjs`; additional rules tests in `tests/rules.test.ts`. Exact values are in [TUNING.md](TUNING.md).

## Full rounds and score balance

| Scenario | Score | Captures | Final stage reached | Median FPS | Final 30s valuable ships min / median / max |
| --- | ---: | ---: | ---: | ---: | --- |
| Original game, desktop ship hunter | 11,940 | 160 | 35s | 57.71 | 0 / 0 / 2 |
| Revised game, desktop ship hunter | 18,575 | 155 | 32s | 57.48 | 1 / 2 / 3 |
| Revised game, 390×844 touch ship hunter | 19,320 | 155 | 30s | 55.76 | 1 / 2 / 3 |
| Original existing general-play regression | 12,125 | 162 | 34s | 57.53 | Not instrumented |
| Revised existing general-play regression | 13,760 | 166 | 45s | 58.49 | Not instrumented |
| Revised desktop hunter repeat / final assertions | 18,035 | 151 | 32s | 58.80 | 1 / 2 / 3 |

The final independent desktop repeat passed the arrival-distance, two-second spacing, population-cap, cargo/tug-delay and late-capture assertions as well. Its 18,035 score was 51.0% above the baseline hunter. The production layout round used a fixed-direction touch pattern, finished at 1,940 points / 43 captures / Fishing boat, and successfully replayed; it is not a score-optimized run.

**Material balance change:** dedicated desktop ship chasing increased score **55.6%** compared with the same baseline strategy; the general-play regression increased **13.5%**. These are bots, not predicted human scores. Existing approximate 10,000-point results will become easier to beat, especially for players who reach maximum size early. Existing personal best storage is retained. Review this economy on a real phone before release; this change is not score-neutral.

The first 40 seconds still matter: the revised desktop hunter had 7,240 points at 40 seconds and 12,415 at 60 seconds; only 6,160 of its 18,575 points came in the final 30 seconds. The revised mobile hunter had 8,760 at 40 seconds and 13,600 at 60 seconds; it added 5,720 in the last 30. Early growth unlocks the supply; no free score or round-time multiplier was added.

The initial three-second cargo replacement experiment scored 24,635 and was rejected. The first simple pathfinding test also got stuck behind an island: that result is excluded from balance acceptance. The final driver navigates around obstacles and verifies continued scoring in the last 30 seconds. Frame-dependent capture timing makes repeated seeded-map runs vary; values are observations, not deterministic golden scores.

## Ship supply evidence

The original hunter spent **70/132 sampled late-round states (53%)** with zero fishing-or-larger targets. Both revised hunters had **zero empty samples**, with at least one directly reachable valuable ship in every final-30-second sample (132 desktop samples / 90 touch samples). Sampling was roughly every 220–350ms; this does not claim the absence of every sub-frame gap.

- Final-30-second population never exceeded **27 total objects** or **3 valuable ships** in either revised run. Overall population peaked at 88, below the unchanged hard cap of 100. Open water remains readable.
- Desktop cargo appeared at **61.2, 73.3 and 85.3 seconds elapsed** during the last 30 seconds. Touch cargo arrived at **64.9 and 78.9 seconds**. These are in-map targets, not queued off-screen.
- Cargo absence-to-replacement delays were **8.04–9.81 seconds** across the two runs. Tug delays were **5.00–8.67 seconds**, including shared-slot/cargo priority. Fishing filled supply between them; shortage waits were generally ≤2.02 seconds.
- Every valuable arrival was separated from the previous one by at least **2.000 seconds**. Ships spawned **500–950 world pixels** away with a clear pursuit path, water/route checks, hull spacing and the existing player clearance. Failed placement retries do not bypass those checks.
- The general-play regression reported **zero severe vessel overlaps away from suction**, while reaching and capturing cargo. Locked-cargo resistance passed separately.

Checked-in [compact evidence](PLAYTEST-EVIDENCE.json) contains summaries, late-round checkpoints, every measured arrival, control measurements and smoke inventory. Full sampled trajectories and screenshots are generated under `tests/artifacts/` (Git-ignored):

- [Desktop raw round](../tests/artifacts/balance-paced-ships/results.json), [desktop at 15 seconds](../tests/artifacts/balance-paced-ships/15-seconds-left.png)
- [Touch raw round](../tests/artifacts/balance-mobile-ships/results.json), [touch at 15 seconds](../tests/artifacts/balance-mobile-ships/15-seconds-left.png)
- [Baseline raw round](../tests/artifacts/balance-baseline-ship-chase/results.json)

On a narrow phone some ships lie outside the camera and are visible on the minimap; reachable is not synonymous with currently on-screen. The measured pursuit range is about 1.5–2.8 seconds at full touch speed in open water. This preserves exploration rather than spawning ships directly into the whirlpool.

## Controls and performance

`test:controls` passed at **390×844 with DPR 1, 2 and 3**, plus 844×390 rotation. It exercises a 12px short drag, a 220px long drag, an 80px quick reversal, release and reversal away from the south map boundary. At DPR 2:

| Measurement | Original | Revised |
| --- | ---: | ---: |
| 12px drag velocity | +56.3px/s | +113.2px/s (still proportional) |
| Long drag velocity | +263.9px/s | +338.7px/s |
| 100ms after reversing | **+281.6px/s, wrong direction** | **−278.3px/s, correct direction** |
| 180ms after release | +38.1px/s residual | −4.2px/s residual |
| Reversing away from boundary | Stays pinned | Moves ~84px away within 300ms |

Desktop mouse/keyboard tuning is unchanged. Their existing input, pause, audio, blur, restart and persistence checks pass. Touch capture/movement in the original regression moved 497 world pixels and collected 11 objects. These measurements identify a steering-response issue; desktop FPS was effectively unchanged (~57.5), but they cannot exclude low-end physical-phone rendering problems.

## Checks and production build

- `npm test`: **9 rules tests pass**, including floating reversal, tier gating, supply composition/cooldowns and obstructed arrival rejection.
- `npm run build`: strict TypeScript and Vite production build pass.
- `npm run test:browser`: complete 90-second desktop round; controls, audio, pauses, growth, reef, restart, best persistence, denied storage and mobile orientation pass. Zero browser errors.
- `npm run test:controls`: all three DPR profiles pass; zero errors.
- `npm run test:balance`: real-time desktop/touch scenarios and final-stage-by-40s scenario; population, arrival spacing/delays, late scoring and browser-error checks.
- `npm run test:responsive`: production 90-second touch round at 360×800, results/replay at 11 viewport sizes (320px phone through 1440px desktop), short landscape, browser-height change, rotation, scrolled start and nine-digit display pass. No horizontal overflow or inaccessible replay controls; zero browser errors.
- `npm run test:smoke`: production nested-path serving, no diagnostic global, local/inline requests only, offline play after load, 320px layout, locked cargo and visibility pause pass. Zero browser errors.

Production inventory: **1,267,918 bytes raw / 350,844 bytes summed gzip**, six files. Interactive in **568ms** on localhost. Sampled JS heap **40,812,929 bytes (~38.9 MiB)** and render cadence **58.57 FPS** in the smoke check; this is not peak-device memory measurement. Relative paths and dependency notices are preserved. No new external runtime requests or dependencies.

## Limits and platform separation

No physical Android/iPhone was available. Safari/Firefox/Edge, actual YouTube WebViews, touch latency under thermal load, throttled networks and novice human enjoyment remain unverified. Chrome phone emulation is not physical-phone certification. General-play and skilled-hunter bots are different strategies, not a representative player study.

The SDK is deliberately **not integrated or certified** in this revision. The [YouTube assessment and concrete implementation plan](YOUTUBE-READINESS.md) cover access, packaging, SDK-first loading, readiness signals, full execution pause, host audio, versioned cloud bests, external access, device coverage, metadata, rights and certification. The deployed title is unchanged and remains provisional.

---

# Historical initial-release checks

The following report predates this gameplay revision and is retained for comparison. Its statements about initial deployment status and older settings apply to that earlier build.

# Test report

Tested on 2026-09-24 in local Chrome through Playwright, with visual inspection in the Codex in-app browser. Automated runs use ordinary mouse, keyboard and Chrome touch events. Development diagnostics are read-only: tests never set score, XP, player position or the round clock.

## Mobile responsiveness follow-up — 2026-09-24

The user's 360×800 screenshots exposed a gap in the original coverage: the **finished** screen had not been checked on a narrow viewport. An implicit grid track could expand to the result card's intrinsic width, and the compact mobile shell was removed at the end of a round. Both are now corrected.

`npm run test:responsive` passed against the production build. It completed an actual 90-second touch-driven round at 360×800 (3,015 points, 53 objects, Fishing boat), then checked results and replay at **360×800, 320×568, 390×844, 430×932, 640×800, 568×320, 800×360, 844×390, 768×1024, 1024×768 and 1440×900**. It also checked pause, rotation, a height change from 800 to 660 pixels, starting after scrolling the landing page, and a presentation-only nine-digit score. Game time and progress were not changed by the test.

The phone game frame, canvas, overlay, card and card content were checked independently. There was no horizontal overflow; phone sessions had no vertical page scroll; mute remained a 44×44 touch target; result contents and replay stayed reachable. On the very short 568×320 viewport, the bounded card scrolls internally to expose remaining content. The regular 360×800 card needed no internal scrolling. The mobile result screenshot was visually inspected. There were **zero browser console errors**.

- [Responsive test results](../tests/artifacts/responsive/results.json)
- [360×800 finished screen](../tests/artifacts/responsive/result-360x800.png)
- [320×568 finished screen](../tests/artifacts/responsive/result-320x568.png)
- [800×360 finished screen](../tests/artifacts/responsive/result-800x360.png)

The checked-in Vercel configuration prepares a source build and static output. Actual Vercel account integration, deployment and physical-device testing remain separate release steps; no deployment is claimed.

## Commands and evidence

- `npm test`: six rules tests passed (growth boundaries, progress reset/cap, dock/island/wall exclusion, high-speed movement collision, progression rewards and storage failure tolerance).
- `npm run build`: TypeScript strict checks and Vite production compilation passed.
- `npm run test:browser`: complete real-time round, controls, sound, pause, progression, results, restart, persistence, phone touch and rotation tests. Screenshots and final measurements are in `tests/artifacts/results.json`.
- `npm run test:smoke`: production static subdirectory serving, offline play, 320px layout, locked-vessel resistance, outer-lane camera tracking, visibility events and bundle inventory. Evidence is in `tests/artifacts/smoke-results.json`.

The source default uses installed macOS Google Chrome. Set `CHROME_PATH` for another machine. The smoke test creates and closes a temporary local static server itself; it also uses the running development server for read-only simulation diagnostics. No Playables SDK test suite was run.

## Acceptance coverage

| Requirement | Observed test |
| --- | --- |
| Start and understandable first action | Welcome screen, one Play action, visible controls sentence; interactive hint changes after movement and disappears after three captures. Desktop and phone screenshots inspected. No independent novice study. |
| Mouse and keyboard | Held mouse moved the player more than 50 world pixels; keyboard steering completed a full round using actual input events. |
| Touch | 390×844 viewport at pixel ratio 2; a relative drag moved the whirlpool approximately 400 world pixels and captured objects. Pointer lifted successfully. |
| Phone layout | 390px portrait, 844×390 landscape, and 320×568 portrait; start, HUD, pause and resume accessible; no horizontal overflow. |
| Full loop | 90-second round reached a Cargo ship capture, opened results and restarted without refreshing. Restart resets score, XP and time. |
| Growth eligibility | Bottles/driftwood capture immediately. All six class thresholds have unit coverage; automated round reached the final class. Targeted approach to a locked cargo ship kept it uncaptured. Its padlock and orange resistance outline were screenshot-checked. |
| Reef recovery | Automated path entered shallow water, received a slowdown and subsequently returned to normal water without losing progress. |
| HUD and sound | Score, countdown, growth stage and result data updated. Mute flags and actual AudioContext running/suspended states were asserted after user gestures. No autoplay override in final run. |
| Pause | Pause button and a dispatched window blur event froze the countdown; explicit Resume continued it. A separate dispatched Page Visibility event also paused. Native OS backgrounding on physical phones remains untested. |
| Best and storage | Final score persisted across reload. A context with a throwing localStorage getter still started and captured. Unit test also exercises failed save behavior. |
| Placement and navigation | Seeded spawning rejects scenery/edges and proximity conflicts; geometry tests cover walls/islands/docks. During the full round, no severe ship overlaps were detected away from the suction region. Desktop player stayed on-screen when steering toward the outer lanes. |
| Production/static | Built modules served from `/harbor/` on a plain static server. Production has no debug global and only local/inline asset requests. After initial loading, network disconnection did not prevent movement, captures, score or pause/resume. |
| Errors and performance | Final artifact JSON records browser errors and measured frame rates. Testing covers the busiest opening population and later capture effects. See measurements below. |

## Issues found and addressed

1. Desktop camera initially did not follow vertically on wide, short viewports, which hid outer cargo lanes. The camera now follows on all aspect ratios and remains bounded by the map.
2. An efficient player reached the final growth class too quickly. Later XP thresholds were increased; fishing boats stay early while tugs and cargo require sustained collection.
3. Growth notification reused a panel class, clipping it on mobile. Toast styles now use distinct names and a bounding-box check guards against clipping.
4. Vessel spacing initially used radii smaller than the drawn hull footprint. Safe spawning and yielding now use a larger footprint; loops check ship crowding away from intentional suction convergence.
5. Canvas rendering now accounts for device pixel density up to 2×. A parent ResizeObserver handles layout changes and rotation without a refresh.
6. Phaser's frame limiter produced uneven cadence near 49 FPS on the local high-refresh display. Switching to the engine's 60 Hz timer scheduler yielded approximately 59 FPS in subsequent targeted checks.
7. The intentional offline test exposed Chrome re-requesting the external favicon after load. The icon was inlined in the entry document so it no longer makes a network request.

## Measurements

The final 90-second input-driven run scored **10,430**, captured **148 objects**, and swallowed a **Cargo ship**. Fishing boats, tugboats and cargo unlocked at approximately **8, 16 and 33 seconds** under efficient automated steering. Median measured render cadence was **58.84 FPS**. No severe vessel overlap away from suction and no browser console errors occurred. These measurements describe this desktop test host, not ordinary-phone performance guarantees. The updated static smoke test became interactive in **375 ms** on localhost, used approximately **32.3 MiB of JavaScript heap** in its sampled state, and logged **zero errors**, including after going offline. GPU memory and throttled-network load time were not measured. Exact values are retained below.

- [Full-round machine-readable report](../tests/artifacts/results.json)
- [Production, memory and bundle report](../tests/artifacts/smoke-results.json)
- [Desktop welcome](../tests/artifacts/desktop-welcome.png)
- [Desktop results](../tests/artifacts/desktop-result.png)
- [Phone gameplay](../tests/artifacts/mobile-playing.png)
- [Landscape pause](../tests/artifacts/mobile-landscape.png)
- [320px phone](../tests/artifacts/mobile-320.png)
- [Locked cargo close-up](../tests/artifacts/locked-cargo.png)

## Honest limits

Chrome and the in-app Chromium browser were exercised. No physical Android/iPhone, Safari, Firefox, Edge, low-end GPU, thermal/battery, screen-reader gameplay or long-term soak test was performed. AudioContext behavior was checked, but the tonal balance was not independently audited by listening. There is no offline reload/service-worker cache; play after loading works offline. The single reef type, fixed map and short yielding ship routes are deliberate prototype choices. Perceived fun and first-time learning still need human play sessions. No YouTube integration, portal access, ads availability, certification or release-name clearance is claimed.

## Accessibility / Android preparation — 25 September 2026

See [the current platform report](PLATFORM-REPORT.md) and [accessibility evidence](ACCESSIBILITY.md). Baseline evidence is preserved in PLATFORM-BASELINE.json. The new branch does not deploy the public demo or establish YouTube certification/Android device coverage. The balance test's waypoint stopping logic was repaired; gameplay tuning values were not changed.

### Follow-up: arrow keys and page scrolling

Arrow scroll suppression now runs at window level after Phaser processes keyboard input, and only during active play. It remains effective when focus leaves the harbor for the page or sound button; paused pages and settings retain normal key behavior. The listener is removed on scene shutdown.

Verified with `npm run build`, `node tests/keyboard-scroll.mjs` (development 5188 and production preview 5189), and the accessibility suite. The regression checks actual vertical movement with Up/Down, unchanged page scroll with harbor/body/sound focus, normal paused scrolling, unconsumed settings keys and Space-to-resume.

### Follow-up: keep the status panel off the water (26 September 2026)

The growth panel, minimap, and compact steering tip now occupy a separate grid row below the playfield. The Phaser canvas and camera resize to the remaining water area. Welcome and result screens hide the dock; pause preserves it. Short landscape layouts omit the tip row to preserve water height. No movement, capture, or progression rules changed.

Validation passed: production build; `node tests/hud-layout.mjs` (eight active viewport sizes, high contrast, 200% text, and canvas/dock separation); touch controls at DPR 1/2/3; accessibility suite; and the production responsive suite with a real complete round, pause/rotation, results, long score, and replay. Screenshots and geometry are in `tests/artifacts/hud-layout/`; full-round evidence is in `tests/artifacts/responsive/`.

With owner approval, the updated APK was built, signature-verified, installed, and tested on the Android 16 emulator. All ten runtime checks passed, including a full round (2,695 points), a separate canvas/dock region, rotation, replay, and offline restart with Preferences persistence. See `docs/evidence/android-status-dock-results.json` and the follow-up in `ANDROID-DEVICE-TEST.md`. The previous APK is preserved in ignored `release/water-hole-before-status-dock.apk`.

### Follow-up: compact mobile welcome and separate help (26 September 2026)

The shared mobile welcome now puts the harbor preview, Play, How to play, and personal best in normal document flow. The longer introduction stays on desktop; the detailed instructions and six-stage boat guide are available in a dedicated help dialog from welcome and pause. Touch-capable devices lead with drag instructions, with mouse/keyboard instructions under Other controls. Settings retains preferences and native notices. Short screens and enlarged text scroll naturally.

Production build and `npm run test:welcome` passed: 320×568, 360×740, 390×844, 430×932, short touch landscape, desktop, 200% text, dialog focus/Tab/Escape, and paused-round help. The accessibility and eight-viewport HUD layout suites also passed. The production responsive suite completed a real round, rotation, results, and replay with no console errors. Screenshots and measurements are in `tests/artifacts/welcome/` and `tests/artifacts/responsive/`. These browser checks use Chrome mobile emulation, not Safari or a physical mobile browser.

The Android emulator passed twelve runtime checks, including native Back handling for help, a full round, replay, and offline persistence. Visual inspection also caught and fixed retained pixels in native guide icons by explicitly clearing their canvases. The final APK passed signature verification and targeted native icon/help checks; the final web build passed the welcome suite again. See the compact-welcome follow-up in `ANDROID-DEVICE-TEST.md` for build hashes and exact coverage. No public deployment or physical-phone update was performed.

### Follow-up: fill spare welcome height (26 September 2026)

The mobile welcome shell now fills the dynamic viewport, assigning spare height to the harbor preview. Its 130px minimum preserves a useful preview while the menu can grow and scroll on short screens or enlarged text. Canvas size containment prevents the canvas from forcing its parent track taller as it resizes.

Web and Android builds passed. The welcome browser suite passed all phone sizes, short landscape, desktop, 200% text, help, and play/pause checks; it now asserts the normal-size phone welcome ends 12px above the viewport bottom. Targeted emulator checks and screenshot review also passed: the 731px WebView has its welcome bottom at 719px, with personal best visible at 700px. Evidence is in `docs/evidence/welcome-fill-browser-results.json` and `docs/evidence/android-welcome-fill-results.json`. No full-round retest was needed for this welcome-only CSS change.
