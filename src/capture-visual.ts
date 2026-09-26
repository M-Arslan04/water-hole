/** Presentation only: scoring and removal from collision happen before this flight. */
export interface CaptureFlight { distance: number; angle: number; rotation: number; scale: number; reduced: boolean; }
export function capturePose(flight: CaptureFlight, elapsed: number) {
  const t = Math.max(0, Math.min(1, elapsed / (flight.reduced ? 0.18 : 0.36)));
  const angle = flight.angle + (flight.reduced ? 0 : Math.PI * 1.15 * t);
  const radius = flight.distance * (1 - t) ** 1.5;
  return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius,
    rotation: flight.rotation + (flight.reduced ? 0 : Math.PI * t),
    scale: flight.scale * (1 - t * .92), alpha: 1 - t ** 3, done: t >= 1 };
}
