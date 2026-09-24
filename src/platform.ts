/** Platform boundary: an eventual SDK adapter implements this contract separately. */
export interface PlatformAdapter { loadBest(): number | Promise<number>; saveBest(score: number): void | Promise<void>; onPause(callback: () => void): () => void; roundFinished(score: number): void | Promise<void>; }
export class BrowserPlatform implements PlatformAdapter {
  loadBest() { try { const n = Number(localStorage.getItem('water-hole.best')); return Number.isFinite(n) && n > 0 ? n : 0; } catch { return 0; } }
  saveBest(score: number) { try { localStorage.setItem('water-hole.best', String(score)); } catch { /* Play remains available in private/restricted storage. */ } }
  onPause(callback: () => void) { const hidden = () => { if (document.hidden) callback(); }; document.addEventListener('visibilitychange', hidden); window.addEventListener('blur', callback); return () => { document.removeEventListener('visibilitychange', hidden); window.removeEventListener('blur', callback); }; }
  roundFinished(_score: number) { /* Standalone build intentionally has no remote SDK calls. */ }
}
