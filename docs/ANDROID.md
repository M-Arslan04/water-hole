# Android build and installation

Prepared 25 September 2026. **Native scaffold and web assets are built; no APK/AAB was produced.** Actual Gradle debug attempt failed: `SDK location not found`. Android Studio, SDK, adb and emulator were absent. Java 21 is installed. Do not describe this as store-ready or device-tested.

## Architecture and choice

Capacitor suits this Vite/Phaser game: it can package the existing local JS/CSS/art/audio and provide native lifecycle/storage without rewriting game rules. It still uses Android System WebView, so device performance, audio focus and TalkBack need real testing. It is not a remote Vercel wrapper.

- `src/bootstrap.ts`, game/rendering/input/UI/accessibility: shared.
- `src/main.ts` + `BrowserPlatform`: web only, root `npm run build` → `dist/`.
- `apps/android`: independent package/lock, Vite entry and `dist/`; its own Capacitor configuration and `android/` Gradle project.
- Android `platform.ts`: Capacitor Preferences for score/settings; lifecycle module for pause/audio/back. No score sent to an external service.
- Android Java plugin: test ads and UMP only. No imports into the web entry. `.vercelignore` excludes `apps`.
- Future YouTube adapter/build is a documented extension point, not an implemented SDK or a runtime switch in these two targets.

The default Android orientation is **unlocked**. The shared responsive layout supports portrait, landscape and resizing; manifest configuration changes preserve the running activity. Native window insets reserve system bars/cutouts. Verify API 36 edge-to-edge and large-screen behavior on devices. Back closes settings, pauses a playing round, then minimizes from nonplaying screens. Background pauses audio and simulation; foreground does not resume a round automatically. Scores/settings persist via Preferences; a killed process starts at the menu, not a restored half-round. App backup is disabled; uninstall/clear data removes these values.

## Mac setup (owner actions)

1. Install [Android Studio](https://developer.android.com/studio) from Google. Capacitor 8 requires Node 22+ and Android Studio 2025.2.1+; see [environment requirements](https://capacitorjs.com/docs/getting-started/environment-setup). Use a current stable Studio and JDK 21. This Mac's default sandbox PATH had Node 20, while the host shell provided Node 25; choose a consistent Node 22+ shell for native commands.
2. In Studio's SDK Manager install Android SDK Platform 36, SDK Build-Tools 36.0.0, Platform-Tools and Command-line Tools (latest). For this Apple Silicon Mac choose an ARM64 Android 16 / API 36 Google Play emulator image. Review/accept Google's licenses yourself.
3. Configure the shell (standard SDK install location):

```sh
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
node --version
java -version
adb version
```

If Studio installed the SDK elsewhere, set that actual path. Alternatively create ignored `apps/android/android/local.properties` containing `sdk.dir=/absolute/path/to/Android/sdk`. Do not commit machine-specific paths.

If `java_home -v 21` reports that no runtime is installed but Homebrew JDK 21 is present, use its path directly on Apple Silicon:

```sh
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
java -version
```

Android Studio's Gradle JDK is a separate setting. Select JDK 21 (or **Use JVM 21** in the import dialog). Studio's bundled Java 25 is incompatible with this project's Gradle 8.14.3; changing the terminal environment alone does not change the IDE setting.

4. From the repository root:

```sh
npm ci
npm run build
npm ci --prefix apps/android
npm run sync --prefix apps/android
npm run test --prefix apps/android
npm run apk --prefix apps/android
```

`sync` rebuilds the Android Vite output and copies it into native assets. Never configure `server.url`. Inspect `apps/android/android/app/src/main/assets/capacitor.config.json` before packaging. The APK, when successful, is `apps/android/android/app/build/outputs/apk/debug/app-debug.apk`.

5. Start the emulator in Studio Device Manager. For a physical phone, enable Developer options/USB debugging and accept the device's trust prompt yourself. Then:

```sh
adb devices
adb install -r apps/android/android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.example.waterhole/.MainActivity
```

If multiple devices are connected, use `adb -s DEVICE_SERIAL ...`. A release-signed installation cannot be updated with the debug key; use a dedicated test phone/profile or preserve data before uninstalling.

## Identifier and release signing

`com.example.waterhole` is provisional and must be replaced with a unique owner-controlled ID before the first Play upload. Update Capacitor appId, Gradle applicationId/namespace, Java package paths/declarations, and string custom URL scheme together, then sync and retest. Changing the package after publication creates a different app: it does not update existing users or automatically transfer scores, reviews or store identity. Keep the final ID stable.

Use an upload key held by the owner, outside the repository. Example (substitute your chosen absolute path; keytool prompts for passwords and identity):

```sh
mkdir -p "$HOME/.android-upload-keys"
chmod 700 "$HOME/.android-upload-keys"
keytool -genkeypair -v -keystore "$HOME/.android-upload-keys/water-hole-upload.jks" -alias upload -keyalg RSA -keysize 2048 -validity 10000
chmod 600 "$HOME/.android-upload-keys/water-hole-upload.jks"
```

Back up the keystore in two secure locations; retain alias and passwords in a password manager. Do not paste them into chat, shell history, source control or CI logs. Enroll in [Play App Signing](https://developer.android.com/studio/publish/app-signing): Google holds the distribution signing key, while you sign uploads with your upload key. Understand recovery/reset before release.

Create ignored `apps/android/android/keystore.properties` locally, permissions `600`, with your real values:

```properties
storeFile=/absolute/path/outside/repository/water-hole-upload.jks
storePassword=ENTER_LOCALLY
keyAlias=upload
keyPassword=ENTER_LOCALLY
```

Then `npm run bundle --prefix apps/android` builds the signed release AAB at `apps/android/android/app/build/outputs/bundle/release/app-release.aab`. The build refuses release assembly without the private properties file. Increment versionCode for each Play upload. **A debug APK is for installation testing, not the final Play artifact.** Release ads are hard-disabled; test the release variant too. Nothing has been signed or uploaded here.

## Device acceptance checklist (all still pending)

- [ ] Install, force-stop and cold-launch in airplane mode: local harbor/assets available; consent failure does not block play.
- [ ] Complete 90 seconds and all six stages; cargo/tug replenishment, steering/reversal/release, no frame hitches at growth.
- [ ] Rotate, split-screen, resize; check cutout/system bars and gesture navigation on API 36, plus a lower supported API (min 24).
- [ ] Home, lock screen, phone interruption, background/foreground: timer frozen, audio silent, explicit resume. Back closes settings before leaving.
- [ ] Best score and accessibility settings survive force-stop and restart; clear data resets them.
- [ ] TalkBack menus/results and keyboard; large font/display size; contrast and motion preference; actual low-vision user review.
- [ ] Test interstitial after qualifying replay, dismissal/error/offline/unavailable cases, consent changes, background during ad; no ad during active play. See ADMOB.md.
- [ ] Capture genuine device screenshots; run release AAB through internal testing/pre-launch reports, verify merged permissions and any native libraries' 16 KB compatibility.

No emulator or physical device was available during this pass. Host-side adapter/policy tests are not a substitute.
