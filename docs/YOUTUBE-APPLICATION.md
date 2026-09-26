# YouTube Playables application draft

> **26 September update:** the public mobile demo was rechecked successfully. A separate local YouTube SDK target now exists; see [current audit](YOUTUBE-AUDIT.md). Earlier status/evidence sections below are historical. The owner field drafts remain unsubmitted; portal access and certification have not been obtained.

Prepared 25 September 2026. **Owner review required; nothing submitted. Water Hole is a provisional title.** Public demo: https://water-hole.vercel.app/. This branch's accessibility changes have not been deployed there, so update the support claims below only after an approved deployment and public-URL check.

## Pitch

Water Hole is a quick harbor arcade game where a tiny whirlpool develops a ship-sized appetite. Steer through a hand-drawn-style harbor, collect driftwood and bottles, then grow through six stages until cargo ships are on the menu. Each 90-second round rewards a better route, careful steering around shallows and a bigger personal best. Touch dragging, mouse steering and keyboard controls share the same game.

Genre: casual arcade / collection / score attack. Single player; no account, purchases or multiplayer. Six stages: Little ripple, Making waves, Current mood, Harbor hungry, Deep trouble, Force of nature. Floating touch steering supports small corrections and quick reversals; ship replenishment supports late-round pursuit. All artwork is rendered from project code and audio is synthesized locally; these observations are not an ownership certification.

## Evidence and limits

This pass used automated Google Chrome on macOS, a real-time desktop keyboard round, mouse interaction, and Chrome-emulated touch viewports including 320/360/390px phones, tablets, landscape and DPR 1/2/3. These are **emulations, not physical Samsung/iPhone tests**. See PLATFORM-REPORT.md and ACCESSIBILITY.md for exact versions/results. No YouTube host, TV remote, physical phone, Android emulator, TalkBack or VoiceOver gameplay certification occurred.

Branch accessibility: semantic buttons, instructions/settings dialog, focus handling, restrained state announcements, mute, high-contrast shape markers, reduced decorative motion, keyboard menus and movement, persistent preferences. The game still needs vision for spatial, real-time play. Do not advertise full blind accessibility. Public deployment support must be rechecked independently.

## Playables status

