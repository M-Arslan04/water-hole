import { CONFIG, ENTITIES, type EntityKind } from './config';
import { isWater } from './rules';

/** Only live, capturable fishing boats and larger vessels count as valuable supply. */
export function shipNeeded(stage: number, kinds: EntityKind[], missing = { cargo: Infinity, tug: Infinity }): EntityKind | undefined {
  if (stage < 3) return;
  const valuable = kinds.filter(k => ENTITIES[k].tier >= 3 && ENTITIES[k].tier <= stage);
  if (valuable.length >= CONFIG.spawn.valuableCap) return;
  if (stage === 5 && !valuable.includes('cargo') && missing.cargo >= CONFIG.spawn.cargoDelay) return 'cargo';
  if (stage >= 4 && !valuable.includes('tug') && missing.tug >= CONFIG.spawn.tugDelay) return 'tug';
  if (valuable.length < CONFIG.spawn.valuableMinimum[stage]) return 'fishing';
}

/** New arrivals must have a short, unobstructed pursuit path, not an off-screen queue. */
export function reachableArrival(player: { x: number; y: number }, x: number, y: number) {
  const distance = Math.hypot(x - player.x, y - player.y);
  if (distance < CONFIG.spawn.shipMinDistance || distance > CONFIG.spawn.shipMaxDistance) return false;
  const steps = Math.ceil(distance / 12);
  for (let i = 0; i <= steps; i++) if (!isWater(player.x + (x - player.x) * i / steps, player.y + (y - player.y) * i / steps, CONFIG.movement.navigationRadius)) return false;
  return true;
}
