# Privacy policy draft — owner review required

**Do not publish this template unchanged.** Resolve every bracket and verify the final app's SDK behavior. Effective date: `[DATE]`. App: `[FINAL TITLE]`, package `[FINAL PACKAGE]`. Operator: `[LEGAL OPERATOR]`. Contact: `[PRIVACY EMAIL]`. Website: `[DEVELOPER WEBSITE]`.

The game saves your personal best and accessibility preferences on your device. It does not require an account. Clearing app storage or uninstalling removes that local information. Device backup is disabled in the current Android configuration.

`[FOR THE ACTUAL AD-ENABLED RELEASE, VERIFY:]` The Android game uses Google AdMob and Google's User Messaging Platform to provide advertising and applicable consent choices. These services may process IP address/general location, advertising or other device identifiers, interactions and diagnostic information for advertising, measurement, security and fraud prevention. Refer to [Google's privacy policy](https://policies.google.com/privacy) and [advertising technology information](https://policies.google.com/technologies/ads). Explain any additional SDKs actually included before release.

Where required, you can make consent choices before ads are requested and revisit available choices through Settings → Ad privacy choices. Android also provides advertising-identifier controls. `[DESCRIBE APPLICABLE RIGHTS, LEGAL BASES, RETENTION, INTERNATIONAL TRANSFERS, CONTACT/REQUEST PROCESS AND REGIONAL DISCLOSURES AFTER OWNER REVIEW.]`

`[STATE THE TRUTHFUL INTENDED AUDIENCE AND CHILDREN'S DATA PRACTICES. DO NOT INVENT AN AGE LIMIT TO AVOID REQUIRED PROTECTIONS.]`

The current development package uses test units; production serving is disabled. The ordinary browser game has no AdMob/Capacitor integration. Its local score/settings storage and hosting-provider traffic processing require a separate accurate web notice. Do not imply that “offline game” means an ad-enabled Android version never contacts a service.

`[EXPLAIN HOW MATERIAL POLICY CHANGES WILL BE COMMUNICATED AND HOW USERS CAN CONTACT THE OPERATOR.]`

## Regular website analytics — proposed disclosure for this integration

After this change is deployed, `https://water-hole.vercel.app` uses Vercel Web Analytics for website visitor and page-view statistics. The integration sends no custom gameplay events, player names, scores, saved preferences or game diagnostics. Page URLs are normalized to the site root without query strings or fragments. Collection is skipped when the referring URL contains query strings, fragments or credentials, since that referrer is handled separately by the provider's script. Resource requests use an origin-only referrer policy.

Vercel's basic analytics processes request information to provide traffic statistics, including approximate geography and browser/device categories. See [Vercel's analytics privacy documentation](https://vercel.com/docs/analytics/privacy-policy) for the provider's description of its visitor identification and processing. These statistics do not identify unique players across devices/platforms or count game rounds. This integration does not run in Android, YouTube Playables, local development, Vercel Preview deployments or supported automated tests. Website personal bests/settings remain in local browser storage and are not sent by this integration.

This is a factual addition to an existing unpublished draft, not a completed public privacy policy or a claim of legal compliance. The operator/contact/rights placeholders above still require owner review.
