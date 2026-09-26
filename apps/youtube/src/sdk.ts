// Structural subset of the public v1 SDK; no SDK implementation is bundled.
// https://developers.google.com/youtube/gaming/playables/reference/sdk
export interface PlayablesSDK {
  IN_PLAYABLES_ENV: boolean;
  game: { firstFrameReady(): void; gameReady(): void; loadData(): Promise<string>; saveData(data: string): Promise<void> };
  system: { isAudioEnabled(): boolean; onAudioEnabledChange(fn: (enabled: boolean) => void): () => void; onPause(fn: () => void): () => void; onResume(fn: () => void): () => void };
  health?: { logError(): void };
  engagement?: { sendScore(score: { value: number }): Promise<void> };
}
declare global { interface Window { ytgame?: PlayablesSDK } }
