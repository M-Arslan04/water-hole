import { ENTITIES, OBSTACLES } from './config';
import type { HarborScene, Snapshot } from './game';
/** Navigation hints only. Every marker comes from an existing uncaptured entity. */
export function drawMinimap(ctx: CanvasRenderingContext2D, scene: HarborScene, s: Snapshot) {
  ctx.clearRect(0, 0, 160, 110); ctx.fillStyle = '#a9b69d';
  OBSTACLES.forEach(o => { if (o.kind === 'circle') { ctx.beginPath(); ctx.arc(o.x / 10, o.y / 10, o.radius / 10, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(o.x / 10, o.y / 10, o.width / 10, o.height / 10); });
  const c = scene.cameras.main, w = c.width / c.zoom, h = c.height / c.zoom;
  ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 1.5;
  ctx.strokeRect(Math.max(0, c.midPoint.x - w / 2) / 10, Math.max(0, c.midPoint.y - h / 2) / 10, Math.min(1600, w) / 10, Math.min(1100, h) / 10);
  const ships = scene.entities.filter(e => !e.captured && ENTITIES[e.kind].tier >= 3 && ENTITIES[e.kind].tier <= s.stage);
  const nearest = ships.reduce<typeof ships[number] | undefined>((best, e) => !best || Math.hypot(e.x - scene.player.x, e.y - scene.player.y) < Math.hypot(best.x - scene.player.x, best.y - scene.player.y) ? e : best, undefined);
  scene.entities.forEach(e => {
    if (e.captured || ENTITIES[e.kind].tier < 2) return;
    const x = e.x / 10, y = e.y / 10, eligible = ENTITIES[e.kind].tier <= s.stage;
    if (eligible && ENTITIES[e.kind].tier >= 3) {
      ctx.fillStyle = scene.highContrast ? '#ffffff' : '#c5e697'; ctx.strokeStyle = '#061d29'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (e === nearest) { ctx.strokeStyle = '#ffe3a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke(); }
    } else { ctx.fillStyle = eligible ? '#c5e697' : '#82999c'; ctx.fillRect(x - 1, y - 1, 2, 2); }
  });
  ctx.fillStyle = '#ffe3a0'; ctx.strokeStyle = '#061d29'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(scene.player.x / 10, scene.player.y / 10, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  return `Harbor map. You are the filled circle; the rectangle is your view. ${ships.length} collectible ships marked with diamonds. ${nearest ? `The ring marks the nearest ${ENTITIES[nearest.kind].name.toLowerCase()}.` : ''}`;
}
