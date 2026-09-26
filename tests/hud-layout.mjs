import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser = await chromium.launch({headless:true, executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const folder='tests/artifacts/hud-layout'; await fs.mkdir(folder,{recursive:true});
const page=await browser.newPage({viewport:{width:360,height:800},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const errors=[],results=[]; page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto(process.env.TEST_URL||'http://127.0.0.1:5188/');
  await page.locator('#play:not([disabled])').waitFor(); await page.locator('#play').tap();
  for (const [width,height] of [[360,800],[320,568],[390,844],[360,660],[568,320],[800,360],[768,1024],[1440,900]]) {
    await page.setViewportSize({width,height}); await page.waitForTimeout(200);
    const metrics=await page.evaluate(()=>{
      const rect=id=>{const r=document.querySelector(id).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
      return {canvas:rect('#game canvas'),dock:rect('#game-status'),growth:rect('#growth'),minimap:rect('#minimap'),hint:rect('#hint'),scrollWidth:document.documentElement.scrollWidth,viewport:[innerWidth,innerHeight],camera:window.__waterHole.snapshot().camera};
    });
    assert.ok(metrics.canvas.bottom<=metrics.dock.y+1,JSON.stringify(metrics));
    assert.ok(metrics.scrollWidth<=width+1);
    for (const id of ['growth','minimap']) {
      const r=metrics[id]; assert.ok(r.x>=metrics.dock.x&&r.right<=metrics.dock.right+1&&r.y>=metrics.dock.y&&r.bottom<=metrics.dock.bottom+1,JSON.stringify({id,...metrics}));
    }
    assert.ok(metrics.canvas.height>100,`Insufficient water at ${width}x${height}`);
    assert.ok(Math.abs(metrics.camera.height/2-metrics.canvas.height)<2,'Camera must resize to the visible playfield');
    await page.screenshot({path:`${folder}/${width}x${height}.png`}); results.push(metrics);
  }
  await page.setViewportSize({width:360,height:800});
  await page.locator('#settings').tap(); await page.locator('#contrast-setting').check(); await page.locator('#close-preferences').tap(); await page.locator('#resume').tap();
  await page.screenshot({path:`${folder}/high-contrast.png`});
  await page.evaluate(()=>document.documentElement.style.fontSize='200%'); await page.waitForTimeout(200);
  const zoom=await page.evaluate(()=>({water:document.querySelector('#game').getBoundingClientRect().bottom,dock:document.querySelector('#game-status').getBoundingClientRect().top,scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(zoom.water<=zoom.dock+1&&zoom.scroll<=zoom.width+1,JSON.stringify(zoom));
  await page.screenshot({path:`${folder}/text-200.png`});
  assert.deepEqual(errors,[]);
  await fs.writeFile(`${folder}/results.json`,JSON.stringify({results,zoom,errors},null,2));
  console.log('PASS: dock and canvas do not overlap at 8 viewport sizes; camera resizes; high contrast and 200% text fit.');
} finally {await browser.close();}
