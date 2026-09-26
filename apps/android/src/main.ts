import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { bootGame } from '../../../src/bootstrap';
import { AndroidPlatform } from './platform';
import { NativeAds } from './ads';
import './native.css';
import { attachLifecycle } from './lifecycle';

async function start() {
  if (Capacitor.getPlatform() !== 'android') throw new Error('Use the standalone web build in a browser. This bundle requires Android.');
  let prepared = false;
  const prepare = async () => {
    if (prepared) return;
    prepared = true;
    try { const status = await NativeAds.prepare(); privacy.hidden = !status.privacyRequired; }
    catch { /* Consent/config/network failure means no ads; the game stays available. */ }
  };
  const begin = async () => {
    if (!(await App.getState()).isActive) throw new Error('Return to the app and press Play again.');
    await NativeAds.beginRound();
  };
  const { scene, game } = bootGame(new AndroidPlatform(), {
    beforePlay: async () => { await prepare(); await begin(); },
    beforeReplay: async () => { scene.audio.pause(); try { await NativeAds.replayBreak(); } catch { /* Ad failure skips this break. */ } await begin(); },
  });
  const legal = document.createElement('details');
  const summary = document.createElement('summary'); summary.textContent = 'Open-source licenses'; legal.append(summary);
  const notice = document.createElement('pre'); notice.style.whiteSpace = 'pre-wrap'; notice.style.fontSize = '.75rem'; legal.append(notice);
  document.querySelector('#platform-settings')!.append(legal);
  legal.addEventListener('toggle', () => { if (legal.open && !notice.textContent) void Promise.all([fetch('./third-party-licenses.txt').then(r=>r.text()), fetch('./native-licenses.txt').then(r=>r.text())]).then(text=>{notice.textContent=text.join('\n\n');}).catch(()=>{notice.textContent='Licenses are unavailable. Please reopen the app.';}); });
  const privacy = document.createElement('button'); privacy.className = 'primary-button'; privacy.textContent = 'Ad privacy choices'; privacy.hidden = true;
  document.querySelector('#platform-settings')!.append(privacy);
  privacy.onclick = async () => {
    privacy.disabled = true; scene.audio.pause();
    try { const status = await NativeAds.privacy(); privacy.hidden = !status.privacyRequired; }
    catch { document.querySelector('#announcer')!.textContent = 'Privacy choices could not be opened. Try again when connected.'; }
    finally { privacy.disabled = false; }
  };
  await attachLifecycle(App, scene, game.loop, () => document.querySelector<HTMLDialogElement>('dialog[open]'));
}
void start().catch(() => { document.querySelector('#app')!.textContent = 'Android could not start. Close and reopen the app, or use the separate browser version.'; });
