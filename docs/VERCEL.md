# Vercel launch preparation

The regular website is live at https://water-hole.vercel.app in the existing `marslan04s-projects/water-hole` Vercel project. GitHub `M-Arslan04/water-hole` uses `main` for automatic production deployments. The Ocean Navy web release is commit `9887903`. The analytics work below is prepared for review and has not been deployed.

## Checked-in configuration

`vercel.json` selects the Vite framework, installs with `npm ci`, builds with `WATER_HOLE_BUILD_TARGET=vercel-web npm run build`, and serves `dist`. Content-hashed assets receive long-lived immutable caching; the entry document is revalidated so returning players receive the current asset references. `.vercelignore` excludes dependencies, generated archives, documentation and test artifacts from CLI uploads. Dependency license notices remain inside the production output.

There are no application server functions, secrets or databases to configure. Basic Web Analytics uses Vercel’s same-origin collection endpoint. Its build-time checks require Vercel’s system environment variables; access to them was verified enabled in the project on 2026-10-21. The game only uses the root page, so it does not need an SPA catch-all rewrite.

## Deploy from a repository

1. Put the game source and `package-lock.json` in your Git repository.
2. Import that repository in Vercel.
3. Choose the root directory containing **this project's** `package.json` and `vercel.json`: `water-hole` if importing the parent workspace, or `.` if the game is its own repository.
4. Confirm Vite, build command `WATER_HOLE_BUILD_TARGET=vercel-web npm run build`, output directory `dist`, and install command `npm ci`.
5. Create a preview deployment, test the generated HTTPS URL on a real phone, then promote/deploy to production when ready.

Alternatively, with the official Vercel CLI installed and your account authenticated:

```sh
cd /Users/codingcops/Documents/AAA/water-hole
vercel
# After reviewing the preview:
vercel --prod
```

The source archive is suitable for a fresh repository. The static archive contains only the built website; a source-based Vercel import should use the source project and its build configuration.

## Local release checks

```sh
npm ci
npm test
npm run build
npm run preview
```

With the production preview available at `http://127.0.0.1:4178/`:

```sh
npm run test:responsive
```

The responsive regression runs a real 90-second mobile round, checks result and replay layout at 320–1440px widths, exercises portrait/landscape rotation, and changes viewport height to model browser chrome. `PRODUCTION_URL` can point the same regression at the HTTPS preview instead. Existing `npm run test:browser` and `npm run test:smoke` also remain available; they additionally require the development server for diagnostics.

## Before the public launch

- Play a full round and replay on actual iOS Safari and Android Chrome, including browser toolbar movement, background/resume and audio.
- Confirm the deployment root, relative asset loading, score persistence, and updated files after a redeploy.
- Resolve the working title conflict already documented in `YOUTUBE-READINESS.md` before choosing the public release name.

Vercel deployment is independent of YouTube Playables certification.

