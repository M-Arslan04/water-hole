import type { PlatformAdapter } from '../../../src/platform';
import type { PlayablesSDK } from './sdk';
type Save = { version: number; best: number; settings: { highContrast: boolean; motion: 'system' | 'reduce' }; [key: string]: unknown };
const defaults = (): Save => ({ version: 1, best: 0, settings: { highContrast: false, motion: 'system' } });
export class YouTubePlatform implements PlatformAdapter {
  data = defaults();
  storageStatus: 'local' | 'ready' | 'unavailable' = 'local';
  paused = false;
  private dirty = false;
  private queue = Promise.resolve();
  private savedBest = -1;
  private reportedBest = -1;
  constructor(private sdk?: PlayablesSDK) {}
  async initialize() {
    if (!this.sdk?.IN_PLAYABLES_ENV) return;
    this.storageStatus = 'unavailable';
    try {
      const raw = await this.sdk.game.loadData();
      const value = raw ? JSON.parse(raw) : {};
      if (!value || typeof value !== 'object' || Array.isArray(value) || (value.version !== undefined && value.version !== 1)) return;
      // Unversioned best/settings saves migrate to v1; preserve unknown fields.
      this.data = { ...value, version: 1,
        best: Number.isSafeInteger(value.best) && value.best >= 0 ? value.best : 0,
        settings: { highContrast: value.settings?.highContrast === true, motion: value.settings?.motion === 'reduce' ? 'reduce' : 'system' } };
      this.savedBest = this.data.best;
      this.storageStatus = 'ready';
    } catch { /* Never overwrite a save that could not be loaded or parsed. */ }
  }
  loadBest() { return this.data.best; }
  loadSettings() { return { ...this.data.settings, muted: false }; }
  saveBest(best: number) {
    if (Number.isSafeInteger(best) && best > this.data.best) { this.data.best = best; this.dirty = true; }
    return this.flush();
  }
  saveSettings(value: unknown) {
    const settings = value as Partial<Save['settings']>;
    this.data.settings = { highContrast: settings.highContrast === true, motion: settings.motion === 'reduce' ? 'reduce' : 'system' };
    this.dirty = true; return this.flush();
  }
  onPause(_callback: () => void) { return () => {}; } // SDK lifecycle is attached to the whole engine in main.ts.
  roundFinished(_score: number) { return this.flush(); }
  flush() {
    this.queue = this.queue.then(async () => {
      if (this.paused || this.storageStatus !== 'ready' || !this.sdk) return;
      if (this.dirty) {
        const payload = JSON.stringify(this.data), best = this.data.best;
        this.dirty = false;
        try { await this.sdk.game.saveData(payload); this.savedBest = best; }
        catch { this.dirty = true; return; }
      }
      // Report only persisted bests. A pause during save defers this until resume.
      if (!this.paused && this.savedBest > this.reportedBest && this.sdk.engagement?.sendScore) {
        try { await this.sdk.engagement.sendScore({ value: this.savedBest }); this.reportedBest = this.savedBest; }
        catch { /* Retry at next safe milestone. */ }
      }
    });
    return this.queue;
  }
}
