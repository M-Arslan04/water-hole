import Phaser from 'phaser';
import {HarborScene} from './game';
import type {PlatformAdapter} from './platform';
import {GameAudio} from './audio';
import {attachAccessibility} from './accessibility';
import './accessibility.css';
import {mountOcean,bindOcean} from './ocean/ui';
import {paintHome} from './ocean/art';
import {attachOceanNavigation} from './ocean/navigation';
import {attachViewport} from './ocean/viewport';
import './ocean/ocean.css';
import './ocean/views.css';
export function bootGame(platform: PlatformAdapter, hooks: { playLabel?: 'Play' | 'Play solo'; beforePlay?: () => Promise<void>; beforeReplay?: () => Promise<void>; preserveEscape?: boolean; canInteract?: () => boolean; hostOwnsResize?: boolean; hostOwnsAudio?: boolean; graphics?: {pixelRatio:number;fps:30|60;name:string} } = {}) {
mountOcean();
attachViewport();
const pixelRatio = hooks.graphics?.pixelRatio ?? Math.min(2, window.devicePixelRatio || 1);
const scene = new HarborScene(new GameAudio(), platform, pixelRatio);
let game:Phaser.Game;
bindOcean(scene,()=>game?.loop.wake(),()=>{if(!hooks.hostOwnsResize)game?.loop.sleep();},hooks);
attachAccessibility(scene, platform, hooks);
const navigation=attachOceanNavigation(scene);
const onReady=scene.onReady; scene.onReady=()=>{onReady();paintHome(document.querySelector('#ocean-home-art')!,scene);};
const create=scene.create.bind(scene);scene.create=()=>{scene.registry.set('oceanSmooth',hooks.graphics?.name==='Smooth');create();};
const parent = document.getElementById('game')!;
game = new Phaser.Game({ type: Phaser.AUTO, parent, backgroundColor: '#237f92', scene: [scene], scale: { mode: Phaser.Scale.NONE, width: parent.clientWidth * pixelRatio, height: parent.clientHeight * pixelRatio, zoom: 1 / pixelRatio, autoCenter: Phaser.Scale.CENTER_BOTH }, render: { antialias: true, roundPixels: false, powerPreference: 'low-power' }, input: { activePointers: 2 }, audio: { noAudio: true }, banner: false, fps: hooks.graphics ? {target:hooks.graphics.fps,limit:hooks.graphics.fps} : { target:60,forceSetTimeOut:true } });
// Only expose immutable diagnostics in Vite development builds, never in production.
if (import.meta.env.DEV) Object.defineProperty(window, '__waterHole', { value: { snapshot: () => scene.diagnostics() }, writable: false });

if (!hooks.hostOwnsResize) new ResizeObserver(() => { if (game.isBooted && parent.clientWidth && parent.clientHeight) game.scale.resize(parent.clientWidth * pixelRatio, parent.clientHeight * pixelRatio); }).observe(parent);

return { scene, game, navigation };
}
