/** Gameplay tuning. Distances are world pixels; speeds are world pixels/second. */
export const CONFIG = {
  roundSeconds: 90,
  world: { width: 1600, height: 1100, margin: 38 },
  start: { x: 790, y: 620 },
  movement: { speed: 285, acceleration: 11, joystickRadius: 36, navigationRadius: 24,
    touchSpeed: 340, touchAcceleration: 24, touchDeadzone: 0.06, touchCameraResponse: 10 },
  suction: { extraRadius: 68, force: 170, swirl: 0.6, captureFraction: 0.58 },
  reef: { speedMultiplier: 0.48, warningCooldown: 4 },
  spawn: { interval: 1.1, maxObjects: 100, playerClearance: 115, vesselFootprint: 1.5, vesselExcursion: 64,
    // Population targets are deficits, not unconditional spawn rates. One vessel per delay.
    valuableMinimum: [0, 0, 0, 2, 3, 3], valuableCap: 5, shipDelay: 2, cargoDelay: 8, tugDelay: 5, retryDelay: 0.5,
    reservedShipSlots: 8, ambientCaps: [100, 100, 100, 45, 32, 24],
    shipMinDistance: 500, shipMaxDistance: 950, arrivalFade: 650 },
  effects: { maxParticles: 95, lifetime: 0.65 },
  stages: [
    { name: 'Little ripple', target: 'Driftwood', xp: 0, radius: 25 },
    { name: 'Making waves', target: 'Crates & buoys', xp: 22, radius: 32 },
    { name: 'Current mood', target: 'Rowboats', xp: 85, radius: 42 },
    { name: 'Harbor hungry', target: 'Fishing boats', xp: 220, radius: 54 },
    { name: 'Deep trouble', target: 'Tugboats', xp: 520, radius: 69 },
    { name: 'Force of nature', target: 'Cargo ships', xp: 1050, radius: 88 },
  ],
} as const;
export const OBSTACLES = [
  { kind: 'circle', x: 253, y: 795, radius: 99 },
  { kind: 'circle', x: 1348, y: 241, radius: 108 },
  { kind: 'rect', x: 0, y: 275, width: 233, height: 58 },
  { kind: 'rect', x: 1360, y: 670, width: 240, height: 65 },
  { kind: 'rect', x: 55, y: 0, width: 48, height: 160 },
] as const;
export const REEFS = [{ x: 520, y: 345, radius: 81 }, { x: 1130, y: 785, radius: 88 }];
export type EntityKind = 'bottle' | 'driftwood' | 'crate' | 'buoy' | 'rowboat' | 'fishing' | 'tug' | 'cargo';
export interface EntityDefinition { name: string; tier: number; radius: number; xp: number; score: number; count: number; speed: number; }
export const ENTITIES: Record<EntityKind, EntityDefinition> = {
  bottle: { name: 'Bottle', tier: 0, radius: 9, xp: 3, score: 15, count: 20, speed: 0 },
  driftwood: { name: 'Driftwood', tier: 0, radius: 12, xp: 4, score: 20, count: 20, speed: 0 },
  crate: { name: 'Crate', tier: 1, radius: 16, xp: 8, score: 40, count: 14, speed: 0 },
  buoy: { name: 'Buoy', tier: 1, radius: 14, xp: 7, score: 35, count: 12, speed: 0 },
  rowboat: { name: 'Rowboat', tier: 2, radius: 24, xp: 18, score: 100, count: 12, speed: 13 },
  fishing: { name: 'Fishing boat', tier: 3, radius: 34, xp: 38, score: 230, count: 7, speed: 18 },
  tug: { name: 'Tugboat', tier: 4, radius: 44, xp: 70, score: 450, count: 4, speed: 15 },
  cargo: { name: 'Cargo ship', tier: 5, radius: 62, xp: 110, score: 900, count: 3, speed: 11 },
};
