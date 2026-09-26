# Water Hole

An original, playable 90-second harbor arcade prototype. Steer a whirlpool, draw in small objects, grow through six sizes, and work toward swallowing a cargo ship. Built with TypeScript, Phaser 3 and Vite. All visual assets and sound effects are generated locally from source; there are no runtime third-party requests, accounts or backend services.

**Working title only:** the naming search found an indexed Android title with the same name. See [release readiness](docs/YOUTUBE-READINESS.md#working-title-check).

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm. From a fresh checkout:

```sh
cd /Users/codingcops/Documents/AAA/water-hole
npm ci
npm run dev
```

Open http://127.0.0.1:5178. The server is bound to the local computer. Dependencies need an internet connection for installation; gameplay does not need the network once loaded.

## Production build

```sh
npm run build
npm run preview
```

Open http://127.0.0.1:4178. Deploy the **contents of `dist/`** to any static HTTP host. `index.html` belongs at the host's game root. Relative asset URLs support subdirectory hosting. Use HTTP rather than double-clicking `index.html`: browser ES modules do not reliably load over `file://`. This is a static game; the local development/preview server is only a file server, not a game backend.

## Controls and loop

- **Mouse:** hold the primary button anywhere in the water. The whirlpool steers toward the cursor; release to stop. Mere hovering does not move the player. This avoids accidental motion when reaching for pause or mute.
- **Keyboard:** WASD or arrow keys. Escape pauses/resumes.
- **Touch:** press anywhere on the water and drag from that point. A floating joystick follows long drags and controls direction and speed; lift to stop. Begin your gesture below or beside the whirlpool to keep it visible.
- **Pause:** upper-right pause button. Losing window focus or hiding the tab pauses the round, including audio. Resume explicitly.
- **Sound:** top navigation speaker button. Synthesis starts only after interaction. All essential feedback also appears visually.

Collect bottles and driftwood first. A padlock above a vessel means it is too big; near the whirlpool it also gains a resisting orange outline. A green dot means it can be captured. The growth bar shows the next class; the bottom-right map shows you and larger targets. Pale dotted reef areas slow movement but never remove score or growth. At 90 seconds, see score, catch count, biggest catch and local personal best. Restart without reloading. Storage failures never block playing.

## Source map

| File | Responsibility |
| --- | --- |
| `src/config.ts` | Documented tuning, growth ladder, entity definitions, map obstacles and reefs |
| `src/rules.ts` | Pure growth, water boundaries, collision-safe movement and seeded randomness |
| `src/game.ts` | Round lifecycle, spawning, simulation, capture effects and camera |
| `src/input.ts`, `src/steering-rules.ts` | Mouse, keyboard and floating touch steering |
| `src/spawning.ts` | Stage-aware valuable-ship deficits and reachable arrival checks |
| `src/art.ts` | Original Canvas-drawn harbor, boats, whirlpool, icons and particle textures |
| `src/audio.ts` | Original Web Audio sound effects, gesture initialization and mute/pause |
| `src/ui.ts`, `src/style.css`, `src/responsive.css` | Responsive HTML interface, HUD, minimap and accessible buttons |
| `src/platform.ts` | Browser persistence/focus adapter; accepts asynchronous storage implementations |
| `src/main.ts` / `src/bootstrap.ts` | Web adapter entry / shared Phaser startup and resize handling |
| `tests/` | Rules, real-time browser playthrough and production checks |
| `docs/` | Initial plan, tuning, actual test report, and separate Playables readiness |

The platform adapter, scene lifecycle methods and audio controller are the extension points for a later SDK integration. The current readiness report includes a concrete separate-build implementation plan, including Phaser visibility hooks and cloud-save load gating. The prototype deliberately does not import, simulate or claim compliance with the YouTube SDK. The adapter still needs SDK-specific lifecycle/audio wiring and initialization work; game rules and rendering can stay unchanged.

## Tests

```sh
npm test
# Keep npm run dev running in another terminal:
npm run test:browser
# After npm run build, with npm run dev still running:
npm run test:smoke
npm run test:controls
npm run test:balance
# With npm run preview serving the production build:
npm run test:responsive
```

Browser tests use Playwright with installed Google Chrome on macOS. On other systems, set `CHROME_PATH` to your Chrome/Chromium executable. `TEST_URL` overrides the development URL; `PRODUCTION_URL` overrides the production smoke URL. The smoke test serves the production bundle on a temporary local port by default and closes that server afterward. Tests save screenshots and JSON results in `tests/artifacts/`. The full gameplay test uses real pointer, keyboard and touch events for an actual 90-second round; it never modifies score, player position or time. Read-only diagnostics are present in development and removed from production.

## Vercel deployment

The repository includes `vercel.json` and `.vercelignore`. Import the directory containing this game's `package.json` into Vercel; it builds with `npm run build` and publishes `dist`. No environment variables or backend are required. See [the Vercel launch guide](docs/VERCEL.md) for root-directory selection, preview deployment and release checks. This preparation does not publish a deployment.

Advanced stages replenish capturable ships at safe, reachable locations, with separate tug/cargo delays to preserve scoring balance. The final stage becomes a ship-chasing score challenge. See the tuning notes and measured full-round comparisons before releasing this revision.

The mobile layout keeps play, pause, results and replay inside the same viewport. Cards wrap within the available width, short screens allow internal scrolling, and the shell follows dynamic browser height and safe areas. Run `npm run test:responsive` against the production preview to exercise a full mobile round and the result-screen viewport matrix.

## Prototype scope

One map, one reef hazard type, eight object types and six growth stages. Ships use short, predictable routes with yielding rather than navigation AI. Mobile emulation is not a substitute for real iPhone/Android testing; wider browser, accessibility and novice-player research remain. The standalone web build has no offline reload cache, cloud save, ads, account system, multiplayer, YouTube SDK integration or YouTube certification. The separate Android target bundles assets locally and includes disabled-by-default-for-release test-ad code; it is not yet device-validated.

See [tuning](docs/TUNING.md), [test evidence](docs/TESTING.md), and [Playables readiness](docs/YOUTUBE-READINESS.md).

## Accessibility and native preparation

The browser entry remains independent of native dependencies. Settings provides high contrast and reduced decorative motion; mute and preferences persist. How to play is available from welcome and pause, with touch-first instructions on touch devices and expandable alternate controls. The mobile welcome keeps Play and personal best visible on standard phone screens, while short screens and enlarged text can scroll. Menus support keyboard navigation and state announcements. Spatial gameplay is not fully nonvisual.

- [Review report and verification limits](docs/PLATFORM-REPORT.md)
- [Accessibility changes and future nonvisual mode](docs/ACCESSIBILITY.md)
- [Android Mac setup, APK and signed AAB steps](docs/ANDROID.md)
- [AdMob test boundary and owner setup](docs/ADMOB.md)
- [YouTube application and naming draft](docs/YOUTUBE-APPLICATION.md)
- [Google Play submission package](docs/GOOGLE-PLAY-SUBMISSION.md)
- [Privacy policy draft](docs/PRIVACY-POLICY-DRAFT.md)
- [Later iOS assessment](docs/IOS-ASSESSMENT.md)

Run `npm run test:accessibility` against the development server. Android is an independent package in `apps/android`: run `npm ci --prefix apps/android`, then `npm run sync --prefix apps/android`. It requires Node 22+; native compilation additionally needs Android SDK 36 and JDK 21. No Android dependencies are required for root `npm ci && npm run build` or Vercel.
