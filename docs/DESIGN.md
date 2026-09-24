# Water Hole — design and implementation plan

Create an original, standalone 90-second growth arcade game in a compact, sunny harbor. The player steers a whirlpool, pulls in eligible objects, grows through six classes and hunts a cargo ship. Score chasing, readable milestones and quick replay are the entire loop.

Assumptions: one handcrafted map; no lives or loss state; shallow reefs slow movement without removing growth; no online services; working title pending clearance. A responsive camera shows more of the harbor on desktop and follows the player on portrait phones. A minimap keeps navigation legible. Keyboard or held mouse steers on desktop, a relative floating joystick steers on touch, keeping the finger away from the whirlpool. No motion from merely crossing the HUD.

Implementation order: (1) centralized values and deterministic rules, (2) Phaser world, input, capture/growth, timer and restart, (3) DOM overlays/HUD, original canvas textures and synthesized effects, (4) actual desktop/touch browser playthroughs and tuning, (5) static production checks and separately sourced Playables readiness notes.

Visual direction: navy editorial game shell, butter-yellow display lettering, sunlit turquoise water, soft dimensional boat silhouettes, ivory paper panels and orange hazard accents. Assets are drawn locally in code, with no fonts or art downloaded at runtime.
