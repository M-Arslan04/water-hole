# YouTube Playables audit — 26 September 2026

Scope: baseline `main` at `4adc327`, public https://water-hole.vercel.app/, and the new local `youtube-playables-preparation` target. No push, deployment, form submission, portal upload, ad activation or rename was performed. This is engineering evidence, not certification or rights clearance.

**Interest form: technically ready to present the live demo**, after the owner supplies truthful company/contact/usage information and confirms the form's rights statements. **Developer Portal certification: not ready to claim compliance or submit yet.** Local integration and packaging are implemented; the actual host/device matrix, official interactive suite, final metadata and rights/name decisions remain outstanding.

## Access stages and sources

The [official overview](https://developers.google.com/youtube/gaming/playables) links a public interest form for consideration. The [Developer Portal guide](https://developers.google.com/youtube/gaming/playables/developer_portal) describes invitation-only access, an onboarded channel and suitable channel permissions, then releases, verification and certification. A public Vercel demo and an Android APK do not establish portal access. There is no documented guarantee of invitation, acceptance, revenue or a response time. The supplied playables.in article was background only; it is not the authority for these conclusions.

Official English requirements were checked on 26 September 2026, including design/integration pages updated 25 September. The normative requirement text takes precedence over automatic page summaries: the stability page's summary and its initial-bundle paragraph differ. This audit uses the latter.

## Architecture and isolation

| Distribution | Entry and adapter | Persistence / lifecycle | Output |
| --- | --- | --- | --- |
| Existing web | `src/main.ts`, `src/platform.ts` | Browser storage, browser blur/visibility | `dist`; current Vercel configuration unchanged |
| Existing Android | `apps/android/src/main.ts`, native platform adapter | Capacitor Preferences / native lifecycle; existing native ad boundary | `apps/android/dist`, Android debug APK |
| New YouTube | `apps/youtube/index.html`, `src/main.ts`, `src/platform.ts` beneath that target | `ytgame` host events and cloud save; session-only fallback | `apps/youtube/dist`, `release/water-hole-youtube.zip` |

All reuse `src/game.ts`, `src/config.ts`, `src/art.ts`, `src/audio.ts` and shared UI. Gameplay, scoring and spawn configuration are unchanged. Shared changes are optional boot/UI hooks, defaulting to existing behavior. The YouTube build alone disables Phaser's automatic visibility handler and localStorage feature probe, uses explicit English number formatting, removes landing-page content/home navigation, and hides local overall mute. The guarded build-time engine adaptation fails if the expected Phaser source changes; review it during engine upgrades. No dependencies were added.

## Findings

PASS means supported by the specified local source/test scope, not YouTube approval. FAIL includes an unmet recommendation, identified explicitly. NOT YET VERIFIABLE identifies missing host, human, device or ownership evidence. Web baseline failures below describe suitability as a **YouTube package**, not defects in the public browser product.

| Category / finding | Baseline → YouTube result | Evidence and official requirement |
| --- | --- | --- |
| SDK and readiness | FAIL → PASS locally | `apps/youtube/index.html` loads official v1 before the module. `apps/youtube/src/main.ts` paints loading text before firstFrameReady and waits for interactive scene rendering before gameReady. Production mock test verifies order. [Integration](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration), [getting started](https://developers.google.com/youtube/gaming/playables/reference/getting_started) |
| Host lifecycle | FAIL → PASS locally | Target main suspends engine, audio, input and animations; queues resize and defers writes. Only SDK resume removes the gate, preserving an existing user/menu pause. `apps/youtube/vite.config.ts` removes Phaser visibility behavior. Host tests cover early/duplicate events, Escape, clicks, focus/blur, timer and frozen canvas. [Integration](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration) |
| Host audio | FAIL → PASS locally | Initial isAudioEnabled and change subscription; local mute hidden and saved mute ignored. Host tests inspect muted/suspended context states. Physical audibility and device mute in actual hosts: NOT YET VERIFIABLE. [Integration](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration) |
| Save and score | FAIL → PASS locally | Versioned SDK-only best/settings. Successful load precedes writes; malformed/unknown saves are protected; serialized writes retry at later milestones; only saved bests are reported. Adapter tests cover failures, concurrency and pause. Unknown/off-host SDK uses memory, never browser persistence. [Integration](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration) |
| Responsive game viewport | Partial prior coverage → PASS tested matrix | `apps/youtube/src/youtube.css`, shared `game-layout.css`; nine ratios from 9:32 to 32:9, mobile/desktop, mid-round resize, scrollable dialogs/cards. HUD dock stays outside playable water. [Design](https://developers.google.com/youtube/gaming/playables/certification/requirements_design) |
| Controls and completion | PASS locally | Shared input/UI; real touch emulation, mouse and keyboard, help/pause/results/replay. Result screen identifies completion of each 90-second round. Escape is not preventDefault'ed in this target. [Design](https://developers.google.com/youtube/gaming/playables/certification/requirements_design) |
| Navigation and host UI | FAIL → PASS local DOM; host placement NOT YET VERIFIABLE | Target removes home href and surrounding marketing sections; no share, quit, external navigation or extra agreements. Settings/pause placement still needs inspection inside actual YouTube chrome. [Design](https://developers.google.com/youtube/gaming/playables/certification/requirements_design) |
| Metadata/thumbnails | FAIL: final submission set not prepared | Existing title/pitch are drafts in `YOUTUBE-APPLICATION.md`; no owner-approved portal metadata/thumbnail set. Final title and required asset formats must be checked before upload. [Design](https://developers.google.com/youtube/gaming/playables/certification/requirements_design) |
| Bundle limits and references | PASS mandatory limits | Packaging script, inventory and official analyzer: seven files, relative asset references, root index.html, no source/node_modules/native files. [Stability](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability) |
| Individual-file recommendation | FAIL, SHOULD only | Phaser is 1,208,149 bytes, exceeding the recommended 512 KiB; below the mandatory 30 MiB. Avoid a risky engine rewrite merely to split this already small transfer. [Stability](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability) |
| Crashes/load/memory | PASS sampled desktop checks; universal compatibility NOT YET VERIFIABLE | Complete production and strong-driver rounds with no uncaught game errors; local startup and heap samples recorded. Actual network/device peak memory and YouTube Android/iOS compatibility remain unverified. [Stability](https://developers.google.com/youtube/gaming/playables/certification/requirements_stability) |
| External calls / privacy | PASS inspected local build | Production request allowlist: local files/data URLs and official SDK only. Browser-storage and navigator-language getters deliberately throw in test. No login, PII fields, analytics, service workers, remote fonts, purchases, clipboard or QR flows. `publicDir:false` prevents unrelated public files entering ZIP. [Privacy/data](https://developers.google.com/youtube/gaming/playables/certification/requirements_privacydata) |
| Packaging transparency | PASS local inspection | Standard TypeScript/Vite minification, JavaScript/Canvas/WebGL, no custom obfuscation or application worker/WASM. Phaser contains optional engine capabilities; actual CSP/runtime behavior was checked rather than treating every unused engine string as a network request. [Privacy/data](https://developers.google.com/youtube/gaming/playables/certification/requirements_privacydata) |
| Monetization | PASS current ad-free YouTube scope | No YouTube ads added; Android AdMob/UMP/Capacitor are absent from YouTube bundle. No off-platform purchases. Future monetization requires a separate integration and host review. [Monetization](https://developers.google.com/youtube/gaming/playables/certification/requirements_monetization) |
| Accessibility features | PASS implemented features; complete WCAG/assistive play NOT YET VERIFIABLE | `src/accessibility.ts`, `accessibility.css`: labeled controls, focus trap/return, restrained announcements, shape markers, contrast mode, reduced decorative motion, touch-first help; 200% root-text checks. Automated accessibility-tree inspection is not VoiceOver/TalkBack testing. [Accessibility](https://developers.google.com/youtube/gaming/playables/certification/requirements_accessibility) |
| Accessibility claims | PASS honest current copy | Help explicitly states spatial gameplay requires vision. No full nonvisual mode or unsupported Accessible Games Initiative tags claimed. Do not infer broad tags from a single setting. [Accessibility](https://developers.google.com/youtube/gaming/playables/certification/requirements_accessibility) |
| Language | PASS English target | `index.html lang=en`; English UI and explicit English number formatting. No navigator.language/languages or browser-driven language selection in target. No additional language support claimed. [Internationalization](https://developers.google.com/youtube/gaming/playables/certification/requirements_i18n_l10n) |
| Content, audience and originality | NOT YET VERIFIABLE as a certification conclusion | Source presents boats, objects and a whirlpool; no chat, user content or explicit material found. Owner must establish intended audience (not specifically made for kids), truthful metadata and lack of prohibited substantially identical content. Engineering inspection cannot decide these for YouTube. [Trust/safety](https://developers.google.com/youtube/gaming/playables/certification/requirements_trustsafety) |
| Rights and final title | NOT YET VERIFIABLE | Procedural assets and dependency notices have source evidence; ownership/licensing authority and title clearance require owner confirmation. See inventory below. [Trust/safety](https://developers.google.com/youtube/gaming/playables/certification/requirements_trustsafety) |
| Official host certification | NOT YET VERIFIABLE | No portal invitation/onboarding/release testing links. Public interactive-suite page unusable in this session; local mock tests are not a substitute. [Portal](https://developers.google.com/youtube/gaming/playables/developer_portal), [suite guide](https://developers.google.com/youtube/gaming/playables/reference/test_suite_guide) |

## Save/lifecycle boundaries

Progress means personal best and accessibility settings; an unfinished 90-second round is not restored across launches. New bests save at round completion and settings at change. Failed writes remain pending until a later milestone or host resume. Already-started SDK promises cannot be cancelled by this adapter; pause blocks subsequent work. On failed/invalid load the UI says progress is session-only and does not overwrite cloud data. Missing SDK permits silent, session-only preview, without pretending to have durable saves. A stalled SDK load can leave the loading screen waiting; exercise platform timeout/recovery behavior with the real host before certification.

Pause-time saving is recommended by the integration docs. This implementation saves completed milestones immediately and prioritizes no new work after pause; pending changes flush on resume. Abrupt termination during a failed/pending save can lose that update. Real host save/exit behavior, errors and conflict scenarios remain on the invitation test list. Schema v1 supports empty and unversioned best/settings data; unknown future versions are protected, not downgraded.

## Bundle and network inventory

Run from repository root:

```sh
npm ci
npm run package --prefix apps/youtube
npm run test --prefix apps/youtube
npm run test:browser --prefix apps/youtube
# In a separate terminal, for host diagnostics / strong-run test:
npm run dev --prefix apps/youtube
npm run test:host --prefix apps/youtube
RUN_LABEL=youtube TEST_URL=http://127.0.0.1:5190/ EXPECT_SUPPLY=1 npm run test:balance
```

The package command emits `release/water-hole-youtube.zip` and `release/youtube-package-report.json`. The ZIP contains only index.html, five built JS/CSS assets and third-party notices. The only external runtime dependency is `https://www.youtube.com/game_api/v1`; artwork, sound generation and game code need no external asset host. SDK-offline preview still plays after the script request fails/completes. It is not an independently offline YouTube host emulator.

The production browser test serves the build with the exact [published CSP](https://developers.google.com/youtube/gaming/playables/reference/test_suite_guide), stubs only the official SDK endpoint, rejects browser persistence and browser language lookups, and records unexpected external requests. Mock cloud APIs test our contract behavior, not YouTube's service. Static isolation checks also exclude advertising/native integration from YouTube and YouTube APIs from ordinary builds.

Google's public [bundle analyzer sample](https://developers.google.com/youtube/gaming/playables/samples/bundle_analyzer) was retrieved, inspected and executed locally against the output. Its report was empty, which its source defines as no detected size/count/name violations. It does not test gameplay or host integration. The public [interactive suite page](https://developers.google.com/youtube/gaming/playables/test_suite) was inspected using both the document reader and Chrome: the article was empty and exposed no game-testing controls. This is an observed access/page limitation, not proof that every public suite route requires an invitation. Per-release development/Test Suite links require the portal release described in the portal guide, which we do not have.

## Late-round balance review

No gameplay or scoring changes. A real-time keyboard driver used immutable development diagnostics to select movement, without changing positions, XP, time or score:

| Metric | YouTube target run |
| --- | ---: |
| Elapsed round | 90.138 seconds |
| Final score / captured objects | 18,305 / 132 |
| Final growth stage reached | 36 seconds |
| Score with 30 seconds remaining | 11,940 |
| Last-30-second gain | 6,365 |
| Valuable ships, minimum / median | 1 / 2 |
| Late samples with zero valuable ships | 0 / 129 |
| Maximum objects | 88 |
| Median sampled FPS | 59.25 |
| Uncaught game errors | 0 |

Earlier recorded comparable runs scored 17,505 and 18,035 (desktop) and 19,320 (emulated touch). The YouTube result fits this range; these are observations, not a statistical economy guarantee. Population/distance/delay assertions pass: capped arrivals, cargo/tug delays and no spawn bursts. It exercises the existing replenishment logic without evidence of new score inflation or frame collapse. Long-term player retention/economy and low-end real devices still need human testing. Source `src/config.ts`, `src/rules.ts`, `src/game.ts` remains unchanged.

## Rights/provenance inventory

| Asset | Repository evidence | Finding |
| --- | --- | --- |
| Harbor, boats, objects, whirlpool, effects | `src/art.ts`, `src/game.ts`, procedural Canvas | PASS: inspectable implementation; NOT YET VERIFIABLE: ownership/assignment and originality clearance |
| UI icons / game branding | Inline SVG in `src/ui.ts`, CSS, `public/favicon.svg` (favicon excluded from YouTube) | No downloaded icon pack found; owner must confirm provenance and final branding rights |
| Sound / music | `src/audio.ts`, Web Audio oscillators | Synthesized effects, no recordings or music files found; no third-party music licence identified as necessary for this inspected build |
| Fonts | System Arial/Helvetica/Georgia stacks in CSS | No redistributed font files or remote font requests; no font-file licence claim made |
| Phaser | Locked installed 3.90.0, upstream `LICENSE.md` | MIT notice copied verbatim, including target-specific engine adaptation attribution in code |
| Vite-generated support code | Installed Vite licence | Complete supplied licence/third-party notice text included conservatively; build-time dependencies are not shipped as node_modules |
| YouTube SDK | Loaded from official endpoint | Not vendored; its use and game distribution remain subject to YouTube terms |
| Android dependencies | Separate Android package/native project | Excluded from YouTube; Android-specific distribution review remains separate |
| Marketing assets, legal authority and final name | Draft pitch and repository statements only | NOT YET VERIFIABLE: owner sign-off needed; code generation/procedural drawing does not establish legal clearance |

See `THIRD-PARTY-NOTICES.md`. Packaging generates notices from installed licence texts rather than paraphrasing them. No broad public licence for the owner's original game is invented.

## Name decision — owner action

“Water Hole” remains unchanged, but it has a meaningful confusion risk. Current web search finds a prior **Water Hole** Android game by RedLineGames, package `com.redlinegames.waterhole2`, with a similar water-swallowing description ([AppRecs listing](https://apprecs.com/android/com.redlinegames.waterhole2/water-hole), [Chrome-Stats listing](https://chrome-stats.com/d/com.redlinegames.waterhole2)). These are third-party indexed records, not verification of current regional store availability or enforceable rights. The latter reports removal from Google Play; that does not establish name availability.

Options: retain the working name only after clearance, or investigate **Brine Banquet**, **Sunbreak Swirl**, **Portside Appetite**. Quoted searches did not surface an obvious exact-title game for those alternatives in the returned results; searches also returned unrelated material and cannot prove absence. “Sunbreak Harbor” currently names the map, not a separate product. Check relevant stores, trademark registers, domains/handles and licensing authority before choosing. No automatic rename or metadata publication occurred.

## Invitation-stage blockers

1. Obtain actual portal onboarding and release test links; run the interactive official suite and save its report.
2. Test the ingested package on YouTube desktop/mobile web and YouTube Android/iOS, including real phones, low-memory/loading conditions, host audio/device mute, backgrounding, SDK failures, exit saves and host-control placement.
3. Verify maximum heap/loading requirements under that host/device matrix. Local samples are not worst-case evidence.
4. Complete honest metadata/thumbnails, intended audience and only substantiated accessibility tags; conduct human assistive-technology checks for claimed support.
5. Confirm final public title, asset/code rights and authority to accept the applicable terms. Submit interest-form owner/company/metrics fields truthfully.

Technical readiness for a demo application and certification readiness are separate. Do not describe this local build as YouTube-approved, guaranteed to be selected, or guaranteed to earn revenue.
