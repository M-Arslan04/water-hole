import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../dist');
const csp="default-src 'none'; script-src 'report-sample' 'self' 'unsafe-eval' 'unsafe-inline' blob: https://www.youtube.com/game_api/v0 https://www.youtube.com/game_api/v0/ https://www.youtube.com/game_api/v1 https://www.youtube.com/game_api/v1/; object-src 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data:; media-src 'self' blob:; font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com; connect-src 'self' blob: data:; sandbox allow-pointer-lock allow-same-origin allow-scripts; base-uri 'self'; manifest-src 'self'; worker-src 'self' blob:";
const server=createServer(async(req,res)=>{try{const name=path.join(root,new URL(req.url,'http://local').pathname);const file=name.endsWith('/')?name+'index.html':name;res.setHeader('Content-Security-Policy',csp);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.txt':'text/plain'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[], external=[], results=[], heap=[];let heapInterval;
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
await context.addInitScript(()=>{
 for(const name of ['localStorage','sessionStorage']) Object.defineProperty(window,name,{get(){throw Error('Forbidden storage access: '+name);}});
 for(const name of ['language','languages']) Object.defineProperty(navigator,name,{get(){throw Error('Forbidden language access');}});
 window.__host={events:[],saves:[],scores:[],callbacks:{}};
});
await context.route('https://www.youtube.com/game_api/v1',route=>route.fulfill({contentType:'text/javascript',body:`
 const h=window.__host;
 window.ytgame={IN_PLAYABLES_ENV:true,game:{firstFrameReady(){h.events.push({name:'first',loading:!!document.querySelector('#boot-status')});},gameReady(){h.events.push({name:'ready',milliseconds:performance.now(),play:!document.querySelector('#play').disabled,canvas:!!document.querySelector('canvas')});},async loadData(){h.events.push({name:'load'});return JSON.stringify({version:1,best:100,settings:{highContrast:false,motion:'system'}});},async saveData(data){h.saves.push(JSON.parse(data));}},system:{isAudioEnabled(){return false;},onAudioEnabledChange(fn){h.callbacks.audio=fn;return ()=>{};},onPause(fn){h.callbacks.pause=fn;return ()=>{};},onResume(fn){h.callbacks.resume=fn;return ()=>{};}},engagement:{async sendScore(s){h.scores.push(s.value);}}};`}));
const page=await context.newPage();page.setDefaultTimeout(15000);
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(!r.url().startsWith(url)&&!r.url().startsWith('data:')&&r.url()!=='https://www.youtube.com/game_api/v1')external.push(r.url());});
try{
 await page.goto(url);const metrics=await context.newCDPSession(page);heapInterval=setInterval(()=>metrics.send('Runtime.getHeapUsage').then(m=>heap.push(m.usedSize)).catch(()=>{}),1000); await page.waitForFunction(()=>window.__host.events.some(e=>e.name==='ready'));
 assert.deepEqual(await page.evaluate(()=>window.__host.events.map(e=>e.name)),['first','load','ready']);
 assert.ok(await page.evaluate(()=>window.__host.events[0].loading&&window.__host.events[2].play&&window.__host.events[2].canvas));
 assert.equal(await page.locator('#sound').isVisible(),false);
 assert.equal(await page.locator('a[href]').count(),0);
 for(const [width,height] of [[288,1024],[360,840],[360,640],[600,800],[700,700],[800,600],[960,540],[1260,540],[1600,450]]){
  await page.setViewportSize({width,height}); await page.locator('#welcome-help').click();
  await page.locator('#close-help').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight),`page overflow ${width}x${height}`);
  const box=await page.locator('#game').boundingBox();assert.ok(box.width>0&&box.height>0);results.push(`${width}x${height}`);
 }
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 await page.locator('#welcome-help').click();await page.locator('#close-help').click();
 await page.locator('#settings').click();await page.locator('#contrast-setting').check();await page.locator('#motion-setting').selectOption('reduce');
 await page.evaluate(()=>{window.__escapeDefault=null;document.querySelector('dialog[open]').addEventListener('keydown',e=>{if(e.key==='Escape')window.__escapeDefault=e.defaultPrevented;});});
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.__escapeDefault),false);
 await page.evaluate(()=>document.documentElement.style.fontSize='');
 await page.locator('#play').tap();
 for(const [width,height] of [[288,1024],[360,840],[360,640],[600,800],[700,700],[800,600],[960,540],[1260,540],[1600,450]]) {
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  assert.ok(await page.evaluate(()=>{const g=document.querySelector('#game').getBoundingClientRect(),d=document.querySelector('#game-status').getBoundingClientRect();return g.width>0&&g.height>0&&g.bottom<=d.top+1&&d.bottom<=innerHeight&&document.documentElement.scrollWidth<=innerWidth;}),`gameplay fit ${width}x${height}`);
 }
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1100);
 await page.evaluate(()=>window.__host.callbacks.pause());
 const frozen=await page.locator('#game canvas').evaluate(c=>c.toDataURL());const timer=await page.locator('#timer').textContent();
 await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));window.__host.callbacks.audio(true);});
 await page.waitForTimeout(1100);assert.equal(await page.locator('#timer').textContent(),timer);assert.equal(await page.locator('#game canvas').evaluate(c=>c.toDataURL()),frozen);
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);assert.equal(await page.locator('#game canvas').evaluate(c=>c.toDataURL()),frozen);
 await page.evaluate(()=>window.__host.callbacks.resume());await page.waitForTimeout(1200);assert.notEqual(await page.locator('#timer').textContent(),timer);
 await page.locator('#pause').click();await page.evaluate(()=>{window.__host.callbacks.pause();window.__host.callbacks.resume();});assert.equal(await page.locator('#pause-overlay').isVisible(),true);await page.locator('#resume').click();
 await page.setViewportSize({width:390,height:844});
 const box=await page.locator('#game').boundingBox();const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width/2+50,y:box.y+box.height/2+50}]});
 await page.waitForTimeout(1200);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.locator('#game').click();await page.keyboard.down('ArrowUp');await page.waitForTimeout(500);await page.keyboard.up('ArrowUp');
 await page.waitForFunction(()=>!document.querySelector('#result').hidden,{},{timeout:110000});
 for(const [width,height] of [[288,1024],[1600,450]]){await page.setViewportSize({width,height});await page.locator('#again').scrollIntoViewIfNeeded();assert.ok(await page.locator('#again').isVisible());}
 await page.setViewportSize({width:390,height:844});await page.locator('#again').tap();await page.waitForTimeout(300);assert.equal(await page.locator('#result').isVisible(),false);
 const saved=await page.evaluate(()=>window.__host);assert.ok(saved.saves.some(s=>s.settings.highContrast&&s.settings.motion==='reduce'));assert.ok(saved.scores.every(s=>s===100||saved.saves.some(d=>d.best===s)));
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const folder=path.resolve(import.meta.dirname,'../../../tests/artifacts/youtube');await fs.mkdir(folder,{recursive:true});await page.screenshot({path:path.join(folder,'replay.png')});
 const report={passed:true,sampledHeapMaxBytes:Math.max(...heap),heapSamples:heap.length,viewports:results,readiness:saved.events,saves:saved.saves,scores:saved.scores,errors,external,scope:'Production Chromium, official CSP, local SDK mock; not official certification or physical device'};
 await fs.writeFile(path.join(folder,'browser.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 // A missing SDK must still permit a session-only local game.
 await context.unroute('https://www.youtube.com/game_api/v1');await context.route('https://www.youtube.com/game_api/v1',r=>r.fulfill({body:'',contentType:'text/javascript'}));
 await page.goto(url);await page.locator('#play').click();assert.match(await page.locator('#save-status').textContent(),/session/);console.log('Missing SDK preview: PASS');
}catch(error){console.error({errors,external,body:await page.locator('body').innerText(),host:await page.evaluate(()=>window.__host)});throw error;}finally{clearInterval(heapInterval);await browser.close();await new Promise(r=>server.close(r));}
