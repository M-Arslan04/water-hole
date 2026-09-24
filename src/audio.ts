export class GameAudio {
  private context?: AudioContext;
  get contextState() { return this.context?.state ?? 'not-created'; }
  muted = false;
  suspended = false;
  unlock() { try { this.context ??= new AudioContext(); if (this.context.state === 'suspended') void this.context.resume().catch(() => {}); } catch { /* Audio is optional. */ } }
  private note(frequency: number, delay: number, length: number, gain = 0.055, type: OscillatorType = 'sine') {
    if (!this.context || this.muted || this.suspended || this.context.state !== 'running') return;
    const t = this.context.currentTime + delay, oscillator = this.context.createOscillator(), volume = this.context.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, t); oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.75, t + length);
    volume.gain.setValueAtTime(0.001, t); volume.gain.exponentialRampToValueAtTime(gain, t + 0.008); volume.gain.exponentialRampToValueAtTime(0.001, t + length);
    oscillator.connect(volume); volume.connect(this.context.destination); oscillator.start(t); oscillator.stop(t + length + 0.01); oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); };
  }
  capture(tier: number) { this.note(420 + tier * 85, 0, 0.13); this.note(700 + tier * 90, 0.045, 0.1, 0.025); }
  growth() { [440, 554, 659, 880].forEach((f, i) => this.note(f, i * 0.07, 0.24, 0.07)); }
  hazard() { this.note(160, 0, 0.16, 0.045, 'triangle'); }
  finish() { [523, 659, 784, 1047].forEach((f, i) => this.note(f, i * 0.12, 0.35, 0.06)); }
  setMuted(muted: boolean) { this.muted = muted; if (muted) void this.context?.suspend().catch(() => {}); else if (!this.suspended) this.unlock(); }
  pause() { this.suspended = true; void this.context?.suspend().catch(() => {}); }
  resume() { this.suspended = false; if (!this.muted) this.unlock(); }
}
