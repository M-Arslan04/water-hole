import Phaser from 'phaser';
import { CONFIG } from './config';
export class Steering {
  private keys: Record<string, Phaser.Input.Keyboard.Key>;
  private pointer?: Phaser.Input.Pointer;
  private origin = { x: 0, y: 0 };
  private touch = false;
  moved = false;
  constructor(private scene: Phaser.Scene, private pixelRatio = 1) {
    this.keys = scene.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (this.pointer) return; this.pointer = p; this.touch = p.wasTouch; this.origin = { x: p.x, y: p.y }; });
    const release = (p: Phaser.Input.Pointer) => { if (p.id === this.pointer?.id) this.pointer = undefined; };
    scene.input.on('pointerup', release); scene.input.on('pointerupoutside', release);
    scene.input.keyboard!.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE']);
  }
  reset() { this.pointer = undefined; this.scene.input.keyboard?.resetKeys(); }
  vector(x: number, y: number): { x: number; y: number } {
    let dx = Number(this.keys.D.isDown || this.keys.RIGHT.isDown) - Number(this.keys.A.isDown || this.keys.LEFT.isDown);
    let dy = Number(this.keys.S.isDown || this.keys.DOWN.isDown) - Number(this.keys.W.isDown || this.keys.UP.isDown);
    if (dx || dy) { const d = Math.hypot(dx, dy); this.moved = true; return { x: dx / d, y: dy / d }; }
    if (!this.pointer?.isDown) return { x: 0, y: 0 };
    if (this.touch) { dx = (this.pointer.x - this.origin.x) / (CONFIG.movement.joystickRadius * this.pixelRatio); dy = (this.pointer.y - this.origin.y) / (CONFIG.movement.joystickRadius * this.pixelRatio); }
    else { const world = this.scene.cameras.main.getWorldPoint(this.pointer.x, this.pointer.y); dx = (world.x - x) / 45; dy = (world.y - y) / 45; }
    const d = Math.hypot(dx, dy); if (d > 0.08) this.moved = true;
    if (d < 0.08) return { x: 0, y: 0 }; return { x: dx / Math.max(1, d), y: dy / Math.max(1, d) };
  }
  draw(g: Phaser.GameObjects.Graphics) {
    if (!this.touch || !this.pointer?.isDown) return;
    const camera = this.scene.cameras.main, origin = camera.getWorldPoint(this.origin.x, this.origin.y), current = camera.getWorldPoint(this.pointer.x, this.pointer.y);
    const r = CONFIG.movement.joystickRadius * this.pixelRatio / camera.zoom, d = Math.hypot(current.x - origin.x, current.y - origin.y), f = Math.min(1, r / Math.max(1, d));
    g.lineStyle(2 * this.pixelRatio / camera.zoom, 0xffffff, 0.45).strokeCircle(origin.x, origin.y, r); g.fillStyle(0xffffff, 0.22).fillCircle(origin.x + (current.x - origin.x) * f, origin.y + (current.y - origin.y) * f, 19 * this.pixelRatio / camera.zoom);
  }
}
