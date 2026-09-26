# Tuning notes

All distances are world pixels unless explicitly described as CSS pixels. `src/config.ts` is the tuning source. The round remains **90 seconds**, with the original six growth thresholds/radii and per-object XP/score values. No attraction, swirl or capture timing values changed in this pass.

## Steering

| Setting | Before → current | Purpose |
| --- | --- | --- |
| `movement.speed` | 285 → 285 px/s | Desktop mouse/keyboard top speed |
| `movement.acceleration` | 11 → 11 /s | Desktop response |
| `movement.joystickRadius` | 58 → 36 → **42 CSS px** | Latest mobile polish softens proportional short drags by 14.3%; full-speed chase retained |
| `movement.touchSpeed` | shared 285 → 340 px/s | Phone traversal (+19.3%); independent of suction |
| `movement.touchAcceleration` | shared 11 → 24 /s | Touch acceleration/braking; exponential 95% response ≈125 ms instead of ≈272 ms |
| `movement.touchDeadzone` | shared 0.08 → 0.06 | Approximately 2.52 CSS px at the current 42px radius; avoids stationary finger jitter |
| `movement.touchCameraResponse` | shared 5 → 10 /s | Less camera lag while touching; desktop remains 5 |
| `movement.navigationRadius` | 24 → 24 px | Compact collision body at every growth stage |
| `reef.speedMultiplier` | 0.48 → 0.48 | Intentional shallow-water penalty; unchanged |

The main bug was geometric: touch movement was normalized from the initial touch-down forever. A 220px drag followed by an 80px reversal still commanded movement in the old direction. `floatingOrigin` now trails the finger once it exceeds the stick radius. Short drags retain an anchored proportional region; long drags no longer require retracing their whole distance. Touch-end/outside, pause and restart clear input. Keyboard input takes precedence and uses the original response.

Phaser pointer coordinates use the backing canvas scale. Multiplying the CSS stick radius by the capped rendering pixel ratio is correct, not a double-scaling bug. DPR 1/2/3 emulation confirmed comparable response. Movement was never reduced by growth size. Shared 285px/s speed, gentle response and the fixed origin together caused the perceived lag; no render bottleneck was reproduced on this desktop host. Actual phone performance remains unmeasured.

## Suction and progression — preserved

`extraRadius=68`, `force=170`, `swirl=0.6`, `captureFraction=0.58`. Growth XP: **0, 22, 85, 220, 520, 1050**. Radii: **25, 32, 42, 54, 69, 88**. Bottle/driftwood/crate/buoy/rowboat/fishing/tug/cargo scores remain **15/20/40/35/100/230/450/900**. Opening placements and seeded art/map stay intact.

## Harbor supply

The old system attempted one uniformly chosen replacement every 1.1s, with eligible classes capped at tier 3 (fishing). Initial tugs and cargo were finite: **none could ever respawn**. No entity lifetime or off-screen entry queue exists. Ships oscillate ±64px around safe origins rather than entering from outside the map. The 100-object cap includes live debris, not just useful ships. Captured ships leave supply counts immediately, even while their presentation effect finishes (now 360ms, or 180ms with reduced motion).

The new `shipNeeded` policy counts **capturable fishing/tug/cargo only**. Locked vessels and low-value objects do not satisfy the targets.

| Spawn setting | Current behavior |
| --- | --- |
| `valuableMinimum` | Stages 1–3: 0; stage 4: 2; stage 5: 3; stage 6: 3 |
| `valuableCap` | Do not add a valuable replacement when 5 valuable ships already remain. Opening population can exceed this; this is a replenishment ceiling, not deletion. |
| `shipDelay` | At most one valuable arrival per 2 active seconds; unused time cannot release a batch |
| `cargoDelay` | After stage 6 loses its last cargo ship, wait 8 active seconds before prioritizing one replacement; the 2s shared spacing can extend this to <10s |
| `tugDelay` | After stage 5/6 loses its last tug, wait 5 active seconds before prioritizing one; shared spacing and cargo priority can extend this to about 9s |
| Composition | Cargo deficit first when due, then tug, then fishing to fill the minimum. Fishing keeps the harbor useful during big-ship cooldowns. No replacement before its tier is unlocked. |
| `retryDelay` | If safe placement fails, retry after 0.5s; never force an unsafe spawn |
| `shipMinDistance`, `shipMaxDistance` | 500–950px from the player at arrival, with a sampled clear navigation path; ≈1.8–3.3s desktop travel in open water |
| `arrivalFade` | 650ms visual arrival at a safe in-map location; no long off-screen journey or invisible queue |
| `playerClearance` | Existing 115px plus player/object radii, in addition to arrival distance |
| `vesselFootprint`, `vesselExcursion` | Existing 1.5× hull clearance and 64px half-route; check route endpoints ±85px in water |
| `maxObjects`, `reservedShipSlots` | Hard cap 100; ambient spawning stops at 92, reserving 8 slots |
| `ambientCaps` | Stages 1–3: 100; stage 4: 45; stage 5: 32; stage 6: 24 low-value live objects. Stop adding excess; never delete a player's targets. |
| `interval` | Ambient attempts remain 1.1s. Original eligible choices through stage 4; stages 5/6 ambient draws stop at rowboats, leaving valuable supply to the population policy. |

Tugs/cargo reuse established clear shipping lanes. Replacements cycle candidate lanes instead of repeatedly selecting one based on a depleted fleet's count. Each arrival rejects land, docks, overlapping hull footprints and routes that obstruct immediate player pursuit. Safe locations are deliberately used instead of off-screen entrances: this keeps targets chaseable before the timer expires. Placement may defer in crowded water; the population target is a replenishment objective, not an inviolable floor during captures. Ships remain useful while the player travels elsewhere, even if a later pursuit needs navigation around an island.

An initial experiment replaced missing cargo every three seconds. A ship-focused bot scored 24,635 against 11,940 on the original game: rejected as excessive inflation. Current pacing separates fishing availability from tug/cargo replacement. See `docs/TESTING.md` for final complete-round counts, delays and score comparisons. Automated navigation is more efficient than a new human player; final phone feel and score economy still need human review before deploying.

The final-stage HUD now says **CHASE SHIPS · BEAT YOUR BEST**. It does not promise another growth level. Particle cap remains 95; no unlimited spawner or late-round rate multiplier was introduced.

## Mobile polish — 27 September 2026

Only joystick radius changed in gameplay configuration: 36 → 42 CSS pixels. Touch top speed (340), response (24), normalized deadzone (0.06), camera response (10), desktop movement, capture rules and ship replenishment remain unchanged. The HUD now occupies a separate top row on narrow/short viewports. Captured sprites have a foreground inward spiral; eligible ships have clearer minimap markers. See [MOBILE-POLISH.md](MOBILE-POLISH.md) for measured controls, route-dependent scores, limits and review evidence.
