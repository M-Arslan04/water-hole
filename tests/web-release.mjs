import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const out = process.env.TEST_OUTPUT || 'tests/artifacts/web-release';
await fs.mkdir(out, {recursive:true});
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true});
const errors=[],failed=[],requests=[],results={};
const context=await browser.newContext({viewport:{width:1024,height:679},reducedMotion:'reduce'});
await context.addInitScript(()=>{
 const Original=window.AudioContext;
 window.__testAudio=[];
 window.AudioContext=class extends Original {constructor(...args){super(...args);window.__testAudio.push(this);}};
});
const p=await context.newPage();
p.on('pageerror',e=>errors.push(e.message));
p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
p.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()}));
p.on('request',r=>requests.push(r.url()));
const ready=()=>p.waitForFunction(()=>document.querySelector('#play')?.disabled===false);
const mode=()=>p.locator('.ocean-shell').getAttribute('data-screen');
try {
 await p.goto(process.env.TEST_URL||'http://127.0.0.1:4186');await ready();
 assert.equal(await p.evaluate(()=>typeof window.__waterHole),'undefined');
 assert.equal(await p.getByText(/Play nearby|Find a room|Nearby devices/i).count(),0);
 assert.equal(await p.evaluate(()=>!!window.Capacitor||!!window.ytgame),false);
 await p.screenshot({path:out+'/desktop-home.png'});
 await p.locator('#settings').click();await p.locator('#contrast-setting').check();await p.locator('#motion-setting').selectOption('reduce');await p.locator('#close-preferences').click();
 assert.equal(await p.evaluate(()=>document.activeElement.id),'settings');
 await p.locator('#sound').click();await p.reload();await ready();
 assert.ok(await p.locator('html.high-contrast.reduced-motion').count());
 assert.equal(await p.locator('#sound').getAttribute('aria-pressed'),'true');
 results.settingsPersist=true;
 // A pending dialog-close event must not steal newly selected keyboard focus.
 await p.locator('#settings').click();
 await p.evaluate(()=>new Promise(resolve=>{const dialog=document.querySelector('#preferences');dialog.addEventListener('close',()=>setTimeout(resolve,0),{once:true});dialog.close();document.querySelector('#play').focus();}));
 assert.equal(await p.evaluate(()=>document.activeElement.id),'play');results.delayedCloseKeepsFocus=true;
 await p.locator('#sound').click();await p.locator('#settings').click();await p.locator('#contrast-setting').uncheck();await p.locator('#close-preferences').click();
 await p.waitForFunction(()=>document.activeElement.id==='settings'&&!document.querySelector('dialog[open]'));
 await p.locator('#play').focus();await p.keyboard.press('Enter');await p.waitForTimeout(700);
 assert.equal(await mode(),'playing');assert.equal(await p.evaluate(()=>document.activeElement.id),'game');
 const audioState=()=>p.evaluate(()=>window.__testAudio.map(c=>c.state));
 assert.ok((await audioState()).includes('running'));
 await p.keyboard.press('Escape');assert.equal(await mode(),'paused');
 const timer=await p.locator('#timer').textContent();await p.waitForTimeout(1200);assert.equal(await p.locator('#timer').textContent(),timer);
 assert.ok((await audioState()).every(s=>s==='suspended'));await p.screenshot({path:out+'/desktop-pause.png'});
 await p.locator('#pause-settings').click();await p.screenshot({path:out+'/desktop-settings.png'});await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'pause-settings');
 for(const [width,height] of [[1023,679],[1025,679],[2560,1235],[412,924],[844,390],[1024,679]]){
  await p.setViewportSize({width,height});await p.waitForTimeout(100);assert.equal(await mode(),'paused');assert.equal(await p.locator('#timer').textContent(),timer);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 await p.locator('#resume').click();
 // Deterministic visibility callback regression; this is NOT physical tab testing.
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
 assert.equal(await mode(),'paused');
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
 assert.equal(await mode(),'paused');await p.locator('#resume').click();
 results.pauseResizeVisibility={pauseTimeFrozen:true,audioSuspended:true,resumeExplicit:true,visibility:'synthetic document.hidden event'};
 const started=Date.now();let step=0;
 while(await mode()==='playing'){
  const key=['d','s','a','w'][step%4];await p.keyboard.down(key);await p.waitForTimeout(2100);await p.keyboard.up(key);
  if(step===3){await p.screenshot({path:out+'/desktop-gameplay.png'});console.log('Full production round underway');}
  if(step++>60)throw Error('Round exceeded timeout');
 }
 assert.equal(await mode(),'finished');
 const score=Number((await p.locator('#final-score').textContent()).replaceAll(',',''));
 assert.ok(score>0);assert.ok(Date.now()-started>80000);
 await p.screenshot({path:out+'/desktop-results.png'});
 results.round={score,captured:await p.locator('#captured').textContent(),wallMs:Date.now()-started};
 assert.equal(await p.evaluate(()=>Number(localStorage.getItem('water-hole.best'))),score);
 results.resultLayouts=[];
 for(const [width,height,text] of [[320,568,100],[360,640,100],[844,390,100],[320,568,200],[844,390,200]]){
  await p.setViewportSize({width,height});await p.evaluate(text=>document.documentElement.style.fontSize=text+'%',text);await p.waitForTimeout(80);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  for(const id of ['again','ocean-home']){await p.locator('#'+id).scrollIntoViewIfNeeded();const r=await p.locator('#'+id).boundingBox();assert.ok(r.y>=0&&r.y+r.height<=height+1&&r.x>=0&&r.x+r.width<=width+1);}
  await p.screenshot({path:out+`/results-${width}x${height}-${text}.png`});results.resultLayouts.push({width,height,text,actionsReachable:true});
 }
 await p.evaluate(()=>document.documentElement.style.fontSize='100%');await p.setViewportSize({width:360,height:640});await p.screenshot({path:out+'/phone-results.png'});
 await p.locator('#again').click();assert.equal(await mode(),'playing');assert.equal(await p.locator('#score').textContent(),'0');
 const box=await p.locator('#game').boundingBox();await p.mouse.move(box.x+box.width*.7,box.y+box.height*.4);await p.mouse.down();await p.waitForTimeout(1200);await p.mouse.up();
 await p.locator('#pause').click();await p.locator('#pause-home').click();await p.locator('#ocean-confirm-leave').click();await p.reload();await ready();
 assert.equal(await p.locator('#welcome-best').textContent(),score.toLocaleString('en'));
 results.replayBestRefresh=true;
 // Existing stored best/settings remain readable with the unchanged public storage keys.
 await p.evaluate(()=>{localStorage.setItem('water-hole.best','99999');});await p.reload();await ready();assert.equal(await p.locator('#welcome-best').textContent(),'99,999');results.existingBestMigration=true;
 const touch=await browser.newContext({viewport:{width:360,height:640},hasTouch:true,isMobile:true,deviceScaleFactor:2});const t=await touch.newPage();await t.goto(process.env.TEST_URL||'http://127.0.0.1:4186');await t.locator('#play').tap();const client=await touch.newCDPSession(t);const b=await t.locator('#game').boundingBox();const x=b.x+b.width/2,y=b.y+b.height/2;
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+70,y:y-60}]});await t.waitForTimeout(1300);await t.screenshot({path:out+'/phone-touch-gameplay.png'});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.deepEqual(await t.evaluate(()=>({x:scrollX,y:scrollY})),{x:0,y:0});await t.locator('#pause').tap();results.touch={syntheticChromeTouch:true,pageScroll:false};await touch.close();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.ok(requests.every(u=>u.startsWith(process.env.TEST_URL||'http://127.0.0.1:4186')||u.startsWith('data:')||u.startsWith('blob:'+(process.env.TEST_URL||'http://127.0.0.1:4186'))));
 results.audio='AudioContext running after play, suspended on pause; physical speaker output not assessed';
 console.log('PASS production full round, replay, persistence, isolation, input, dialogs, resize, audio and pause',results);
}finally{await fs.writeFile(out+'/production.json',JSON.stringify({results,errors,failed,requests:[...new Set(requests)]},null,2));await browser.close();}
