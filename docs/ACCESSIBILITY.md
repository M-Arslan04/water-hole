# Accessibility implementation and evidence

25 September 2026. This improves menus and visual play; **it does not establish full blind gameplay or WCAG conformance**.

## Implemented

- Settings and How to play use separate named native HTML dialogs, trapped Tab order, explicit close buttons/Escape, and restored opener focus. Settings has a labelled checkbox/select; help leads with touch instructions on touch devices and keeps alternate controls expandable. Opening either dialog pauses play; closing does not resume. Escape is handled in the DOM to prevent a queued Phaser event from resuming behind the dialog. Mobile welcome remains scrollable with enlarged text or a short viewport.
- Play/replay, pause/resume and mute remain semantic buttons. Space/Enter operate buttons; arrow keys work in settings and steer the focused harbor. Gameplay key capture no longer swallows menu Space presses. Focus is visible and moves to the harbor, pause/resume control and replay as appropriate.
- Score, time, stage and results remain readable DOM text. Progress has a named progressbar/value and text such as “maximum stage reached.” A polite live region announces round start/pause/resume/end, stage transitions and one ten-second warning. It does not announce every score update or recurring hazard toast. Final results include score, catches, largest catch and best.
- High contrast keeps original artwork and adds black-backed white/yellow target outlines, check marks for eligible objects, locks for larger objects, a double player ring, striped shallow-water hazards, and black/white essential HUD panels. Shapes distinguish meaning without relying on color. Default art remains unchanged.
- Reduced motion follows the OS automatically or can be requested explicitly. It removes decorative whirlpool rotation, bobbing, score bounce, capture spin/particles/rising labels, growth pulse and arrival fade. Moving ships, suction paths and camera tracking remain necessary to the spatial game; there is no “all motion off” claim.
- Essential menu/result/progression text was enlarged; settings reflow and scroll at 200% root text size. Menu buttons are at least 44×44 CSS px. Brand lettering stays compact. This is not a claim that every decorative caption scales or every possible OS text setting is supported.
- Existing distinct capture/growth/shallow/finish tones and mute are preserved. High contrast, reduced-motion choice and mute persist in local browser storage or Android Preferences. Storage failure remains nonfatal.
- No sensitivity slider was added: the prior proportional touch steering already offers gentle/full-speed movement, and no tested need justified another control. CONFIG, rules, spawning and steering-rules values are unchanged.

## Actual checks

Automated Playwright against installed **Google Chrome 149.0.7827.156 on macOS 26.3.1 (a)**. Headless Chrome, emulated 390×844 touch/DPR2 plus 320/360/390/768 width checks; full responsive suite covers phone landscape/tablets/desktop. No physical handset was used.

`npm run test:accessibility` exercises keyboard menu entry, Space activation, checkbox/select operation, forward focus wrapping, Escape restoration, real keyboard movement, settings pause/no accidental resume, persisted choices, OS motion changes, absence of per-tick live announcements, reduced-motion zero particles, 200% root-font reflow and visible Done, touch target geometry and Chrome's accessible tree. Screenshots were inspected for high contrast and enlarged settings. Browser regression separately exercises full real-time rounds, results/replay and mute.

Evidence is in `tests/artifacts/accessibility/`: `results.json`, `accessibility-tree.json`, `settings.png`, `high-contrast.png`, `320-text-200.png`. Root-font scaling is the exact technique tested; it does not substitute for native Android font/display-size testing or every browser's zoom UI.

VoiceOver is installed, but the computer-use approval check denied Safari access. **No VoiceOver test passed or was performed.** TalkBack, NVDA, physical keyboard/phone switch access, color-vision/low-vision participant sessions, and Android display scaling remain untested. A browser accessibility tree is structural evidence, not a screen reader.

## Remaining limitations and concrete nonvisual plan

The harbor is a continuous canvas with targets, islands and dynamic suction. Current tones communicate events, not direction, navigable routes or the identity/distance of the next target. Merely adding frequent target announcements would compete with the live round and could be misleading behind obstacles. No incomplete “blind mode” was added.

A future opt-in navigation-assist prototype should:

1. Offer a paused orientation tutorial and an on-demand status key/button with time, stage, score and nearest **reachable** eligible target. Directions must be screen-relative and update after camera movement; expose a repeat/quiet control.
2. Add user-selected target cycling, spoken name/bearing/distance and optional stereo beacon. Keep distinct obstacle/shallow warning cues and a mono-compatible alternative. Avoid speech during unrelated UI announcements.
3. Offer an alternate route-follow/step-navigation control using actual water-path geometry, with explicit route cancel, next target and hazard avoidance. Preserve default scoring/controls; label assisted scores separately only after owner/design review, not by silently changing the economy.
4. Prototype without the countdown first, then test the original 90-second mode. Determine with blind players whether timed play is practical or whether a distinct unranked exploration mode is needed. Do not simply extend every ordinary round.
5. Recruit blind and low-vision players; test VoiceOver/Safari, TalkBack/Android WebView and desktop NVDA. Success criteria: independently launch, learn controls, locate/collect multiple target tiers, recover from an obstacle, identify/pause/resume/end/replay, alter audio/privacy settings, and understand final score without sighted help. Record task completion, speech interruption rate and user feedback before making an accessibility claim.

Before release, run manual screen-reader reading order/announcements, keyboard-only focus in all states, contrast assessment of essential text/graphics, OS font scaling and low-end-device performance with users who rely on these features.
