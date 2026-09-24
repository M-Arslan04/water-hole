/** A floating stick follows excess drag, so reversing never retraces a long gesture. */
export function floatingOrigin(origin: { x: number; y: number }, point: { x: number; y: number }, radius: number) {
  const dx = point.x - origin.x, dy = point.y - origin.y, distance = Math.hypot(dx, dy);
  return distance > radius ? { x: point.x - dx / distance * radius, y: point.y - dy / distance * radius } : origin;
}
