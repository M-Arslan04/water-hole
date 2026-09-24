import Phaser from 'phaser';
import { CONFIG, ENTITIES, REEFS, type EntityKind } from './config';
import { clamp, isWater, moveInWater, progressFor, randomGenerator, stageFor } from './rules';
import { createArt } from './art';
import { Steering } from './input';
import { reachableArrival, shipNeeded } from './spawning';
import { GameAudio } from './audio';
import type { PlatformAdapter } from './platform';
export type Mode = 'welcome' | 'playing' | 'paused' | 'finished';
export interface Snapshot { mode: Mode; score: number; best: number; xp: number; stage: number; progress: number; time: number; captured: number; largest: string; largestKind: EntityKind | null; moved: boolean; slowed: boolean; }
interface Entity { id: number; kind: EntityKind; x: number; y: number; originX: number; originY: number; sprite: Phaser.GameObjects.Image; angle: number; phase: number; captured: boolean; }
interface Particle { sprite: Phaser.GameObjects.Image; vx: number; vy: number; life: number; }
export class HarborScene extends Phaser.Scene {
  mode: Mode = 'welcome'; score = 0; xp = 0; remaining: number = CONFIG.roundSeconds; best = 0; captured = 0; largest: EntityKind | null = null;
  player = { x: Number(CONFIG.start.x), y: Number(CONFIG.start.y), vx: 0, vy: 0, radius: 25 };
  entities: Entity[] = []; private particles: Particle[] = []; private feedback: Phaser.GameObjects.Text[] = [];
  private vortex!: Phaser.GameObjects.Image; private foam!: Phaser.GameObjects.Image; private effects!: Phaser.GameObjects.Graphics; private wakes!: Phaser.GameObjects.Graphics; private steering!: Steering;
  private nextId = 0; private rng = randomGenerator(23891); private spawnClock = 0; private clock = 0; private hazardCooldown = 0; private growthPulse = 0; private lastUi = 0; private largestTier = -1;
  private shipClock = 0; private shipWait = 0; private shipRetry = 0;
  private missingShips = { cargo: 0, tug: 0 };
  private spawnEvents: { time: number; kind: EntityKind; x: number; y: number; wait: number; distance: number; valuable: number; objects: number }[] = [];
  private frameDurations: number[] = []; private previousFrame = 0;
  private unsubscribe?: () => void;
  onSnapshot: (s: Snapshot) => void = () => {}; onToast: (text: string, type?: string) => void = () => {}; onReady: () => void = () => {};
  constructor(public audio: GameAudio, private platform: PlatformAdapter, private pixelRatio = 1) { super('harbor'); }
  create() {
    if (this.scale.width / this.pixelRatio < 650) this.player.y = 280;
    createArt(this); this.add.image(800, 550, 'harbor'); this.wakes = this.add.graphics().setDepth(1); this.effects = this.add.graphics().setDepth(7);
    this.vortex = this.add.image(this.player.x, this.player.y, 'vortex').setDepth(4); this.foam = this.add.image(this.player.x, this.player.y, 'foam').setDepth(6);
    this.steering = new Steering(this, this.pixelRatio); void Promise.resolve(this.platform.loadBest()).then(best => { this.best = Math.max(this.best, best); this.emitSnapshot(); }).catch(() => {}); this.populate(); this.resize();
    this.scale.on('resize', this.resize, this); this.input.keyboard!.on('keydown-ESC', () => this.mode === 'playing' ? this.pauseRound() : this.mode === 'paused' ? this.resumeRound() : undefined);
    this.unsubscribe = this.platform.onPause(() => this.pauseRound());
    this.events.once('shutdown', () => { this.unsubscribe?.(); this.scale.off('resize', this.resize, this); });
    this.onReady(); this.emitSnapshot();
  }
  private resize() {
    const { width, height } = this.scale; const camera = this.cameras.main;
    const zoom = width / this.pixelRatio < 650 ? Math.max(width / 720, height / 1100) : Math.max(width / 1600, height / 1100);
    camera.setZoom(zoom); camera.setBounds(0, 0, 1600, 1100); camera.centerOn(this.player.x, this.player.y);
  }
  snapshot(): Snapshot { const stage = stageFor(this.xp); return { mode: this.mode, score: this.score, best: this.best, xp: this.xp, stage, progress: progressFor(this.xp), time: Math.ceil(this.remaining), captured: this.captured, largest: this.largest ? ENTITIES[this.largest].name : 'No catches yet', largestKind: this.largest, moved: this.steering?.moved ?? false, slowed: this.isSlowed() }; }
  private emitSnapshot() { this.onSnapshot(this.snapshot()); }
  startRound() {
    this.shipClock = 0; this.shipWait = 0; this.shipRetry = 0; this.missingShips = { cargo: 0, tug: 0 }; this.spawnEvents = [];
    this.audio.resume(); this.mode = 'playing'; this.score = 0; this.xp = 0; this.remaining = CONFIG.roundSeconds; this.captured = 0; this.largest = null; this.largestTier = -1; this.spawnClock = 0; this.hazardCooldown = 0; this.growthPulse = 0;
    this.player = { x: CONFIG.start.x, y: CONFIG.start.y, vx: 0, vy: 0, radius: 25 }; this.steering.reset(); this.steering.moved = false; this.clearEffects(); this.populate(); this.resize(); this.emitSnapshot();
  }
  pauseRound() { if (this.mode !== 'playing') return; this.mode = 'paused'; this.steering.reset(); this.audio.pause(); this.emitSnapshot(); }
  resumeRound() { if (this.mode !== 'paused') return; this.audio.resume(); this.steering.reset(); this.mode = 'playing'; this.emitSnapshot(); }
  private finishRound() { this.mode = 'finished'; this.steering.reset(); this.audio.finish(); if (this.score > this.best) { this.best = this.score; void Promise.resolve(this.platform.saveBest(this.best)).catch(() => {}); } void Promise.resolve(this.platform.roundFinished(this.score)).catch(() => {}); this.emitSnapshot(); }
  private clearEffects() { this.particles.forEach(p => p.sprite.destroy()); this.particles = []; this.feedback.forEach(t => t.destroy()); this.feedback = []; this.tweens.killAll(); }
  private populate() {
    this.entities.forEach(e => e.sprite.destroy()); this.entities = []; this.rng = randomGenerator(23891); this.nextId = 0;
    // A readable opening ring ensures the first movement always finds something edible.
    for (let i = 0; i < 14; i++) { const a = i * Math.PI * 2 / 14, r = 76 + (i % 3) * 27; this.spawn(i % 2 ? 'driftwood' : 'bottle', this.player.x + Math.cos(a) * r, this.player.y + Math.sin(a) * r); }
    (Object.keys(ENTITIES) as EntityKind[]).forEach(kind => { const amount = ENTITIES[kind].count - (ENTITIES[kind].tier === 0 ? 7 : 0); for (let i = 0; i < amount; i++) this.spawn(kind); });
  }
  private spawn(kind: EntityKind, forceX?: number, forceY?: number, arrival = false) {
    const def = ENTITIES[kind], footprint = def.radius * (def.speed ? CONFIG.spawn.vesselFootprint : 1); let x = forceX ?? 0, y = forceY ?? 0, valid = forceX !== undefined;
    if (!valid) for (let tries = 0; tries < 160; tries++) { x = 65 + this.rng() * 1470; y = 65 + this.rng() * 970;
      // Vessels stay in separated, unobstructed horizontal shipping lanes.
      if (kind === 'cargo') { x = 410 + this.rng() * 670; y = [160, 490, 960][(arrival ? tries : this.entities.filter(e => e.kind === kind && !e.captured).length) % 3]; }
      if (kind === 'tug') { x = 360 + this.rng() * 780; y = [270, 400, 760, 915][(arrival ? tries : this.entities.filter(e => e.kind === kind && !e.captured).length) % 4]; }
      const motionClearance = def.speed > 0 ? 85 : 0;
      if (!isWater(x, y, footprint + 8) || !isWater(x - motionClearance, y, footprint + 8) || !isWater(x + motionClearance, y, footprint + 8)) continue;
      if (Math.hypot(x - this.player.x, y - this.player.y) < CONFIG.spawn.playerClearance + this.player.radius + def.radius) continue;
      if (arrival && !reachableArrival(this.player, x, y)) continue;
      if (this.entities.some(e => !e.captured && Math.hypot(x - e.x, y - e.y) < footprint + ENTITIES[e.kind].radius * (ENTITIES[e.kind].speed ? CONFIG.spawn.vesselFootprint : 1) + 12)) continue;
      valid = true; break;
    }
    if (!valid) return false;
    const angle = def.speed ? 0 : this.rng() * Math.PI * 2; const sprite = this.add.image(x, y, kind).setScale(0.5).setRotation(angle).setDepth(3);
    this.entities.push({ id: this.nextId++, kind, x, y, originX: x, originY: y, sprite, angle, phase: this.rng() * Math.PI * 2, captured: false });
    if (arrival) {
      sprite.setAlpha(0); this.tweens.add({ targets: sprite, alpha: 1, duration: CONFIG.spawn.arrivalFade });
      if (import.meta.env.DEV) this.spawnEvents.push({ time: CONFIG.roundSeconds - this.remaining, kind, x, y, wait: kind === 'cargo' ? this.missingShips.cargo : kind === 'tug' ? this.missingShips.tug : this.shipWait, distance: Math.hypot(x - this.player.x, y - this.player.y), valuable: this.entities.filter(e => !e.captured && ENTITIES[e.kind].tier >= 3 && ENTITIES[e.kind].tier <= stageFor(this.xp)).length, objects: this.entities.filter(e => !e.captured).length });
    }
    return true;
  }
  private replenish(dt: number) {
    const stage = stageFor(this.xp), live = this.entities.filter(e => !e.captured);
    this.missingShips.cargo = stage === 5 && !live.some(e => e.kind === 'cargo') ? this.missingShips.cargo + dt : 0;
    this.missingShips.tug = stage >= 4 && !live.some(e => e.kind === 'tug') ? this.missingShips.tug + dt : 0;
    const needed = shipNeeded(stage, live.map(e => e.kind), this.missingShips);
    this.shipClock += dt; this.shipRetry = Math.max(0, this.shipRetry - dt);
    if (needed) {
      this.shipWait += dt;
      if (this.shipClock >= CONFIG.spawn.shipDelay && !this.shipRetry) {
        if (live.length < CONFIG.spawn.maxObjects && this.spawn(needed, undefined, undefined, true)) {
          this.shipClock = 0; this.shipWait = 0;
        } else this.shipRetry = CONFIG.spawn.retryDelay;
      }
    } else this.shipWait = 0;
    this.spawnClock += dt;
    if (this.spawnClock < CONFIG.spawn.interval) return;
    this.spawnClock = 0;
    this.entities = this.entities.filter(e => !e.captured || e.sprite.active);
    const ambient = live.filter(e => ENTITIES[e.kind].tier < 3).length;
    // Keep slots for ship deficits; low-value objects do not crowd out valuable arrivals.
    if (live.length >= CONFIG.spawn.maxObjects - CONFIG.spawn.reservedShipSlots || ambient >= CONFIG.spawn.ambientCaps[stage]) return;
    const kinds = (Object.keys(ENTITIES) as EntityKind[]).filter(k => ENTITIES[k].tier <= Math.min(stage, stage < 4 ? 3 : 2));
    this.spawn(kinds[Math.floor(this.rng() * kinds.length)]);
  }
  private isSlowed() { return REEFS.some(r => Math.hypot(this.player.x - r.x, (this.player.y - r.y) / 0.72) < r.radius); }
  private capture(e: Entity) {
    if (e.captured) return; e.captured = true; const def = ENTITIES[e.kind], previous = stageFor(this.xp); this.score += def.score; this.xp += def.xp; this.captured++;
    if (def.tier > this.largestTier) { this.largestTier = def.tier; this.largest = e.kind; } this.audio.capture(def.tier); this.growthPulse = 0.16;
    const label = this.add.text(e.x, e.y - 18, '+' + def.score, { fontFamily: 'Trebuchet MS, sans-serif', fontSize: def.tier >= 3 ? '27px' : '19px', fontStyle: 'bold', color: '#fff6b6', stroke: '#15495b', strokeThickness: 3 }).setOrigin(0.5).setDepth(10);
    this.feedback.push(label); this.tweens.add({ targets: label, y: label.y - 48, alpha: 0, duration: 750, onComplete: () => { this.feedback = this.feedback.filter(t => t !== label); label.destroy(); } });
    this.tweens.add({ targets: e.sprite, scaleX: 0, scaleY: 0, alpha: 0, x: this.player.x, y: this.player.y, angle: e.sprite.angle + 135, duration: 260, onComplete: () => e.sprite.destroy() });
    for (let i = 0; i < 7 + def.tier * 2 && this.particles.length < CONFIG.effects.maxParticles; i++) { const a = this.rng() * Math.PI * 2, speed = 35 + this.rng() * 75; this.particles.push({ sprite: this.add.image(e.x, e.y, 'particle').setScale(0.35 + this.rng() * 0.4).setDepth(8), vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: CONFIG.effects.lifetime }); }
    const stage = stageFor(this.xp); if (stage > previous) { this.growthPulse = 0.45; this.audio.growth(); this.onToast(`${CONFIG.stages[stage].target} unlocked!`, 'growth'); } this.emitSnapshot();
  }
  update(_time: number, delta: number) {
    const now = performance.now(); if (this.previousFrame && now - this.previousFrame < 200) { this.frameDurations.push(now - this.previousFrame); if (this.frameDurations.length > 120) this.frameDurations.shift(); } this.previousFrame = now;
    const dt = Math.min(delta / 1000, 0.05); if (!this.vortex) return;
    // Freeze both simulation and visual tweens while paused or on the result screen.
    if (this.mode === 'paused' || this.mode === 'finished') { this.tweens.pauseAll(); return; } this.tweens.resumeAll(); this.clock += dt;
    this.wakes.clear(); this.effects.clear();
    if (this.mode === 'playing') {
      this.remaining = Math.max(0, this.remaining - dt); if (this.remaining === 0) { this.finishRound(); return; }
      const steer = this.steering.vector(this.player.x, this.player.y), slow = this.isSlowed(), touch = this.steering.usingTouch;
      const speed = (touch ? CONFIG.movement.touchSpeed : CONFIG.movement.speed) * (slow ? CONFIG.reef.speedMultiplier : 1);
      const smooth = 1 - Math.exp(-(touch ? CONFIG.movement.touchAcceleration : CONFIG.movement.acceleration) * dt); this.player.vx += (steer.x * speed - this.player.vx) * smooth; this.player.vy += (steer.y * speed - this.player.vy) * smooth;
      const newRadius = CONFIG.stages[stageFor(this.xp)].radius; this.player.radius += (newRadius - this.player.radius) * (1 - Math.exp(-5 * dt));
      // The compact navigation body keeps even the largest whirlpool out of docks without trapping it when it grows.
      const moved = moveInWater(this.player.x, this.player.y, this.player.vx * dt, this.player.vy * dt, CONFIG.movement.navigationRadius); this.player.x = moved.x; this.player.y = moved.y;
      this.hazardCooldown -= dt; if (slow && this.hazardCooldown <= 0) { this.audio.hazard(); this.onToast('Shallow water · steer into the blue', 'hazard'); this.hazardCooldown = CONFIG.reef.warningCooldown; }
      this.replenish(dt);
    }
    const stage = stageFor(this.xp), radius = this.player.radius, suction = radius + CONFIG.suction.extraRadius;
    for (const e of this.entities) {
      if (e.captured) continue; const def = ENTITIES[e.kind], dx = this.player.x - e.x, dy = this.player.y - e.y, dist = Math.max(0.1, Math.hypot(dx, dy)), eligible = def.tier <= stage;
      let attracted = false;
      if (this.mode === 'playing' && eligible && dist < suction + def.radius * 0.3) {
        attracted = true; const force = CONFIG.suction.force * (0.55 + (1 - dist / (suction + def.radius)) * 2.5), spin = CONFIG.suction.swirl * clamp(dist / suction, 0, 1);
        const moved = moveInWater(e.x, e.y, (dx / dist - dy / dist * spin) * force * dt, (dy / dist + dx / dist * spin) * force * dt, Math.min(def.radius, 20)); e.x = moved.x; e.y = moved.y; e.angle += dt * 2.7; e.originX = e.x; e.originY = e.y;
        e.sprite.setScale(0.5 * clamp(dist / Math.max(1, radius), 0.45, 1)); if (dist < radius * CONFIG.suction.captureFraction + def.radius * 0.2) this.capture(e);
      } else if (def.speed && (this.mode === 'welcome' || this.mode === 'playing')) {
        const targetX = e.originX + Math.sin(this.clock * def.speed / 85 + e.phase) * CONFIG.spawn.vesselExcursion, targetY = e.originY;
        const blocked = this.entities.some(other => other !== e && !other.captured && ENTITIES[other.kind].speed > 0 && Math.hypot(targetX - other.x, targetY - other.y) < (def.radius + ENTITIES[other.kind].radius) * CONFIG.spawn.vesselFootprint + 5);
        if (!blocked && isWater(targetX, targetY, def.radius * CONFIG.spawn.vesselFootprint + 3)) { const change = targetX - e.x; e.x = targetX; e.angle = change < 0 ? Math.PI : 0; }
      }
      if (e.captured) continue;
      e.sprite.setPosition(e.x, e.y + Math.sin(this.clock * 1.9 + e.phase) * 1.4).setRotation(e.angle);
      if (def.speed && !attracted) { const direction = Math.cos(e.angle); this.wakes.lineStyle(1.5, 0xb9efe0, 0.28); for (let i = 0; i < 3; i++) { const x = e.x - direction * (def.radius * 1.35 + 7 + i * 8); this.wakes.beginPath(); this.wakes.moveTo(x, e.y - 7 - i * 3); this.wakes.lineTo(x - direction * 5, e.y); this.wakes.lineTo(x, e.y + 7 + i * 3); this.wakes.strokePath(); } }
      // Shape-coded eligibility: large ships always carry a small padlock until unlocked.
      if (!eligible && def.tier >= 2) { const near = dist < suction + def.radius + 20, px = e.x, py = e.y - def.radius * 0.55 - 18;
        if (near && this.mode === 'playing') { this.effects.lineStyle(2, 0xf6b985, 0.7 + Math.sin(this.clock * 5) * 0.2).strokeEllipse(e.x, e.y, def.radius * 3.1, def.radius * 1.65); }
        this.effects.fillStyle(0x153d51, near ? 0.94 : 0.7).fillCircle(px, py, 10); this.effects.lineStyle(1.6, 0xffd19a, 1).strokeRoundedRect(px - 3.5, py - 5, 7, 7, 3); this.effects.fillStyle(0xffd19a).fillRoundedRect(px - 5, py - 1, 10, 7, 2);
      } else if (def.tier >= 2) { this.effects.fillStyle(0xc6eb98, 0.95).fillCircle(e.x, e.y - def.radius * 0.6 - 16, 4); }
    }
    this.particles = this.particles.filter(p => { p.life -= dt; if (p.life <= 0) { p.sprite.destroy(); return false; } p.sprite.x += p.vx * dt; p.sprite.y += p.vy * dt; p.sprite.setAlpha(p.life / CONFIG.effects.lifetime); return true; });
    this.growthPulse = Math.max(0, this.growthPulse - dt); const visualRadius = this.mode === 'welcome' ? 58 : radius; const scale = visualRadius * 2.6 / 384 * (1 + Math.sin(this.growthPulse * 8) * 0.11);
    this.vortex.setPosition(this.player.x, this.player.y).setScale(scale).setRotation(-this.clock * 1.15); this.foam.setPosition(this.player.x, this.player.y).setScale(scale).setRotation(this.clock * 0.65);
    if (this.mode === 'playing') { this.effects.lineStyle(1, this.isSlowed() ? 0xffd19a : 0xc0f7d7, 0.2).strokeCircle(this.player.x, this.player.y, suction); this.steering.draw(this.effects); }
    const camera = this.cameras.main; if (this.mode === 'playing') { const response = this.steering.usingTouch ? CONFIG.movement.touchCameraResponse : 5; const focusX = camera.midPoint.x + (this.player.x - camera.midPoint.x) * (1 - Math.exp(-response * dt)), focusY = camera.midPoint.y + (this.player.y - camera.midPoint.y) * (1 - Math.exp(-response * dt)); camera.centerOn(focusX, focusY); }
    this.lastUi += dt; if (this.lastUi > 0.1) { this.lastUi = 0; this.emitSnapshot(); }
  }
  /** Read-only diagnostic snapshot for repeatable browser tests; no score/position mutation API. */
  diagnostics() { const c = this.cameras.main; return { ...this.snapshot(), player: { ...this.player }, spawning: { needed: shipNeeded(stageFor(this.xp), this.entities.filter(e => !e.captured).map(e => e.kind), this.missingShips), missing: { ...this.missingShips }, wait: this.shipWait, events: this.spawnEvents.map(e => ({ ...e })) }, entities: this.entities.filter(e => !e.captured).map(e => ({ id: e.id, kind: e.kind, x: e.x, y: e.y, tier: ENTITIES[e.kind].tier, radius: ENTITIES[e.kind].radius })), camera: { scrollX: c.scrollX, scrollY: c.scrollY, zoom: c.zoom, width: c.width, height: c.height, midpoint: { x: c.midPoint.x, y: c.midPoint.y } }, fps: this.frameDurations.length ? 1000 * this.frameDurations.length / this.frameDurations.reduce((a, b) => a + b, 0) : 0, particles: this.particles.length, audio: { contextState: this.audio.contextState, muted: this.audio.muted, suspended: this.audio.suspended } }; }
}
