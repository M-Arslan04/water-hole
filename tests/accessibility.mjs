import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const folder='tests/artifacts/accessibility'; await fs.mkdir(folder,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
const page=await context.newPage(), errors=[], checks=[];
page.on('pageerror',e=>errors.push(e.message));
const snap=()=>page.evaluate(()=>window.__waterHole.snapshot());
try {
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:5188/'); await page.waitForFunction(()=>!document.querySelector('#play').disabled);
 await page.keyboard.press('Tab'); assert.equal(await page.evaluate(()=>document.activeElement.className),'brand');
 await page.keyboard.press('Tab'); assert.equal(await page.evaluate(()=>document.activeElement.id),'settings');
 await page.keyboard.press('Space'); await page.locator('dialog[open]').waitFor();
 assert.equal(await page.evaluate(()=>document.activeElement.id),'contrast-setting');
 await page.keyboard.press('Space'); assert.equal((await snap()).accessibility.highContrast,true);
 await page.keyboard.press('Tab'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
 assert.equal((await snap()).accessibility.reducedMotion,true);
 await page.keyboard.press('Tab'); assert.equal(await page.evaluate(()=>document.activeElement.id),'close-preferences');
 await page.keyboard.press('Tab'); assert.equal(await page.evaluate(()=>document.activeElement.id),'contrast-setting');
 await page.screenshot({path:`${folder}/settings.png`});
 await page.keyboard.press('Escape'); assert.equal(await page.evaluate(()=>document.activeElement.id),'settings');
 assert.equal((await snap()).mode,'welcome'); checks.push('Keyboard open, checkbox/select, modal focus trap and Escape restoration');
 await page.locator('#sound').focus(); await page.keyboard.press('Space'); assert.equal((await snap()).audio.muted,true);
 await page.locator('#play').focus(); await page.keyboard.press('Space'); await page.waitForTimeout(250);
 assert.equal((await snap()).mode,'playing'); assert.equal(await page.evaluate(()=>document.activeElement.id),'game');
 const live=await page.locator('#announcer').textContent();
 await page.waitForTimeout(1500); assert.equal(await page.locator('#announcer').textContent(),live); checks.push('No repeated score/time live-region announcements');
 const before=await snap(); await page.keyboard.down('d'); await page.waitForTimeout(700); await page.keyboard.up('d'); assert.ok((await snap()).player.x>before.player.x+50);
 assert.equal((await snap()).particles,0); await page.screenshot({path:`${folder}/high-contrast.png`});
 await page.keyboard.press('Escape'); assert.equal((await snap()).mode,'paused'); await page.waitForTimeout(100); assert.equal(await page.evaluate(()=>document.activeElement.id),'resume');
 await page.keyboard.press('Space'); assert.equal((await snap()).mode,'playing');
 await page.locator('#settings').click(); const time=(await snap()).time; await page.keyboard.press('Escape'); await page.waitForTimeout(500); assert.equal((await snap()).mode,'paused'); assert.equal((await snap()).time,time); checks.push('Keyboard steering; settings and Escape preserve paused round');
 await page.reload(); await page.waitForFunction(()=>window.__waterHole?.snapshot().accessibility.highContrast); assert.equal((await snap()).audio.muted,true); assert.equal((await snap()).accessibility.reducedMotion,true); checks.push('All settings survive reload');
 await page.locator('#settings').click(); await page.locator('#motion-setting').selectOption('system'); await page.emulateMedia({reducedMotion:'reduce'}); await page.waitForFunction(()=>window.__waterHole.snapshot().accessibility.reducedMotion); assert.equal((await snap()).accessibility.reducedMotion,true); checks.push('OS reduced-motion preference');
 for(const width of [320,360,390,768]) {
   await page.setViewportSize({width,height:800});
   await page.evaluate(()=>document.documentElement.style.fontSize='200%');
   const sizes=await page.locator('#preferences').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,doc:document.documentElement.scrollWidth,viewport:innerWidth}));
   if(sizes.scroll>sizes.width+1) console.log(await page.locator('#preferences').evaluate(el=>[...el.querySelectorAll('*')].map(e=>({tag:e.tagName,id:e.id,text:e.textContent.slice(0,40),width:e.clientWidth,scroll:e.scrollWidth})).filter(e=>e.scroll>e.width+1)));
   assert.ok(sizes.scroll<=sizes.width+1,JSON.stringify(sizes)); assert.ok(sizes.doc<=width+1,JSON.stringify(sizes));
   await page.locator('#close-preferences').scrollIntoViewIfNeeded(); const done=await page.locator('#close-preferences').boundingBox(); assert.ok(done.y>=0&&done.y+done.height<=800);
 }
 await page.setViewportSize({width:320,height:800}); await page.screenshot({path:`${folder}/320-text-200.png`}); checks.push('200% root text scaling, 320/360/390/768px: settings reflow and Done reachable');
 await page.locator('#close-preferences').click(); await page.locator('#play').click(); await page.locator('#pause').click();
 for(const id of ['settings','sound','pause','resume']) { const r=await page.locator(`#${id}`).boundingBox(); assert.ok(r.width>=43.9&&r.height>=43.9,JSON.stringify({id,...r})); }
 const cdp=await context.newCDPSession(page); const ax=await cdp.send('Accessibility.getFullAXTree'); await fs.writeFile(`${folder}/accessibility-tree.json`,JSON.stringify(ax,null,2));
 assert.ok(ax.nodes.some(n=>n.role?.value==='button'&&n.name?.value==='Settings')); checks.push('Chrome accessibility tree exposes named controls (not a screen-reader test)');
 assert.deepEqual(errors,[]); await fs.writeFile(`${folder}/results.json`,JSON.stringify({browser:await browser.version(),checks,errors,screenReader:'Untested: computer-use access to Safari denied'},null,2)); console.log(checks);
} finally { await browser.close(); }
