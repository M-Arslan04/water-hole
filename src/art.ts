import Phaser from 'phaser';
import { CONFIG, OBSTACLES, REEFS, type EntityKind } from './config';
import { randomGenerator } from './rules';
type Ctx = CanvasRenderingContext2D;
const ellipse = (c: Ctx, x: number, y: number, rx: number, ry: number, color: string) => { c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fill(); };
const rect = (c: Ctx, x: number, y: number, w: number, h: number, color: string, r = 0) => { c.fillStyle = color; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
function line(c: Ctx, points: number[][], color: string, width = 2) { c.strokeStyle = color; c.lineWidth = width; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }
function hull(c: Ctx, w: number, h: number, color: string) {
  c.fillStyle = color; c.beginPath(); c.moveTo(-w * 0.48, -h * 0.39); c.quadraticCurveTo(w * 0.12, -h * 0.67, w * 0.52, 0); c.quadraticCurveTo(w * 0.12, h * 0.67, -w * 0.48, h * 0.39); c.quadraticCurveTo(-w * 0.56, 0, -w * 0.48, -h * 0.39); c.fill();
}
export function paintEntity(c: Ctx, kind: EntityKind) {
  c.save();
  if (kind === 'bottle') { c.rotate(-0.4); rect(c, -6, -12, 12, 24, '#105d59', 4); rect(c, -4, -16, 8, 6, '#f1dc9c', 2); rect(c, -5, -5, 10, 10, '#fcf1c5', 1); line(c, [[-3, -10], [-3, -7]], '#71cab0', 2); }
  if (kind === 'driftwood') { c.rotate(0.3); rect(c, -16, -6, 32, 12, '#754d38', 4); rect(c, -14, -7, 30, 9, '#d2a477', 4); line(c, [[-9, -3], [7, -3]], '#e5c39a', 2); }
  if (kind === 'crate') { rect(c, -17, -14, 34, 32, '#896744', 3); rect(c, -16, -17, 32, 31, '#eac18d', 3); rect(c, -12, -13, 24, 23, '#b48b5c', 1); line(c, [[-12, -13], [12, 10]], '#f9dba2', 4); line(c, [[12, -13], [-12, 10]], '#f9dba2', 4); }
  if (kind === 'buoy') { ellipse(c, 0, 4, 18, 13, '#084c62'); ellipse(c, 0, 0, 16, 13, '#f5eed9'); ellipse(c, 0, -1, 10, 9, '#f16e48'); rect(c, -4, -16, 8, 16, '#ff885b', 3); ellipse(c, 0, -16, 5, 3, '#ffe8ab'); }
  if (kind === 'rowboat') { hull(c, 66, 29, '#835749'); hull(c, 61, 26, '#ffad61'); hull(c, 45, 17, '#9c5e3e'); rect(c, -17, -9, 6, 18, '#ffe1a0', 1); rect(c, 3, -9, 6, 18, '#ffe1a0', 1); line(c, [[-14, -29], [14, 29]], '#f9ebce', 3); line(c, [[-14, 29], [14, -29]], '#f9ebce', 3); }
  if (kind === 'fishing') { hull(c, 96, 42, '#174862'); hull(c, 90, 38, '#faf1d9'); hull(c, 78, 30, '#e17952'); rect(c, -18, -14, 35, 28, '#e3d8b6', 5); rect(c, -15, -16, 30, 25, '#fff9e5', 5); rect(c, 7, -12, 7, 17, '#426e80', 2); rect(c, -9, -11, 9, 6, '#a8d3d5', 2); line(c, [[-24, -27], [-17, -4], [-25, 30]], '#e4d0a1', 2); ellipse(c, -32, 0, 5, 8, '#354e63'); rect(c, 21, -6, 12, 12, '#f4c56d', 2); }
  if (kind === 'tug') { hull(c, 120, 58, '#173747'); hull(c, 113, 51, '#e7b854'); hull(c, 100, 42, '#efe9cb'); rect(c, -12, -20, 43, 38, '#c69040', 5); rect(c, -15, -23, 41, 38, '#f7cf69', 5); rect(c, 16, -18, 8, 27, '#305967', 2); rect(c, -8, -17, 18, 24, '#fff3cc', 3); rect(c, -29, -9, 12, 18, '#ed7854', 3); ellipse(c, -25, -4, 4, 5, '#354351'); [-41, -19, 5, 32].forEach(x => { ellipse(c, x, 25, 6, 5, '#294956'); ellipse(c, x, -25, 6, 5, '#294956'); }); }
  if (kind === 'cargo') { hull(c, 182, 65, '#123d52'); hull(c, 177, 59, '#f28762'); hull(c, 160, 49, '#edc599'); rect(c, -72, -25, 30, 49, '#ecf1de', 4); rect(c, -62, -20, 16, 40, '#ffffff', 3); [-15, -4, 7].forEach(y => rect(c, -52, y, 7, 6, '#557f88', 1)); const colors = ['#287d87', '#e9b84d', '#e9e8c9', '#7eb099', '#c6674f', '#427284']; for (let i = 0; i < 6; i++) { const x = -36 + Math.floor(i / 2) * 31, y = i % 2 ? 2 : -23; rect(c, x, y + 3, 27, 22, '#456b67', 1); rect(c, x, y, 27, 22, colors[i], 1); for (let j = 1; j < 5; j++) line(c, [[x + j * 5, y + 3], [x + j * 5, y + 18]], 'rgba(255,255,255,.17)', 1); } line(c, [[64, -12], [69, 0], [64, 12]], '#ffdcae', 3); }
  c.restore();
}
function texture(scene: Phaser.Scene, key: string, width: number, height: number, painter: (ctx: Ctx) => void) {
  const texture = scene.textures.createCanvas(key, width, height)!; painter(texture.context); texture.refresh();
}
function palm(c: Ctx, x: number, y: number, size = 1) {
  c.save(); c.translate(x, y); c.scale(size, size); ellipse(c, 13, 15, 30, 16, '#7ea67955'); line(c, [[4, 11], [0, 0], [-4, -17]], '#957444', 7);
  for (let i = 0; i < 6; i++) { c.save(); c.translate(-4, -17); c.rotate(i * Math.PI / 3 + 0.2); c.fillStyle = i % 2 ? '#3b9175' : '#267463'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(15, -17, 37, -6); c.quadraticCurveTo(19, -1, 0, 0); c.fill(); line(c, [[3, -2], [29, -7]], '#70ad74', 1); c.restore(); } c.restore();
}
export function createArt(scene: Phaser.Scene) {
  const rng = randomGenerator(2295);
  texture(scene, 'harbor', 1600, 1100, c => {
    const gradient = c.createLinearGradient(0, 0, 1450, 1100); gradient.addColorStop(0, '#268f9e'); gradient.addColorStop(0.42, '#208699'); gradient.addColorStop(1, '#136c86'); c.fillStyle = gradient; c.fillRect(0, 0, 1600, 1100);
    // Long current bands give the harbor depth without a busy tiled texture.
    for (let i = 0; i < 14; i++) { c.strokeStyle = i % 2 ? '#65c5b90a' : '#032d4b07'; c.lineWidth = 38 + rng() * 70; c.beginPath(); c.moveTo(-100, i * 120); c.bezierCurveTo(500, i * 90 - 300, 700, i * 140 + 200, 1700, i * 90); c.stroke(); }
    for (let i = 0; i < 850; i++) { const x = rng() * 1600, y = rng() * 1100; line(c, [[x - 7, y], [x, y + 2], [x + 8, y]], i % 3 ? '#a3e5d51b' : '#c7efe22f', 1.4); }
    REEFS.forEach(r => { ellipse(c, r.x, r.y, r.radius + 17, r.radius * 0.72, '#85d2b336'); ellipse(c, r.x, r.y, r.radius, r.radius * 0.65, '#a3c79744'); for (let i = 0; i < 12; i++) { const a = i * 2.4, d = Math.sqrt(rng()) * r.radius * 0.74; ellipse(c, r.x + Math.cos(a) * d, r.y + Math.sin(a) * d * 0.6, 9 + rng() * 12, 5 + rng() * 7, '#aac4a288'); } c.save(); c.setLineDash([4, 8]); c.strokeStyle = '#e7d7a766'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(r.x, r.y, r.radius + 8, r.radius * 0.72 + 8, 0, 0, Math.PI * 2); c.stroke(); c.restore(); });
    OBSTACLES.forEach(o => {
      if (o.kind === 'circle') {
        ellipse(c, o.x, o.y + 8, o.radius + 22, o.radius + 10, '#9cd7bb44'); ellipse(c, o.x, o.y + 6, o.radius + 9, o.radius, '#e9edc988'); ellipse(c, o.x, o.y, o.radius, o.radius - 7, '#ccb891'); ellipse(c, o.x, o.y - 5, o.radius - 2, o.radius - 8, '#f0dcb0'); ellipse(c, o.x - 8, o.y - 11, o.radius - 22, o.radius - 29, '#9cbb83'); ellipse(c, o.x - 12, o.y - 18, o.radius - 27, o.radius - 33, '#b4c794');
        if (o.x < 500) { palm(c, o.x - 28, o.y - 3, 1.1); palm(c, o.x + 23, o.y - 25, 0.8); ellipse(c, o.x + 29, o.y + 40, 17, 11, '#abaf91'); ellipse(c, o.x + 26, o.y + 37, 15, 9, '#d5d4ad'); }
        else { // Lighthouse, seen from slightly above, with a long sunlit shadow.
          c.fillStyle = '#718b7777'; c.beginPath(); c.moveTo(o.x, o.y - 15); c.lineTo(o.x + 90, o.y + 25); c.lineTo(o.x + 55, o.y + 47); c.lineTo(o.x - 17, o.y + 10); c.fill();
          ellipse(c, o.x, o.y, 30, 25, '#d3c69c'); rect(c, o.x - 17, o.y - 48, 34, 52, '#fff3d4', 5); rect(c, o.x - 17, o.y - 33, 34, 14, '#e98465'); rect(c, o.x - 11, o.y - 57, 22, 19, '#285768', 4); ellipse(c, o.x, o.y - 57, 20, 9, '#eb8b68'); ellipse(c, o.x, o.y - 61, 13, 6, '#f6b080'); palm(c, o.x - 53, o.y + 23, 0.85);
        }
      } else {
        rect(c, o.x + 3, o.y + 8, o.width, o.height, '#154f64aa', 5); rect(c, o.x, o.y, o.width, o.height, '#866851', 4); rect(c, o.x, o.y, o.width, o.height - 5, '#bd9972', 4);
        const horizontal = o.width > o.height; for (let p = 8; p < (horizontal ? o.width : o.height); p += 13) line(c, horizontal ? [[o.x + p, o.y + 3], [o.x + p, o.y + o.height - 7]] : [[o.x + 3, o.y + p], [o.x + o.width - 3, o.y + p]], '#8c715777', 2);
        for (let p = 18; p < (horizontal ? o.width : o.height); p += 58) { const x = horizontal ? o.x + p : o.x + 8, y = horizontal ? o.y + 9 : o.y + p; ellipse(c, x, y + 2, 5, 5, '#584d3e'); ellipse(c, x, y, 4, 4, '#f1d1a0'); if (horizontal) { ellipse(c, x, y + o.height - 20, 5, 5, '#584d3e'); ellipse(c, x, y + o.height - 22, 4, 4, '#f1d1a0'); } }
      }
    });
    // Harbor wall framing, mooring rings and modest waterside buildings.
    rect(c, 0, 0, 28, 1100, '#a7b8a4'); rect(c, 1572, 0, 28, 1100, '#a7b8a4'); rect(c, 0, 0, 1600, 27, '#c5ccb0'); rect(c, 0, 1072, 1600, 28, '#c5ccb0');
    for (let i = 0; i < 25; i++) { line(c, [[i * 70, 4], [i * 70, 23]], '#96a596', 2); line(c, [[i * 70, 1077], [i * 70, 1098]], '#96a596', 2); }
    c.font = '600 15px sans-serif'; c.fillStyle = '#caf0dc77'; c.textAlign = 'center'; c.fillText('S U N B R E A K   H A R B O R', 804, 82);
    c.font = 'bold 11px sans-serif'; REEFS.forEach(r => { c.fillStyle = '#e3e2b7aa'; c.fillText('SHALLOWS', r.x, r.y + 85); });
  });
  (['bottle', 'driftwood', 'crate', 'buoy', 'rowboat', 'fishing', 'tug', 'cargo'] as EntityKind[]).forEach(kind => texture(scene, kind, 440, 200, c => { c.scale(2, 2); c.translate(110, 50); paintEntity(c, kind); }));
  texture(scene, 'vortex', 384, 384, c => {
    c.translate(192, 192); const glow = c.createRadialGradient(0, 0, 65, 0, 0, 176); glow.addColorStop(0, '#052742'); glow.addColorStop(0.4, '#084261'); glow.addColorStop(0.67, '#137a91'); glow.addColorStop(0.82, '#8eddd1bb'); glow.addColorStop(1, '#86ddd100'); c.fillStyle = glow; c.fillRect(-192, -192, 384, 384);
    for (let i = 0; i < 7; i++) { c.beginPath(); for (let s = 0; s < 88; s++) { const t = s / 87, a = i * Math.PI * 2 / 7 + t * 4.5, r = 18 + t * 139; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (s === 0) c.moveTo(x, y); else c.lineTo(x, y); } c.strokeStyle = i % 2 ? '#7fdacd' : '#b7f0dc'; c.globalAlpha = 0.66; c.lineWidth = 3 + i % 3; c.stroke(); }
    c.globalAlpha = 1; const hole = c.createRadialGradient(0, 0, 0, 0, 0, 45); hole.addColorStop(0, '#061e36'); hole.addColorStop(0.66, '#062a44'); hole.addColorStop(1, '#062a4400'); c.fillStyle = hole; c.beginPath(); c.arc(0, 0, 46, 0, Math.PI * 2); c.fill();
  });
  texture(scene, 'foam', 384, 384, c => { c.translate(192, 192); for (let i = 0; i < 25; i++) { const a = i * 2.4, r = 128 + rng() * 37; ellipse(c, Math.cos(a) * r, Math.sin(a) * r, 2 + rng() * 3, 2, '#d8fae2bb'); } });
  texture(scene, 'particle', 12, 12, c => ellipse(c, 6, 6, 5, 5, '#f8f3c4'));
}
export function entityIcon(kind: EntityKind): string {
  const canvas = document.createElement('canvas'); canvas.width = 220; canvas.height = 100;
  const c = canvas.getContext('2d')!;
  // Explicitly clear recycled canvas backing storage in Android WebViews.
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.translate(110, 50); paintEntity(c, kind); return canvas.toDataURL();
}
export const WORLD_SIZE = CONFIG.world;
