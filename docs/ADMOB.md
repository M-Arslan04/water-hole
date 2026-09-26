# AdMob: test integration and owner setup

Prepared 25 September 2026. **No live ads, account changes or ad clicks. Native SDK code is not compiled/device-tested yet because the Android SDK is missing.**

## Implemented behavior

Only `apps/android` imports the bridge. The native `WaterHoleAdsPlugin` uses Google Mobile Ads Android SDK 25.5.0 and UMP 4.0.0. Google's current documentation calls this GMA API “Legacy”; it remains documented with 25.5.0. Review the [Next-Gen migration guide](https://developers.google.com/admob/android/next-gen/migration) before a future production activation; no claim of migration is made.

Debug builds use the official demo app ID `ca-app-pub-3940256099942544~3347511713` and interstitial unit `ca-app-pub-3940256099942544/1033173712`. Release builds have `TEST_ADS=false`. Native code additionally requires `BuildConfig.DEBUG`; **there is no live-ad execution path**. `ads.production.example.json` is an inactive configuration template for owner-supplied IDs. Supplying values alone does not activate anything.

The first Play press requests a fresh UMP consent update and, when required, its form. Initialization/loading happens only after a successful consent flow allows requests. Consent or network failure skips ads. A required privacy-options button appears in Android settings; opening settings pauses gameplay. The implementation does not store its own consent boolean. See [UMP guidance](https://developers.google.com/admob/android/privacy).

An interstitial may show only when the player presses replay after completed rounds, with at least **three completed rounds and five minutes** since process launch/the last displayed ad. Active and incomplete rounds cannot qualify. Missing/expired ads or display failures skip the break immediately. Ads are preloaded in menus; late load callbacks cannot display one themselves. Audio pauses before the break; replay begins after dismissal and a foreground check. No banner, mid-round interruption, rewarded ad, purchase, extra time or scoring change exists. See [interstitial lifecycle](https://developers.google.com/admob/android/interstitial).

The demo app ID may not have a configured UMP message, so this default can correctly show **no ad**. Do not bypass consent to make a test appear. To test your own configured consent flow, create an AdMob test app, configure Privacy & messaging, and supply its app ID with the debug-only Gradle property `-PwaterHoleTestAppId=YOUR_ADMOB_APP_ID`; the ad unit remains Google's demo unit. Example after sync: `./gradlew assembleDebug -PwaterHoleTestAppId=...` from the native Gradle directory. Never put an ID in the Java test-unit constant other than Google's demo ID. Region-specific consent tests require registered test devices and UMP debug settings in an explicitly debug-only test patch; those settings are not currently enabled. [Official test-ad guidance](https://developers.google.com/admob/android/test-ads).

## Owner steps before any live serving

1. Establish the AdMob/Google account yourself, including identity, tax, address, payment and eligibility steps. Google Play does not automatically add ads to an app.
2. Register the final Android package in AdMob; create an interstitial unit. Keep app ID (with `~`) distinct from ad unit ID (with `/`). IDs are identifiers, not private keys, but must still be the correct app's.
3. Decide the intended audience truthfully. Child-directed/mixed-audience handling needs a reviewed age approach, request flags and Families-compatible SDK/configuration. This branch does not implement an age screen and must not be released with ads to a child/mixed audience by merely changing IDs. See [Families policies](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en) and [request targeting](https://developers.google.com/admob/android/targeting).
4. Publish a final owner-reviewed privacy policy and contact details; configure UMP regional messages and test consent granted/denied/required/not-required/error/revocation states. Denying personalized ads does not necessarily forbid all limited ads; rely on the SDK's current permission/configuration guidance rather than inventing a boolean.
5. Establish an owner-controlled developer website and list it in the store. Publish the exact authorized-seller line supplied by AdMob at its root `/app-ads.txt`; do not use a made-up publisher ID. Verify crawling and app ownership. [app-ads.txt setup](https://support.google.com/admob/answer/9363762?hl=en).
6. Link the supported store listing and complete any app-verification/readiness checks. Test requests do not imply permission to serve live ads; [readiness review](https://support.google.com/admob/answer/10564477?hl=en) may limit serving until complete.
7. Review the actual merged release manifest, SDK versions, data behavior, Play declarations and all device checks. Implement production activation as a separate reviewed change, still keeping a test build variant. Do not click live ads, even your own.

Revenue depends on eligible served impressions and advertiser demand, region, consent, fill, format and policy status—not a payment per download. This conservative cap can reduce opportunities; it protects the round experience. No earnings estimate or guarantee is included.

## Data safety draft inputs—not final submitted answers

The core stores best score and accessibility preferences locally in Android Preferences; no account, analytics server, leaderboard or cloud save is implemented. Backup is disabled. The integrated advertising libraries change the disclosure assessment even though release requests are disabled today.

For a future ad-enabled build, Google's [SDK disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure) lists IP-derived general location, product interactions, diagnostics and device/account identifiers, used for advertising, analytics and fraud prevention, with transport encryption. Map these to current Play categories such as approximate location, app interactions, diagnostics and device IDs. Evaluate collected/shared, optional/required, ephemeral processing and purposes against actual configuration and observed traffic. Do not simply answer “no data collected.” Advertising ID permission can be merged by the SDK; inspect the final manifest and complete the corresponding declaration.

Owner must verify UMP consent data, retention/deletion information, processor policies and every bundled SDK in the final release. The app has no user-account deletion flow because it has no accounts; local data can be cleared through Android settings. That does not claim to delete data already processed by Google. See PRIVACY-POLICY-DRAFT.md.

## Pending native test matrix

Test successful load/show/dismiss, failed load, failed show, no-fill, offline start, expired cache, rapid repeated replay presses, 3-round/5-minute boundaries, background during consent/ad, denied consent, privacy changes, TalkBack in forms, and release builds with ads disabled. Verify the “Test Ad” label when a test ad is actually displayed. Host Java policy tests exercise timing/round safety; mocked lifecycle tests do not validate UMP, ad rendering or Android callbacks. All of those device checks remain pending.
