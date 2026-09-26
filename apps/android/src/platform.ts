import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import type { PlatformAdapter } from '../../../src/platform';
import { NativeAds } from './ads';
export class AndroidPlatform implements PlatformAdapter {
  constructor(private preferences = Preferences, private app = App, private ads = NativeAds) {}
  async loadBest() { const { value } = await this.preferences.get({ key:'best' }); const n = Number(value); return Number.isFinite(n) && n > 0 ? n : 0; }
  async saveBest(score: number) { await this.preferences.set({key:'best',value:String(score)}); }
  async loadSettings() { try { return JSON.parse((await this.preferences.get({key:'settings'})).value || 'null'); } catch { return null; } }
  async saveSettings(settings: unknown) { await this.preferences.set({key:'settings',value:JSON.stringify(settings)}); }
  onPause(callback: () => void) { const handle = this.app.addListener('pause',callback); return () => { void handle.then(h=>h.remove()); }; }
  async roundFinished() { await this.ads.completedRound(); }
}
