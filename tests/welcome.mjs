import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const folder='tests/artifacts/welcome'; await fs.mkdir(folder,{recursive:true});
const url=process.env.TEST_URL||'http://127.0.0.1:5189/';
const page=await browser.newPage({viewport:{width:360,height:740},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const errors=[],checks=[]; page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto(url); await page.locator('#play:not([disabled])').waitFor();
 for(const [width,height] of [[360,740],[390,844],[320,568],[430,932],[800,360]]) {
   await page.setViewportSize({width,height}); await page.waitForTimeout(150);
   const metrics=await page.evaluate(()=>{
     const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};};
     return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,play:rect('#play'),best:rect('.start-card .best-line'),frame:rect('#game-frame'),preview:rect('#game')};
   });
   assert.ok(metrics.scrollWidth<=width+1,JSON.stringify(metrics));
   if(height>=568) {
     assert.ok(metrics.play.y>=0&&metrics.best.bottom<=height+1,JSON.stringify(metrics));
     assert.ok(Math.abs(height-metrics.frame.bottom-12)<=1,`Welcome leaves unused space: ${JSON.stringify(metrics)}`);
   }
   assert.equal(await page.locator('.field-guide').isVisible(),false);
   await page.locator('#welcome-help').scrollIntoViewIfNeeded();
   await page.screenshot({path:`${folder}/${width}x${height}.png`});
   checks.push({viewport:[width,height],metrics});
 }
 await page.setViewportSize({width:360,height:740}); await page.evaluate(()=>scrollTo(0,0));
 await page.locator('#welcome-help').tap();
 assert.match(await page.locator('#primary-controls').textContent(),/^Drag to steer/);
 assert.equal(await page.locator('#alternative-controls').isVisible(),false);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'help-title');
 await page.screenshot({path:`${folder}/help-touch.png`});
 await page.locator('#other-controls summary').click();
 assert.match(await page.locator('#alternative-controls').textContent(),/W, A, S, D/);
 await page.locator('#close-help').focus(); await page.keyboard.press('Tab');
 assert.equal(await page.locator('#other-controls summary').evaluate(el=>el===document.activeElement),true);
 await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>document.activeElement.id),'welcome-help');
 await page.locator('#settings').tap(); assert.doesNotMatch(await page.locator('#preferences').textContent(),/W, A, S, D/);
 await page.locator('#close-preferences').tap();
 await page.evaluate(()=>document.documentElement.style.fontSize='200%');
 for (const width of [320,390]) {
   await page.setViewportSize({width,height:568});
   for(const selector of ['#play','#welcome-help','.start-card .best-line']) {
     await page.locator(selector).scrollIntoViewIfNeeded();
     const r=await page.locator(selector).boundingBox();
     assert.ok(r.x>=0&&r.x+r.width<=width+1&&r.y>=0&&r.y+r.height<=569,JSON.stringify({width,selector,r}));
   }
 }
 await page.screenshot({path:`${folder}/text-200.png`});
 await page.locator('#welcome-help').tap(); await page.locator('#close-help').scrollIntoViewIfNeeded(); await page.locator('#close-help').tap();
 await page.evaluate(()=>document.documentElement.style.fontSize='');
 await page.setViewportSize({width:360,height:740}); await page.locator('#play').tap(); await page.locator('#pause').tap();
 const time=await page.locator('#timer').textContent();
 await page.locator('#pause-help').tap(); await page.keyboard.press('Escape'); await page.waitForTimeout(500);
 assert.equal(await page.locator('#game-frame').getAttribute('data-mode'),'paused');
 assert.equal(await page.locator('#timer').textContent(),time);
 assert.equal(await page.evaluate(()=>document.activeElement.id),'pause-help');
 await page.locator('#resume').tap(); assert.equal(await page.locator('#game-frame').getAttribute('data-mode'),'playing');
 const desktop=await browser.newPage({viewport:{width:1440,height:900}});
 await desktop.goto(url); await desktop.locator('#play:not([disabled])').waitFor();
 assert.equal(await desktop.locator('.field-guide').isVisible(),true);
 await desktop.screenshot({path:`${folder}/desktop.png`}); await desktop.locator('#welcome-help').click();
 assert.match(await desktop.locator('#primary-controls').textContent(),/mouse.*WASD/);
 await fs.writeFile(`${folder}/results.json`,JSON.stringify({checks,errors},null,2)); assert.deepEqual(errors,[]);
 console.log('PASS: compact phone welcome, scrolling at enlarged text/short screens, touch-first help, alternate controls, keyboard focus, paused help, and desktop introduction.');
} finally {await browser.close();}
