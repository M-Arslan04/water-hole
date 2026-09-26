import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const youtube=process.env.YOUTUBE==='1',label=youtube?'youtube':'web';
const folder='tests/artifacts/mobile-polish';await fs.mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[],results=[];
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,recordVideo:{dir:folder,size:{width:390,height:844}}});
if(youtube)await context.route('https://www.youtube.com/game_api/v1',r=>r.fulfill({contentType:'text/javascript',body:`window.host={};window.ytgame={IN_PLAYABLES_ENV:false,game:{firstFrameReady(){},gameReady(){},async loadData(){return '';},async saveData(){}},system:{isAudioEnabled(){return false;},onAudioEnabledChange(f){host.audio=f;},onPause(f){host.pause=f;},onResume(f){host.resume=f;}}};`}));
const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
const snap=()=>page.evaluate(()=>window.__waterHole.snapshot());
try {
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:5192/');await page.locator('#play').tap();
 await page.waitForFunction(()=>window.__waterHole.snapshot().captureEffects.length>0);
 await page.screenshot({path:`${folder}/${label}-after-capture.png`});
 if(youtube)await page.evaluate(()=>host.pause());else await page.locator('#pause').tap();
 const frozen=await snap();assert.ok(frozen.captureEffects.length>0,'Pause must exercise an active capture');
 await page.waitForTimeout(400);assert.deepEqual((await snap()).captureEffects,frozen.captureEffects);assert.equal((await snap()).score,frozen.score);
 assert.ok(frozen.captureEffects.every(f=>f.depth===9&&!frozen.entities.some(e=>e.id===f.id)),'Captured sprite belongs to presentation only, above the whirlpool');
 if(youtube)await page.evaluate(()=>host.resume());else await page.locator('#resume').tap();
 await page.waitForTimeout(550);assert.ok((await snap()).captureEffects.every(f=>!frozen.captureEffects.some(old=>old.id===f.id)),'Completed effects must be destroyed');
 await page.screenshot({path:`${folder}/${label}-after-hud.png`});
 await page.locator('#pause').tap();
 for(const [width,height] of [[320,568],[360,640],[390,844],[844,390],[768,1024],[1440,900],...(youtube?[[288,1024],[1600,450]]:[])]) {
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  const before=await snap();const geometry=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};return {game:rect('#game'),hud:rect('#hud'),dock:rect('#game-status'),pause:rect('#pause'),canvas:rect('#game canvas'),scrollWidth:document.documentElement.scrollWidth};});
  assert.ok(geometry.game.height>30&&geometry.game.width>0);
  assert.ok(Math.abs(geometry.canvas.height-geometry.game.height)<2);
  if(width<=650||height<=550){assert.ok(geometry.hud.bottom<=geometry.game.y+1,'HUD cannot overlap water');assert.ok(geometry.game.bottom<=geometry.dock.y+1,'Dock cannot overlap water');assert.ok(geometry.pause.width>=44&&geometry.pause.height>=44);assert.ok(geometry.dock.bottom<=height+1);}
  assert.ok(geometry.scrollWidth<=width+1);await page.waitForTimeout(80);const after=await snap();assert.deepEqual(after.player,before.player);assert.equal(after.score,before.score);assert.equal(after.time,before.time);assert.deepEqual(after.captureEffects,before.captureEffects);results.push({width,height,geometry});
 }
 await page.setViewportSize({width:320,height:568});await page.evaluate(()=>document.documentElement.style.fontSize='200%');await page.locator('#settings').click();await page.locator('#contrast-setting').check();await page.locator('#motion-setting').selectOption('reduce');await page.locator('#close-preferences').click();await page.locator('#pause-help').click();await page.locator('#close-help').click();
 assert.ok(await page.evaluate(()=>{const g=document.querySelector('#game').getBoundingClientRect(),h=document.querySelector('#hud').getBoundingClientRect();return g.height>30&&g.y>=h.bottom;}));
 await page.screenshot({path:`${folder}/${label}-200-percent.png`});
 await page.evaluate(()=>document.documentElement.style.fontSize='');await page.setViewportSize({width:390,height:844});await page.locator('#resume').click();
 const cdp=await context.newCDPSession(page);let found=false;
 for(let i=0;i<70;i++) {const s=await snap();if(s.captureEffects.some(f=>f.reduced)){found=true;break;}const target=s.entities.filter(e=>e.tier<=s.stage).sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)-Math.hypot(b.x-s.player.x,b.y-s.player.y))[0];const dx=target.x-s.player.x,dy=target.y-s.player.y,d=Math.hypot(dx,dy),r=await page.locator('#game').boundingBox(),x=r.x+r.width/2,y=r.y+r.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx/d*50,y:y+dy/d*50}]});await page.waitForTimeout(60);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 assert.ok(found,'Reduced-motion capture flight exercised');assert.deepEqual(errors,[]);
 await fs.writeFile(`${folder}/${label}-checks.json`,JSON.stringify({results,errors,captureFrozen:frozen.captureEffects,scoreAtCapture:frozen.score},null,2));console.log(`PASS ${label}: HUD bounds, resize state, text/settings/help, normal and reduced capture lifecycle, pause.`);
 const video=page.video();await context.close();await video.saveAs(`${folder}/${label}-after-capture.webm`);
}finally{await browser.close();}
