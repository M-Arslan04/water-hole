import {test} from 'node:test';import assert from 'node:assert/strict';
import {attachOceanLifecycle} from '../src/ocean/navigation';
async function setup(){
 const listeners=new Map<string,()=>void>(),calls:string[]=[];
 const scene={mode:'welcome',pauseRound(){calls.push('pause');if(this.mode==='playing')this.mode='paused';},home(){calls.push('home');this.mode='welcome';},audio:{pause(){calls.push('audio.pause');}}};
 let modal=false,nearby=false;
 await attachOceanLifecycle({async addListener(e,f){listeners.set(e,f);},async minimizeApp(){calls.push('minimize');}},scene,{sleep(){calls.push('sleep');},wake(){calls.push('wake');}},{requestHome(){calls.push('confirm');},findDialog:()=>modal?{close(){calls.push('close');modal=false;}}:null},{active:()=>nearby,leave(){calls.push('nearby.leave');},background(){calls.push('nearby.background');}});
 return{scene,calls,fire:(e:string)=>listeners.get(e)!(),modal:()=>modal=true,nearby:()=>nearby=true};
}
test('Android Back pauses an active round and then requests confirmation, never minimizes paused play',async()=>{const t=await setup();t.scene.mode='playing';t.fire('backButton');assert.equal(t.scene.mode,'paused');t.fire('backButton');assert.deepEqual(t.calls,['pause','confirm']);});
test('Android Back closes an open dialog before navigating away',async()=>{const t=await setup();t.scene.mode='paused';t.modal();t.fire('backButton');assert.deepEqual(t.calls,['close']);assert.equal(t.scene.mode,'paused');});
test('Results Back returns Home; only Home Back minimizes',async()=>{const t=await setup();t.scene.mode='finished';t.fire('backButton');assert.equal(t.scene.mode,'welcome');t.fire('backButton');assert.deepEqual(t.calls,['home','minimize']);});
test('Android background still pauses and sleeps, foreground wakes',async()=>{const t=await setup();t.scene.mode='playing';t.fire('pause');assert.equal(t.scene.mode,'paused');t.fire('resume');assert.deepEqual(t.calls,['pause','audio.pause','sleep','wake']);});
test('Existing Nearby owns its Back and background handling',async()=>{const t=await setup();t.nearby();t.fire('backButton');t.fire('pause');t.fire('resume');assert.deepEqual(t.calls,['nearby.leave','nearby.background','pause','audio.pause','sleep']);});
