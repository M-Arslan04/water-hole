# Later iOS path

Assessment prepared after the available Android build attempt and web regressions, 25 September 2026. **No iOS project/build was created. Android device validation is still blocked.**

The shared Vite/Phaser game and platform contract can support another Capacitor target. Add an independent `apps/ios` package/config and adapter later, sharing core assets/UI, with a native Swift ads/UMP boundary. Do not import the Android Java bridge or native SDKs into the browser entry. Bundle assets locally, retain offline play and test iOS WebView performance/audio/lifecycle. Reuse the restrained round-break policy concept, but verify native callback behavior anew.

## Additional work and cost

- Apple Developer Program membership is generally **US$99 per year**, with local pricing/possible eligibility exceptions; the owner enrolls, verifies identity/business information and accepts terms. Devices and other business costs are extra. [Enrollment](https://developer.apple.com/programs/enroll/).
- This Mac has Xcode **16.4** selected. Current Capacitor 8 requires Xcode 26+, and Apple has required Xcode 26/current-generation SDKs for submissions since April 2026. Upgrade before attempting an App Store build. [Submission minimums](https://developer.apple.com/news/upcoming-requirements/?id=04282026a), [Capacitor environment](https://capacitorjs.com/docs/getting-started/environment-setup).
- Choose final bundle ID, capabilities and signing team; configure certificates/profiles and App Store Connect record. Keep signing credentials outside source control.
- Implement iOS best-score/settings persistence and required privacy manifests/reasons for APIs (including the Preferences plugin); inspect all SDK privacy manifests, signatures and collected-data disclosures. See [Preferences iOS requirements](https://capacitorjs.com/docs/apis/preferences).
- Implement iOS AdMob/UMP separately with test IDs. If the final app tracks users across other companies' apps/sites, implement the required App Tracking Transparency flow; UMP does not replace ATT. Do not show an ATT prompt if the app does not perform tracking merely because ads exist. Owner must establish the actual behavior. [ATT](https://developer.apple.com/documentation/apptrackingtransparency).
- Test on actual supported iPhones/iPads: touch, WebGL performance/thermal behavior, safe areas, rotation/multitasking, silent switch/audio interruptions, background/return, offline cold launch, VoiceOver, Dynamic Type/display zoom, contrast and reduced motion. Chrome phone emulation is not iOS evidence.
- Use TestFlight for internal/external beta testing, collect feedback, then prepare genuine screenshots, support/privacy URLs, age rating, App Privacy answers and review notes explaining offline gameplay and ads. [TestFlight](https://developer.apple.com/testflight/).

Apple's [review guidelines](https://developer.apple.com/app-store/review/guidelines/) require adequate functionality and quality; a remote-site shell is not a guaranteed approval route. This locally bundled interactive game has more substance, but that is an engineering assessment, **not a promise of approval**. Finish Android device tests and review user feedback before investing in the iOS port.