Official references checked on 2026-09-24: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) and [project configuration](https://vercel.com/docs/project-configuration/vercel-json).


## Basic Web Analytics — prepared 2026-10-21, not deployed

The existing Hobby project had Web Analytics disabled. It was enabled using **Web Analytics on Hobby — Included in your plan**. The confirmation listed 50,000 events/month, 30 days of viewable history, no custom events and capped ingestion. No upgrade, Plus add-on or paid event feature was selected. The dashboard currently shows zero collected visitors/page views and asks for deployment. No dashboard setup remains for this integration; publish only after reviewing the code. Usage is subject to Vercel's current plan limits; collection can pause at the cap.

The code uses the official vanilla `inject()` API from pinned `@vercel/analytics` 2.0.1. No React dependency was installed. Only `src/main.ts` imports the optional integration, after starting the game. Loading/initialization failures are caught; the game never awaits telemetry. The module initializes once and rejects custom events.

### Target and privacy boundaries

- The root Vite build enables the integration only for `build`, production mode, `VERCEL=1`, `VERCEL_ENV=production`, and the explicit `WATER_HOLE_BUILD_TARGET=vercel-web` supplied by `vercel.json`. `NODE_ENV=test`, test mode, or `WATER_HOLE_DISABLE_ANALYTICS=1` disables it.
- Runtime initialization requires exactly `https://water-hole.vercel.app` and `/` or `/index.html`. Localhost, preview URLs, other hosts and browser automation (`navigator.webdriver` / Headless user agent) are excluded. Custom domains need an explicit later review; do not loosen the allowlist to all hosts.
- Android and YouTube import the shared game bootstrap, not the website entry point. Their configs/entry points are unchanged and their emitted executable bundles do not include analytics, even with the Vercel environment flags present. This remains true for separately hosted builds unless deliberately opted in and served on the allowed origin.
- Page URLs are normalized to `https://water-hole.vercel.app/`, with all query parameters and fragments removed. Unknown paths/custom events are dropped. Since the SDK separately handles referrers, collection is skipped for visits with query/fragment/credentials in `document.referrer`. The root HTML uses an origin-only referrer policy, including collection-request headers. This intentionally sacrifices some attribution to avoid forwarding sensitive values.
- No player name, score, local best, settings, game diagnostics, rounds or custom events are supplied to analytics. Ordinary provider traffic metadata still supports browser/device/geographic and visitor statistics. The existing unpublished privacy-policy draft has a factual website section; owner/contact/legal placeholders remain unresolved. No legal-compliance claim or finalized public policy was invented.

### Validation and evidence

`node tests/web-analytics.mjs` tests build gating, browser automation/host isolation, once-only initialization, redaction and responsive gameplay with blocked scripts, failed script responses and a failed optional module. Requests are intercepted; automated tests never send real analytics events.

To additionally exercise the current official collection script locally, download it to a temporary file and set `VERCEL_ANALYTICS_SCRIPT` to that file when running the test. The verification for this change replayed `https://va.vercel-scripts.com/v1/script.js` this way. It observed exactly one intercepted `/_vercel/insights/view` POST containing the normalized URL and SDK metadata; no private query values, saved score or player name appeared. Play/pause/resume did not generate gameplay events. **This proves local serialization, not Vercel ingestion or dashboard reporting.**

Passed: normal production build; seven build-environment cases plus development-server gating; nine browser cases; 15 rule/shared-navigation unit tests; Android and YouTube web-asset production builds and analytics-absence scans with Vercel flags present. No new native APK/device test was performed or needed for this website-only change. Local evidence is ignored under `tests/artifacts/web-analytics/` (results, platform isolation, screenshots and focused patch).

The install’s online audit also reported two existing high-severity development-tool findings (`vite` / launch-editor and `source-map-js`). No existing dependency versions changed; the new analytics package has no runtime dependencies. Those unrelated tool updates were not applied in this focused change.

### Verify after an approved deployment

1. Review this branch's focused diff. A later merge/push to `main` can automatically deploy production. Review the analytics changes before publishing; a local commit does not deploy them.
2. Open https://water-hole.vercel.app in an ordinary browser, directly rather than from a link containing private referrer parameters. Local builds, Vercel Preview URLs and automated browsers intentionally do not count.
3. In DevTools Network, confirm `/_vercel/insights/script.js` loads, and `/_vercel/insights/view` returns a successful status. Check that its page URL is only `https://water-hole.vercel.app/`. Query parameters/fragments and gameplay data must be absent. Content blockers may suppress collection; the game should remain usable.
4. Open [Water Hole → Analytics](https://vercel.com/marslan04s-projects/water-hole/analytics), select **Production** and a recent date range, then view **Visitors** and **Page Views**. Allow processing time; the dashboard suggests checking blockers if no data appears after roughly 30 seconds. Refreshing the website is a new page view. Playing another round is not.
5. Visitors are Vercel's estimated website visitors, not accounts or unique players across phones, Android APKs or YouTube. Page views measure website loads/navigation, not actual rounds played.

Official instructions reviewed: [vanilla quickstart](https://vercel.com/docs/analytics/quickstart), [beforeSend configuration](https://vercel.com/docs/analytics/package), [privacy/data description](https://vercel.com/docs/analytics/privacy-policy), and [Hobby limits](https://vercel.com/docs/analytics/limits-and-pricing).