The [official overview](https://developers.google.com/youtube/gaming/playables) describes early access and points to the [interest form](https://docs.google.com/forms/d/e/1FAIpQLSdvdQ0lgIq2369aemj1O6w8R8FwGn9O5ARRGODDDUbVINCRJQ/viewform). Interest does not guarantee a response, selection or commercial arrangement. Vercel is a demo host, not a Playables distribution channel.

| Item | Actual status |
| --- | --- |
| Ordinary web demo | Existing public Vercel deployment supplied by owner; branch changes remain local |
| Playables SDK | Not integrated; BrowserPlatform is a local adapter, not the YouTube SDK |
| Developer portal access | Not established or verified |
| Host lifecycle/storage integration | Future separate adapter/build; inactive in web and Android |
| Official test suite | Not run against a YouTube-integrated package |
| Certification / YouTube launch | Not obtained |
| Revenue or commercial agreement | Unknown; no promise made |

Next, if invited: follow the [portal guide](https://developers.google.com/youtube/gaming/playables/developer_portal), [SDK reference](https://developers.google.com/youtube/gaming/playables/reference/sdk) and [integration requirements](https://developers.google.com/youtube/gaming/playables/certification/requirements_integration). Integrate host pause/audio/storage/reporting in a separate target, then run the [test suite guide](https://developers.google.com/youtube/gaming/playables/reference/test_suite_guide) and all current certification requirements. Android work does not depend on acceptance.

## Interest form field drafts

Inspected the public first page and both pages' embedded public field definitions on 25 September 2026. No responses were entered, no acknowledgement was selected, and no form was submitted. Labels below are paraphrased. Recheck the live form before use.

| Field / acknowledgement | Draft or owner action |
| --- | --- |
| Collected contact email | `[OWNER EMAIL TO USE WITH GOOGLE]` |
| Acknowledgement of participation conditions and rights | Owner must read the current statements and personally decide; leave unchecked until then |
| Discovery channel | `[HOW YOU FIRST LEARNED OF PLAYABLES]`; choose the truthful offered option |
| Legal company | `[LEGAL ENTITY NAME]`; use the form's individual-developer value only if accurate |
| Headquarters country | `[ENTITY COUNTRY]`; use the individual-developer value only if applicable |
| Person submitting | `[FULL NAME]` |
| Role | `[ACTUAL ROLE / INDEPENDENT DEVELOPER IF TRUE]` |
| Preferred contact address | `[BUSINESS OR PERSONAL CONTACT EMAIL]` |
| Games and playable links | `Water Hole (working title) — https://water-hole.vercel.app/` |
| Number of games intended (optional) | `1`, if the owner confirms this is the intended submission |
| Game description | Use the pitch above, adding only tested and deployed support claims |
| Combined monthly active users | `[VERIFIED MAU AND APPROPRIATE RANGE]`; do not infer from hosting, visits or downloads. A public demo does not justify selecting “no published games.” |
| Existing distribution platforms | `Web` is supported by the existing demo; Android is in development and not published. Add other platforms only with evidence. |
| Reasons for interest (optional) | Suggested owner-selectable themes: introducing the game to a broader audience and learning from short-session play. Select only motivations that are true. No revenue estimate. |

The platform list includes console/mobile/PC/TV/web and other distribution contexts; MAU is a banded choice. Do not invent company details, audience size, ownership declarations, licensing authority, prior releases or commercial preferences.

## Rights the owner must verify

- [ ] Authority to submit and license the entire game under YouTube's actual terms.
- [ ] Rights and provenance for all original source, commissioned work, contributions and any generated content; review THIRD-PARTY-NOTICES.md and dependency licenses.
- [ ] Rights to artwork, icons, sound synthesis/compositions, fonts and all marketing assets. Confirm no unlicensed copied assets or trademarks.
- [ ] Rights to the final game title, logo and relevant domains/social handles; perform jurisdiction-specific trademark review.
- [ ] Privacy disclosures and any later SDK data collection match the actual build being submitted.
- [ ] All application claims and metrics are accurate as of submission.

## Preliminary naming search

Searched quoted titles in general web results and with `site:play.google.com`, `site:apps.apple.com`, and `site:youtube.com` on 25 September 2026. Search indexing, regional stores, delisted games and unregistered rights limit this exercise. **No trademark clearance or availability guarantee. No rename performed.**

| Candidate | Findings and implication |
| --- | --- |
| Water Hole (current) | Crowded ordinary phrase. Google Play has [The Water Hole](https://play.google.com/store/apps/details?id=com.subsplashconsulting.s_74TH8F), a nongame app. Store text also associates the phrase with [Holein](https://play.google.com/store/apps/details?id=com.InkosGames.HoleIn). An indexed older Android-game reference also surfaced; treat the current title as higher collision risk. |
| Brine Banquet | No obvious exact-title game/app/YouTube result surfaced in the searches. Suggests collection and appetite; pronunciation and search discoverability need user testing. |
| Portside Appetite | No obvious exact-title game/app/YouTube match surfaced. Descriptive harbor theme; fairly long for an icon caption. |
| Sunbreak Swirl | No obvious exact-title match surfaced. “Sunbreak” is already used in [Monster Hunter Rise: Sunbreak](https://www.nintendo.com/us/whatsnew/gear-up-new-monsters-locales-and-abilities-await-in-monster-hunter-rise-sunbreak/), making this the weaker distinctive choice despite the different full title. |

Shortlist for owner review: **Brine Banquet**, then **Portside Appetite**. Before choosing: search each store natively by region, relevant trademark registries, domains and handles; obtain professional clearance where appropriate. These are original draft names, not reserved brands.
