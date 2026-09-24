# Tuning notes

The game uses world pixels independently of viewport size. Edit `src/config.ts` for gameplay tuning. Rendering scales to the display with a maximum pixel ratio of 2.

| Setting | Current | Effect |
| --- | --- | --- |
| `roundSeconds` | 90 s | Active play duration; paused time is excluded |
| `movement.speed` | 285 px/s | Full-stick/key movement speed |
| `movement.acceleration` | 11 | Exponential response; larger values feel more immediate |
| `movement.joystickRadius` | 58 CSS px | Touch travel required for full speed |
| `movement.navigationRadius` | 24 px | Navigation body; decorative outer suction rings may overlap shore |
| `suction.extraRadius` | 68 px | Attraction zone added to current whirlpool radius |
| `suction.force` | 170 px/s | Base pull speed, strengthened near the center |
| `suction.swirl` | 0.6 | Tangential curve on the inward pull |
| `suction.captureFraction` | 0.58 | Capture distance relative to whirlpool radius, plus object allowance |
| Stage XP thresholds | 0, 22, 85, 220, 520, 1050 | Unlock debris, crates/buoys, rowboats, fishing boats, tugs, cargo |
| Stage radii | 25, 32, 42, 54, 69, 88 px | Visible growth; interpolated to prevent abrupt jumps |
| `reef.speedMultiplier` | 0.48 | Shallow water movement penalty; immediate recovery outside reef |
| `reef.warningCooldown` | 4 s | Prevents repeated hazard messages/audio |
| `spawn.interval` | 1.1 s | Attempts one replacement object while below the population cap |
| `spawn.maxObjects` | 100 | Active-object cap; failed safe-placement attempts are skipped |
| `spawn.playerClearance` | 115 px + radii | Replenishment avoids appearing inside the player |
| `spawn.vesselFootprint` | 1.5 × radius | Conservative ship spawn and passing clearance |
| `spawn.vesselExcursion` | 64 px | Half-length of predictable ship travel |
| `effects.maxParticles` | 95 | Visual effect cap |

Each entity definition also sets `tier`, `radius`, `xp`, `score`, `count` and `speed`. The opening ring contains 14 small objects outside the capture center. Initial positioning uses a fixed seed for a learnable map; moving vessels and choices change the capture sequence. Replacements are drawn from already unlocked classes up to fishing boats. Large vessels remain limited, encouraging exploration rather than farming one place.

After the first measured playthrough, later thresholds were raised from 155/310/550 to 220/520/1050. The first version let an efficient automated player unlock cargo within roughly 15 seconds. The revised ladder keeps fishing boats accessible and makes the biggest captures require a more sustained run. Automated pathfinding is more efficient than an unfamiliar human; tune with real first-time player sessions before release.

For a gentler game, lower the fishing/tug thresholds before increasing suction radius, because excessively large suction removes navigation choices. For more replay challenge, vary object placement between rounds only after testing fairness; the prototype intentionally retains one predictable handcrafted harbor.
