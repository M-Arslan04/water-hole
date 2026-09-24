import { CONFIG, OBSTACLES } from './config';
export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export function stageFor(xp: number): number { let stage = 0; CONFIG.stages.forEach((s, i) => { if (xp >= s.xp) stage = i; }); return stage; }
export function progressFor(xp: number): number { const i = stageFor(xp); return i === 5 ? 1 : clamp((xp - CONFIG.stages[i].xp) / (CONFIG.stages[i + 1].xp - CONFIG.stages[i].xp), 0, 1); }
export function isWater(x: number, y: number, r: number): boolean {
  const { width, height, margin } = CONFIG.world;
  if (x < margin + r || y < margin + r || x > width - margin - r || y > height - margin - r) return false;
  return !OBSTACLES.some(o => o.kind === 'circle' ? Math.hypot(x - o.x, y - o.y) < o.radius + r : Math.hypot(x - clamp(x, o.x, o.x + o.width), y - clamp(y, o.y, o.y + o.height)) < r);
}
export function moveInWater(x: number, y: number, dx: number, dy: number, radius: number): { x: number; y: number } {
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 8));
  for (let i = 0; i < steps; i++) { if (isWater(x + dx / steps, y, radius)) x += dx / steps; if (isWater(x, y + dy / steps, radius)) y += dy / steps; }
  return { x, y };
}
export function randomGenerator(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
