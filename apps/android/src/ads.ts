import { registerPlugin } from '@capacitor/core';
interface AdStatus { privacyRequired: boolean; ready: boolean; }
export const NativeAds = registerPlugin<{
  prepare(): Promise<AdStatus>;
  privacy(): Promise<AdStatus>;
  beginRound(): Promise<void>;
  completedRound(): Promise<void>;
  replayBreak(): Promise<{ shown: boolean }>;
}>('WaterHoleAds');
