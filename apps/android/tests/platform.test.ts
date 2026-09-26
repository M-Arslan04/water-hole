import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AndroidPlatform} from '../src/platform';
test('Android best score and settings persist across adapter instances via Preferences',async()=>{
 const store=new Map<string,string>();
 const preferences={get:async({key}:{key:string})=>({value:store.get(key)||null}),set:async({key,value}:{key:string;value:string})=>{store.set(key,value);}};
 let pause:()=>void=()=>{},removed=false,rounds=0;
 const app={addListener:async(_event:string,callback:()=>void)=>{pause=callback;return{remove:async()=>{removed=true;}};}};
 const ads={completedRound:async()=>{rounds++;}};
 const create=()=>new AndroidPlatform(preferences as never,app as never,ads as never);
 const first=create(); await first.saveBest(2400); await first.saveSettings({highContrast:true,motion:'reduce',muted:true});
 const next=create(); assert.equal(await next.loadBest(),2400); assert.deepEqual(await next.loadSettings(),{highContrast:true,motion:'reduce',muted:true});
 let paused=false;const off=next.onPause(()=>{paused=true;});pause();assert.equal(paused,true);off();await new Promise(r=>setTimeout(r,0));assert.equal(removed,true);
 await next.roundFinished();assert.equal(rounds,1);store.set('best','NaN');assert.equal(await next.loadBest(),0);store.set('settings','bad json');assert.equal(await next.loadSettings(),null);
});

import {attachLifecycle} from '../src/lifecycle';
test('native host pauses audio and simulation; back closes menus then pauses; returning never resumes a round',async()=>{
 const callbacks:Record<string,()=>void>={};let minimized=0,sleeps=0,wakes=0,muted=0,closed=0;
 const app={addListener:async(name:string,cb:()=>void)=>{callbacks[name]=cb;return {remove:async()=>{}};},minimizeApp:async()=>{minimized++;}};
 const scene={mode:'playing',pauseRound(){if(this.mode==='playing')this.mode='paused';},audio:{pause(){muted++;}}};
 let dialog:{close():void}|null={close(){closed++;dialog=null;}};
 await attachLifecycle(app as never,scene,{sleep(){sleeps++;},wake(){wakes++;}},()=>dialog);
 callbacks.backButton();assert.equal(closed,1);assert.equal(scene.mode,'playing');
 callbacks.backButton();assert.equal(scene.mode,'paused');callbacks.backButton();assert.equal(minimized,1);
 scene.mode='playing';callbacks.pause();assert.equal(scene.mode,'paused');assert.equal(muted,1);assert.equal(sleeps,1);
 callbacks.resume();assert.equal(wakes,1);assert.equal(scene.mode,'paused');
});
