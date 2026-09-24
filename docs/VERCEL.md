# Vercel launch preparation

This project is prepared for Vercel as a static Vite game. No Vercel project has been linked, no account has been accessed, and no deployment has been published by this change.

## Checked-in configuration

`vercel.json` selects the Vite framework, installs with `npm ci`, builds with `npm run build`, and serves `dist`. Content-hashed assets receive long-lived immutable caching; the entry document is revalidated so returning players receive the current asset references. `.vercelignore` excludes dependencies, generated archives, documentation and test artifacts from CLI uploads. Dependency license notices remain inside the production output.

There are no server functions, secrets, environment variables, databases or runtime external services to configure. The game only uses the root page, so it does not need an SPA catch-all rewrite.

## Deploy from a repository

1. Put the game source and `package-lock.json` in your Git repository.
2. Import that repository in Vercel.
3. Choose the root directory containing **this project's** `package.json` and `vercel.json`: `water-hole` if importing the parent workspace, or `.` if the game is its own repository.
4. Confirm Vite, build command `npm run build`, output directory `dist`, and install command `npm ci`.
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
