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
