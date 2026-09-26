# Water Hole — YouTube target

Independent Playables preparation build, sharing the existing game. Not certified or uploaded.

From repository root, install the root lockfile dependencies with `npm ci`. Then:

- `npm run dev --prefix apps/youtube` — preview on port 5190; without host, session-only progress and muted audio.
- `npm run package --prefix apps/youtube` — production build plus `release/water-hole-youtube.zip` and size/SHA-256 inventory.
- `npm run test --prefix apps/youtube` — cloud adapter contract tests.
- `npm run test:browser --prefix apps/youtube` — production CSP, mock SDK, layout and complete round. Requires local Chrome (or CHROME_PATH).
- `npm run test:host --prefix apps/youtube` — host/audio edge cases; requires the port-5190 development server.

No Android ads, Capacitor, localStorage progress or browser visibility lifecycle. SDK-only behavior is confined here. The Vite plugin adapts pinned Phaser source to remove its visibility handler and storage probe; review this intentionally guarded transformation whenever updating Phaser.

See [audit and remaining blockers](../../docs/YOUTUBE-AUDIT.md) and [verification record](../../docs/YOUTUBE-VERIFICATION.md). Do not upload the ZIP until the real-host and owner reviews are complete. The official SDK remains an external required script; it is not bundled or replaced in the archive. Tests use a clearly local mock only.
