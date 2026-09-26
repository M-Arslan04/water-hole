import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const artifacts=path.resolve(import.meta.dirname,'../../../tests/artifacts/youtube');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});page.setDefaultTimeout(15000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('https://www.youtube.com/game_api/v1',r=>r.fulfill({contentType:'text/javascript',body:`
window.h={callbacks:{},events:[],saves:[],scores:[]};
window.ytgame={IN_PLAYABLES_ENV:true,game:{firstFrameReady(){h.events.push('first');h.callbacks.pause();},gameReady(){h.events.push('ready');},async loadData(){h.events.push('load');return '';},async saveData(s){h.saves.push(s);}},system:{isAudioEnabled(){return false;},onAudioEnabledChange(f){h.callbacks.audio=f;},onPause(f){h.callbacks.pause=f;},onResume(f){h.callbacks.resume=f;}},engagement:{async sendScore(s){h.scores.push(s.value);}}};`}));
try{
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:5190/');await page.waitForFunction(()=>window.h?.events.includes('first'));
 await page.waitForTimeout(300);assert.deepEqual(await page.evaluate(()=>h.events),['first']);assert.equal(await page.locator('#play').count(),0,'host pause during boot blocks interactive initialization');
 await page.evaluate(()=>h.callbacks.resume());await page.waitForFunction(()=>window.h.events.includes('ready'));
 const snap=()=>page.evaluate(()=>window.__waterHole.snapshot());
 await page.locator('#play').click();assert.equal((await snap()).audio.muted,true);
 await page.evaluate(()=>h.callbacks.audio(true));await page.locator('#game').click();await page.waitForTimeout(150);assert.equal((await snap()).audio.muted,false);
 await page.evaluate(()=>h.callbacks.audio(false));await page.waitForTimeout(100);assert.equal((await snap()).audio.muted,true);assert.notEqual((await snap()).audio.contextState,'running');
 await page.evaluate(()=>{h.callbacks.pause();h.callbacks.pause();});const before=await snap();
 await page.keyboard.press('Escape');await page.evaluate(()=>{document.querySelector('#resume').click();document.querySelector('#settings').click();window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('blur'));document.dispatchEvent(new Event('visibilitychange'));h.callbacks.audio(true);});
 await page.waitForTimeout(500);const after=await snap();assert.equal(after.time,before.time);assert.deepEqual(after.player,before.player);assert.equal(after.audio.suspended,true);assert.equal(after.mode,'paused');assert.equal(await page.locator('dialog[open]').count(),0);
 await page.evaluate(()=>{h.callbacks.resume();h.callbacks.resume();});assert.equal((await snap()).mode,'playing');assert.equal((await snap()).audio.muted,false);
 await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(200);assert.equal((await snap()).mode,'playing','browser visibility must not control YouTube lifecycle');
 await page.locator('#settings').click();await page.evaluate(()=>{h.callbacks.pause();h.callbacks.resume();});assert.equal((await snap()).mode,'paused');await page.locator('#close-preferences').click();assert.equal((await snap()).mode,'paused');
 assert.deepEqual(errors,[]);console.log('PASS: early/duplicate host events, initial mute, audio transitions, paused interaction blocking, host-only lifecycle, prior menu pause.');
 await fs.mkdir(artifacts,{recursive:true});await fs.writeFile(path.join(artifacts,'host.json'),JSON.stringify({passed:true,errors,audio:after.audio},null,2));
}finally{await browser.close();}
