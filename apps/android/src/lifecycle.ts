import type { AppPlugin } from '@capacitor/app';
interface SceneHost { mode: string; pauseRound(): void; audio: { pause(): void }; }
interface LoopHost { sleep(): void; wake(): void; }
/** Host behavior kept separate so it can be exercised without claiming device coverage. */
export async function attachLifecycle(app: Pick<AppPlugin, 'addListener' | 'minimizeApp'>, scene: SceneHost, loop: LoopHost, findDialog: () => {close():void} | null) {
  await app.addListener('pause', () => { scene.pauseRound(); scene.audio.pause(); loop.sleep(); });
  await app.addListener('resume', () => { loop.wake(); });
  await app.addListener('backButton', () => {
    const dialog = findDialog();
    if (dialog) dialog.close();
    else if (scene.mode === 'playing') scene.pauseRound();
    else void app.minimizeApp();
  });
}
