import Phaser from 'phaser';
import './style.css';
import './responsive.css';
import { HarborScene } from './game';
import type { PlatformAdapter } from './platform';
import { attachAccessibility } from './accessibility';
import './accessibility.css';
import './game-layout.css';
import './welcome.css';
import { GameAudio } from './audio';
import { mountUI, bindUI } from './ui';
export function bootGame(platform: PlatformAdapter, hooks: { beforePlay?: () => Promise<void>; beforeReplay?: () => Promise<void> } = {}) {
mountUI();
const pixelRatio = Math.min(2, window.devicePixelRatio || 1);
const scene = new HarborScene(new GameAudio(), platform, pixelRatio);
bindUI(scene, hooks);
attachAccessibility(scene, platform);
const parent = document.getElementById('game')!;
const game = new Phaser.Game({ type: Phaser.AUTO, parent, backgroundColor: '#237f92', scene: [scene], scale: { mode: Phaser.Scale.NONE, width: parent.clientWidth * pixelRatio, height: parent.clientHeight * pixelRatio, zoom: 1 / pixelRatio, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true, roundPixels: false, powerPreference: 'low-power' }, input: { activePointers: 2 }, audio: { noAudio: true }, banner: false, fps: { target: 60, forceSetTimeOut: true } });
// Only expose immutable diagnostics in Vite development builds, never in production.
if (import.meta.env.DEV) Object.defineProperty(window, '__waterHole', { value: { snapshot: () => scene.diagnostics() }, writable: false });

new ResizeObserver(() => { if (game.isBooted && parent.clientWidth && parent.clientHeight) game.scale.resize(parent.clientWidth * pixelRatio, parent.clientHeight * pixelRatio); }).observe(parent);

return { scene, game };
}
