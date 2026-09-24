import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.env.TEST_URL || 'http://127.0.0.1:5178/';
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const errors = [], results = [], reports = 'tests/artifacts';
await fs.mkdir(reports,{recursive:true});
const context = await browser.newContext({ viewport:{width:1440,height:1100}, deviceScaleFactor:1 });
const page = await context.newPage();
page.on('pageerror', e=>errors.push(e.message)); page.on('console', m=>{ if(m.type()==='error') errors.push(m.text()); });
const snapshot = () => page.evaluate(()=>window.__waterHole.snapshot());
const record = (name,details) => { results.push({name,details}); console.log(name,JSON.stringify(details)); };
try {
 await page.goto(base); await page.locator('#play').waitFor({state:'visible'}); await page.waitForFunction(()=>!document.querySelector('#play').disabled);
 await page.screenshot({path:`${reports}/desktop-welcome.png`,fullPage:true});
 await page.locator('#play').click(); await page.waitForTimeout(400);
 const start=await snapshot(); assert.equal(start.mode,'playing'); assert.equal(start.audio.contextState,'running'); assert.ok(start.time>=88);
 const large = start.entities.find(e=>e.kind==='cargo'); assert.ok(large && large.tier>start.stage); record('Start and locked cargo present',{time:start.time,objects:start.entities.length});
 await page.locator('#sound').click(); assert.equal((await snapshot()).audio.muted,true); await page.waitForTimeout(100); assert.equal((await snapshot()).audio.contextState,'suspended'); await page.locator('#sound').click(); assert.equal((await snapshot()).audio.muted,false); await page.waitForTimeout(100); assert.equal((await snapshot()).audio.contextState,'running'); record('Mute toggles audio',true);
 // Exercise actual mouse hold and steering; read-only diagnostics never alter game state.
 const box = await page.locator('#game canvas').boundingBox();
 await page.mouse.move(box.x+box.width*0.65,box.y+box.height*0.6); await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up();
 assert.ok(Math.hypot((await snapshot()).player.x-start.player.x,(await snapshot()).player.y-start.player.y)>50); record('Mouse steering changes position',true);
 await page.locator('#pause').click(); const paused=await snapshot(); await page.waitForTimeout(1200); assert.equal((await snapshot()).time,paused.time); assert.equal((await snapshot()).mode,'paused'); await page.locator('#resume').click();
 await page.evaluate(()=>window.dispatchEvent(new Event('blur'))); assert.equal((await snapshot()).mode,'paused'); const blurTime=(await snapshot()).time; await page.waitForTimeout(700); assert.equal((await snapshot()).time,blurTime); await page.locator('#resume').click(); record('Pause and window blur freeze the clock',true);
 let pressed = new Set(), iterations=0, seenStages=new Set(), fps=[], hazard=false, vesselCrowding=0, unlockTimes={};
 const setKeys=async(wanted)=>{ for(const k of pressed) if(!wanted.has(k)) await page.keyboard.up(k); for(const k of wanted) if(!pressed.has(k)) await page.keyboard.down(k); pressed=wanted; };
 const water = (x,y) => { if(x<65||x>1535||y<65||y>1035) return false; if(Math.hypot(x-253,y-795)<130||Math.hypot(x-1348,y-241)<139) return false; if(x<260&&y>248&&y<360||x>1330&&y>640&&y<765) return false; return true; };
 while(true){ const s=await snapshot(); if(s.mode==='finished') break; assert.equal(s.mode,'playing'); seenStages.add(s.stage); unlockTimes[s.stage+1] ??= 90-s.time; fps.push(s.fps); hazard ||= s.slowed;
   const distantShips=s.entities.filter(e=>e.tier>=2 && Math.hypot(e.x-s.player.x,e.y-s.player.y)>s.player.radius+160); for(let i=0;i<distantShips.length;i++) for(let j=i+1;j<distantShips.length;j++) if(Math.hypot(distantShips[i].x-distantShips[j].x,distantShips[i].y-distantShips[j].y)<(distantShips[i].radius+distantShips[j].radius)*.85) vesselCrowding++;
   const candidates=s.entities.filter(e=>e.tier<=s.stage).filter(e=>{for(let i=1;i<=12;i++) if(!water(s.player.x+(e.x-s.player.x)*i/12,s.player.y+(e.y-s.player.y)*i/12)) return false; return true; });
   const target=candidates.sort((a,b)=>(Math.hypot(a.x-s.player.x,a.y-s.player.y)/(1+a.tier*.18))-(Math.hypot(b.x-s.player.x,b.y-s.player.y)/(1+b.tier*.18)))[0];
   const wanted=new Set(); if(target){ const dx=target.x-s.player.x,dy=target.y-s.player.y,d=Math.hypot(dx,dy); if(d>s.player.radius*.8){ if(Math.abs(dx)>18) wanted.add(dx>0?'d':'a'); if(Math.abs(dy)>18) wanted.add(dy>0?'s':'w'); } } else wanted.add('d');
   await setKeys(wanted);
   if(iterations%60===0){record('Round progress',{time:s.time,score:s.score,stage:s.stage+1,caught:s.captured,fps:Math.round(s.fps)});await page.screenshot({path:`${reports}/desktop-stage-${s.stage+1}.png`});}
   if(iterations++>600) throw Error('Round failed to finish');
   await page.waitForTimeout(220);
 }
 await setKeys(new Set()); const finished=await snapshot(); assert.ok(finished.captured>=15); assert.equal(vesselCrowding,0,'Ships repeatedly overlap away from suction'); assert.ok(finished.stage>=3,`Only reached stage ${finished.stage}`); assert.ok(finished.score>0); assert.equal(finished.best,finished.score); assert.equal(await page.locator('#result').isVisible(),true); await page.screenshot({path:`${reports}/desktop-result.png`});
 record('Complete real-time keyboard round',{score:finished.score,captured:finished.captured,largest:finished.largest,stages:[...seenStages],fpsMedian:fps.sort((a,b)=>a-b)[Math.floor(fps.length/2)],hazardEncountered:hazard,vesselCrowding,unlockTimes});
 await page.locator('#again').click(); const restarted=await snapshot(); assert.equal(restarted.mode,'playing'); assert.ok(restarted.time>=89); assert.equal(restarted.score,0); assert.equal(restarted.xp,0); record('Restart clears progress without refreshing',true);
 await page.reload(); await page.waitForFunction(()=>window.__waterHole?.snapshot().mode==='welcome'); assert.equal((await snapshot()).best,finished.score); record('Best survives reload',finished.score);
 // Real touch events via Chrome DevTools emulate a phone finger on the canvas.
 const mobileContext = await browser.newContext({ viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true }); const mobile=await mobileContext.newPage(); mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.goto(base); await mobile.waitForFunction(()=>!document.querySelector('#play').disabled); await mobile.screenshot({path:`${reports}/mobile-welcome.png`,fullPage:true}); await mobile.locator('#play').tap(); await mobile.waitForTimeout(400);
 const mobileStart=await mobile.evaluate(()=>window.__waterHole.snapshot()); const cdp=await mobileContext.newCDPSession(mobile);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:130,y:580}]}); await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:186,y:555}]}); await mobile.waitForTimeout(1500); await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const mobileAfter=await mobile.evaluate(()=>window.__waterHole.snapshot()); assert.ok(Math.hypot(mobileAfter.player.x-mobileStart.player.x,mobileAfter.player.y-mobileStart.player.y)>100); assert.ok(mobileAfter.captured>0); assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false); const toastBox=await mobile.locator('#toast').boundingBox(); assert.ok(toastBox.x>=0 && toastBox.x+toastBox.width<=390,'Growth toast is clipped'); await mobile.screenshot({path:`${reports}/mobile-playing.png`}); record('390px phone: touch steering, capture, no horizontal overflow',{moved:Math.round(Math.hypot(mobileAfter.player.x-mobileStart.player.x,mobileAfter.player.y-mobileStart.player.y)),captures:mobileAfter.captured});
 await mobile.locator('#pause').tap(); await mobile.setViewportSize({width:844,height:390}); await mobile.waitForTimeout(500); await mobile.screenshot({path:`${reports}/mobile-landscape.png`}); assert.equal(await mobile.locator('#resume').isVisible(),true); await mobile.locator('#resume').tap(); record('Landscape resize and resume',true); await mobileContext.close();
 const noStorage=await browser.newContext({viewport:{width:390,height:844}}); await noStorage.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Disabled','SecurityError');}});}); const restricted=await noStorage.newPage(); restricted.on('pageerror',e=>errors.push(e.message)); await restricted.goto(base); await restricted.waitForFunction(()=>!document.querySelector('#play').disabled); await restricted.locator('#play').click(); assert.equal(await restricted.evaluate(()=>window.__waterHole.snapshot().mode),'playing'); record('Storage-denied browser remains playable',true); await noStorage.close();
 assert.deepEqual(errors,[]); record('Console errors',errors); await fs.writeFile(`${reports}/results.json`,JSON.stringify({date:new Date().toISOString(),results,errors},null,2));
} finally { await browser.close(); }
