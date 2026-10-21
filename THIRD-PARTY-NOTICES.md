# Asset and dependency provenance

The harbor, boats, bottles, crates, buoys, whirlpool, effects, favicon and interface were created specifically for this prototype using Canvas drawing, SVG, HTML and CSS. Audio is synthesized with Web Audio. No external game art, recordings or downloaded typefaces are included. System fonts are used.

Phaser is distributed under the MIT license (see `node_modules/phaser/LICENSE.md`). Vite, TypeScript, Playwright and tsx are development dependencies with their respective upstream licenses; the lockfile records exact installed versions. Preserve required dependency notices when redistributing bundled code. No association with another game, YouTube approval or registered trademark is claimed.

The separate Android package uses Capacitor core/Android/App/Preferences under MIT (not included in the standalone web bundle). Its local native notice is generated from those installed license files during the Android build. AndroidX, Google Mobile Ads SDK and UMP have their own distribution terms; review their resolved dependencies and notices before release. No rights clearance or store approval is implied.

The separate YouTube packaging script includes the installed Phaser and Vite licence texts in `third-party-licenses.txt`. Phaser visibility handling and its storage probe are adapted only for this target; the original engine distribution and its licence remain in root dependencies. The official YouTube SDK is loaded from its official endpoint, not redistributed. See `docs/YOUTUBE-AUDIT.md` for rights gaps and owner decisions.

The regular Vercel website optionally uses `@vercel/analytics` 2.0.1 (MIT). Its license is included in `public/third-party-licenses.txt`. It is not initialized by Android or YouTube entry points.
