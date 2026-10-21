import { CONFIG } from './config';
import { entityIcon } from './art';
import { boatURLs } from './ocean/art';
import type { HarborScene } from './game';
import type { PlatformAdapter } from './platform';
export interface Settings { highContrast: boolean; motion: 'system' | 'reduce'; muted: boolean; }
export function attachAccessibility(scene: HarborScene, platform: PlatformAdapter, options: { preserveEscape?: boolean; hostOwnsAudio?: boolean } = {}) {
  document.querySelector('#app')!.insertAdjacentHTML('beforeend', `
    <div id="announcer" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
    <dialog id="preferences" aria-labelledby="preferences-title">
      <h2 id="preferences-title">Settings</h2>
      <div class="settings-options"><label class="setting-row"><input id="contrast-setting" type="checkbox"> High contrast</label>
      <label class="setting-row" for="motion-setting">Motion effects</label>
      <select id="motion-setting"><option value="system">Follow device preference</option><option value="reduce">Reduce motion</option></select></div>
      <button id="accessibility-open" class="help-button" aria-haspopup="dialog">Controls & accessibility</button>
      <div id="platform-settings"></div>
      <button id="close-preferences" class="primary-button">Done</button>
    </dialog>
    <dialog id="how-to-play" aria-labelledby="help-title">
      <h2 id="help-title" tabindex="-1">How to play</h2>
      <p id="primary-controls" class="primary-controls"></p>
      <ol class="help-steps">
        <li><strong>Move:</strong> Drag to steer. Drag farther to go faster. Lift to stop.</li>
        <li><strong>Grow:</strong> Collect small objects to swallow bigger boats. Locks mean you need to grow.</li>
        <li><strong>Score:</strong> You have 90 seconds. Avoid obstacles; shallows slow you down.</li>
      </ol>
      <ol class="help-catches" aria-label="Six growth stages">
        ${(['driftwood','crate','rowboat','fishing','tug','cargo'] as const).map((kind,i)=>`<li><img src="${kind in boatURLs ? boatURLs[kind as keyof typeof boatURLs] : entityIcon(kind)}" alt="${CONFIG.stages[i].target}"><span>${i+1}. ${CONFIG.stages[i].name}</span></li>`).join('')}
      </ol>
      <div class="help-actions"><button id="other-controls-open" class="help-button" aria-haspopup="dialog">Controls & accessibility</button><button id="close-help" class="primary-button">Got it</button></div>
    </dialog>
    <dialog id="other-controls-open-view" class="detail-dialog" aria-labelledby="other-controls-title">
      <button id="close-other-controls" class="ocean-dialog-close" aria-label="Close controls and accessibility">Close</button>
      <h2 id="other-controls-title" tabindex="-1">Controls & accessibility</h2>
      <div id="alternative-controls"></div>
      <p>High contrast: double rings mark your whirlpool. Check marks mean you can collect a target; locks mean grow first. Striped shallows slow you down.</p>
      <p>Reduced motion removes decorative rotation, bobbing, particles and score animations. Steering, camera tracking and moving ships remain.</p>
      <p class="help-note">Use Pause to take a break and the sound button to mute. Sounds mark catches, growth, shallows and the end of a round.</p>
      <p>Menus and results support screen readers. The real-time harbor still requires visual play; a complete nonvisual mode is not available.</p>
    </dialog>`);
  const dialog = document.querySelector<HTMLDialogElement>('#preferences')!;
  const help = document.querySelector<HTMLDialogElement>('#how-to-play')!;
  const other = document.querySelector<HTMLDialogElement>('#other-controls-open-view')!;
  const contrast = document.querySelector<HTMLInputElement>('#contrast-setting')!;
  const motion = document.querySelector<HTMLSelectElement>('#motion-setting')!;
  const sound = document.querySelector<HTMLButtonElement>('#sound')!;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let settings: Settings = { highContrast: false, motion: 'system', muted: false }, edited = false;
  const returnFocus = new Map<HTMLDialogElement, HTMLElement>();
  const touchControls = 'Drag to steer. Drag farther to move faster. Lift to stop.';
  const mouseControls = 'Hold the mouse button toward your destination to steer.';
  const updateInstructions = () => {
    const touchFirst = navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches;
    const primary=document.querySelector<HTMLElement>('#primary-controls')!;primary.hidden=touchFirst;primary.textContent=`Mouse: hold to steer. Keyboard: WASD or arrow keys.`;
    document.querySelector('#alternative-controls')!.innerHTML = touchFirst
      ? `<p><strong>Mouse:</strong> ${mouseControls}</p><p><strong>Keyboard:</strong> Use arrow keys or W, A, S, D to steer.</p><p>Escape pauses or resumes. Tab moves between menu controls; Space or Enter activates them.</p>`
      : `<p><strong>Touch:</strong> ${touchControls}</p><p><strong>Keyboard:</strong> Use arrow keys or W, A, S, D to steer.</p><p>Escape pauses or resumes. Tab moves between menu controls; Space or Enter activates them.</p>`;
    document.querySelector('#game')!.setAttribute('aria-label', `Harbor. ${touchFirst ? touchControls : 'Hold the mouse button to steer, or use WASD or arrow keys.'}`);
  };
  updateInstructions();
  const apply = () => {
    scene.highContrast = settings.highContrast; scene.reducedMotion = settings.motion === 'reduce' || media.matches;
    document.documentElement.classList.toggle('high-contrast', scene.highContrast);
    document.documentElement.classList.toggle('reduced-motion', scene.reducedMotion);
    contrast.checked = settings.highContrast; motion.value = settings.motion;
  };
  const save = () => { edited = true; void Promise.resolve(platform.saveSettings?.(settings)).catch(() => {}); };
  apply(); media.addEventListener('change', apply);
  void Promise.resolve(platform.loadSettings?.()).then(value => {
    if (edited || !value || typeof value !== 'object') return;
    const stored = value as Partial<Settings>;
    settings = { highContrast: stored.highContrast === true, motion: stored.motion === 'reduce' ? 'reduce' : 'system', muted: stored.muted === true };
    if (!options.hostOwnsAudio && settings.muted !== scene.audio.muted) sound.click();
    apply();
  }).catch(() => {});
  contrast.onchange = () => { settings.highContrast = contrast.checked; apply(); save(); };
  motion.onchange = () => { settings.motion = motion.value === 'reduce' ? 'reduce' : 'system'; apply(); save(); };
  sound.addEventListener('click', () => { settings.muted = scene.audio.muted; save(); });
  const openDialog = (target: HTMLDialogElement, first: HTMLElement) => {
    returnFocus.set(target, document.activeElement as HTMLElement);
    target.showModal(); scene.pauseRound(); scene.setMenuOpen(true);
    target.scrollTop = 0; first.focus({ preventScroll: true });
  };
  document.querySelector<HTMLButtonElement>('#settings')!.onclick = () => openDialog(dialog, contrast);
  document.querySelectorAll<HTMLButtonElement>('[data-open-help]').forEach(button => {
    button.onclick = () => {
      updateInstructions();
      openDialog(help, document.querySelector<HTMLElement>('#help-title')!);
    };
  });
  for(const id of ['other-controls-open','accessibility-open'])document.getElementById(id)!.onclick=()=>openDialog(other,document.getElementById('other-controls-title')!);
  document.getElementById('close-other-controls')!.onclick=()=>other.close();
  document.querySelector<HTMLButtonElement>('#close-preferences')!.onclick = () => dialog.close();
  document.querySelector<HTMLButtonElement>('#close-help')!.onclick = () => help.close();
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || document.querySelector('dialog[open]') || event.defaultPrevented) return;
    if (scene.mode === 'playing') scene.pauseRound(); else if (scene.mode === 'paused') scene.resumeRound();
  });
  for (const target of [dialog, help, other]) {
  target.addEventListener('keydown', event => {
    if (event.key === 'Escape') { if (!options.preserveEscape) event.preventDefault(); event.stopPropagation(); target.close(); return; }
    if (event.key !== 'Tab') return;
    const controls = [...target.querySelectorAll<HTMLElement>('button:not([disabled]):not([hidden]), input, select, summary')].filter(el => el.getClientRects().length > 0);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  target.addEventListener('close', () => {
    scene.setMenuOpen(Boolean(document.querySelector('dialog[open]')));
    // Native dialogs restore focus synchronously; their close event arrives later.
    // Only supply a fallback if focus was lost, not after the user moved elsewhere.
    const focused = document.activeElement;
    if (!focused || focused === document.body || target.contains(focused)) returnFocus.get(target)?.focus({ preventScroll: true });
  });
  }
  // Preserve the UI subscriber. Only transitions enter the live region, never per-frame scores.
  const update = scene.onSnapshot;
  let mode = '', stage = -1, warned = false;
  scene.onSnapshot = s => {
    update(s);
    let message = '';
    if (s.mode !== mode) {
      if (s.mode === 'playing') { message = mode === 'paused' ? 'Game resumed.' : 'Round started. 90 seconds. Collect small objects to grow.'; if (mode !== 'paused') warned = false; }
      if (s.mode === 'paused') message = 'Game paused.';
      if (s.mode === 'finished') message = `Round complete. ${s.score} points. ${s.captured} objects captured. Biggest catch: ${s.largest}. Personal best: ${s.best}.`;
    } else if (s.mode === 'playing' && s.stage !== stage) message = `Stage ${s.stage + 1} of 6. ${CONFIG.stages[s.stage].name}. Collect ${CONFIG.stages[s.stage].target}.`;
    else if (s.mode === 'playing' && s.time <= 10 && !warned) { warned = true; message = '10 seconds remaining.'; }
    if (message) document.querySelector('#announcer')!.textContent = message;
    mode = s.mode; stage = s.stage;
  };
}
