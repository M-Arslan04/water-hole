import type { bootGame } from '../../../src/bootstrap';
import { YouTubePlatform } from './platform';
import type { PlayablesSDK } from './sdk';

const sdk: PlayablesSDK | undefined = window.ytgame;
const platform = new YouTubePlatform(sdk);
let hostPaused = false, audioEnabled = false, running: ReturnType<typeof bootGame> | undefined;
let resumeRound = false, ready = false;
let pendingResize = false;
const activeWaiters: (() => void)[] = [];
const active = () => hostPaused ? new Promise<void>(resolve => activeWaiters.push(resolve)) : Promise.resolve();
const safe = (fn: () => void) => { try { fn(); } catch { /* Missing host functionality never crashes local preview. */ } };
const notifyReady = () => { if (ready && !hostPaused) { ready = false; safe(() => sdk?.game.gameReady()); } };
const applyAudio = () => { if (running) running.scene.audio.setMuted(hostPaused || !audioEnabled); };

safe(() => { audioEnabled = sdk?.system.isAudioEnabled() === true; });
safe(() => sdk?.system.onAudioEnabledChange(enabled => { audioEnabled = enabled; if (!hostPaused) applyAudio(); }));
safe(() => sdk?.system.onPause(() => {
  if (hostPaused) return;
  hostPaused = true; platform.paused = true;
  if (!running) return;
  resumeRound = running.scene.mode === 'playing';
  running.scene.pauseRound(); running.scene.audio.pause();
  running.game.input.enabled = false; running.game.loop.sleep();
  document.documentElement.classList.add('host-paused');
  document.querySelector<HTMLElement>('#app')!.inert = true;
  for (const dialog of document.querySelectorAll<HTMLElement>('dialog')) dialog.inert = true;
  document.getAnimations().forEach(animation => animation.pause());
}));
safe(() => sdk?.system.onResume(() => {
  if (!hostPaused) return;
  hostPaused = false; platform.paused = false;
  document.documentElement.classList.remove('host-paused');
  activeWaiters.splice(0).forEach(resolve => resolve());
  if (running) {
    document.querySelector<HTMLElement>('#app')!.inert = false;
    for (const dialog of document.querySelectorAll<HTMLElement>('dialog')) dialog.inert = false;
    running.game.input.enabled = true;
    if (pendingResize) { resize(); pendingResize = false; }
    applyAudio();
    if (resumeRound && !document.querySelector('dialog[open]')) running.scene.resumeRound();
    running.game.loop.wake();
    document.getAnimations().forEach(animation => animation.play());
  }
  notifyReady(); void platform.flush();
}));
for (const name of ['keydown','keyup','click','pointerdown','pointermove','pointerup','touchstart','touchmove','touchend','wheel']) {
  window.addEventListener(name, event => {
    if (!hostPaused) return;
    if (!(event instanceof KeyboardEvent && event.key === 'Escape') && event.cancelable) event.preventDefault();
    event.stopImmediatePropagation();
  }, { capture: true, passive: false });
}
function resize() {
  if (!running) return;
  if (hostPaused) { pendingResize = true; return; }
  const parent = document.querySelector<HTMLElement>('#game')!;
  if (parent.clientWidth && parent.clientHeight) running.game.scale.resize(parent.clientWidth * Math.min(2, devicePixelRatio || 1), parent.clientHeight * Math.min(2, devicePixelRatio || 1));
}

async function start() {
  // Let the explicit loading message paint before acknowledging the first frame.
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  await active(); safe(() => sdk?.game.firstFrameReady());
  await active(); await platform.initialize(); await active();
  const { bootGame } = await import('../../../src/bootstrap');
  await import('./youtube.css'); await active();
  document.documentElement.classList.add('youtube');
  running = bootGame(platform, { preserveEscape: true, canInteract: () => !hostPaused, hostOwnsResize: true, hostOwnsAudio: true });
  const { scene, game } = running;
  // Audio belongs to YouTube. Remove local saved-mute behavior before its load promise resolves.
  const sound = document.querySelector<HTMLButtonElement>('#sound')!; sound.hidden = true; sound.onclick = null;
  for (const selector of ['.intro','.field-guide','.ladder','footer','.edition','.local-badge','.world-note','.map-caption','.round-badge']) document.querySelector(selector)?.remove();
  const brand = document.querySelector('.brand')!;
  brand.removeAttribute('href'); brand.removeAttribute('role'); brand.removeAttribute('tabindex');
  document.querySelector('#settings')!.setAttribute('aria-label','Game settings');
  document.querySelector('.help-note')!.textContent = 'Use Pause to take a break. YouTube controls sound. Sounds mark catches, growth, shallows and the end of a round.';
  const status = document.createElement('p'); status.id = 'save-status';
  status.textContent = platform.storageStatus === 'local' ? 'Local preview · progress lasts for this session.' : platform.storageStatus === 'unavailable' ? 'Cloud save unavailable · progress lasts for this session.' : '';
  document.querySelector('.start-card')!.append(status);
  // Scene timers stop with the engine, including this decorative toast dismissal.
  scene.onToast = (text, type = '') => {
    const toast = document.querySelector<HTMLElement>('#toast')!;
    toast.textContent = text; toast.className = `toast visible toast-${type}`;
    scene.time.delayedCall(2400, () => { toast.className = 'toast'; });
  };
  const onReady = scene.onReady;
  scene.onReady = () => {
    onReady(); scene.best = platform.loadBest();
    document.querySelector('#boot-status')?.remove();
    applyAudio(); ready = true;
    // The first engine render ensures the harbor is visible before gameReady.
    game.events.once('postrender', notifyReady);
  };
  new ResizeObserver(resize).observe(document.querySelector('#game')!);
}
void start().catch(() => {
  const message = document.querySelector('#boot-status');
  if (message) message.textContent = 'The harbor could not load. Please try opening the game again.';
  safe(() => sdk?.health?.logError());
});
