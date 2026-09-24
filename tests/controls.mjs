import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const baseline = process.env.RUN_LABEL === 'baseline';
const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const results=[],errors=[];
try {
  for(const dpr of [1,2,3]){
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:dpr,isMobile:true,hasTouch:true});
    const page=await context.newPage(),cdp=await context.newCDPSession(page);
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.goto(process.env.TEST_URL||'http://127.0.0.1:5178/');await page.waitForFunction(()=>window.__waterHole&&!document.querySelector('#play').disabled);await page.locator('#play').tap();await page.waitForTimeout(300);
    const snap=()=>page.evaluate(()=>window.__waterHole.snapshot());
    const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
    const start=await snap();
    await touch('touchStart',70,550);await touch('touchMove',82,550);await page.waitForTimeout(300);const short=await snap();
    await touch('touchMove',290,550);await page.waitForTimeout(220);const long=await snap();
    await touch('touchMove',210,550);await page.waitForTimeout(100);const reverse=await snap();
    await touch('touchEnd');await page.waitForTimeout(180);const released=await snap();
    const row={dpr,shortVelocity:short.player.vx,longVelocity:long.player.vx,reversedVelocityAfter100ms:reverse.player.vx,releaseVelocityAfter180ms:released.player.vx,fps:released.fps};
    if(!baseline){assert.ok(short.player.vx>50&&short.player.vx<200,'Short drag must retain proportional control');assert.ok(long.player.vx>300,'Long drag should reach full speed');assert.ok(reverse.player.vx<0,'Reverse must respond within 100ms after a long drag');assert.ok(Math.abs(released.player.vx)<10,'Release should stop promptly');}
    assert.ok(short.player.x>start.player.x);
    // Move down to the southern wall, then reverse without lifting the finger.
    await touch('touchStart',145,450);await touch('touchMove',145,640);await page.waitForTimeout(2600);const wall=await snap();
    assert.ok(wall.player.y<=1038&&wall.player.y>=900,'Boundary must stop navigation in water');
    await touch('touchMove',145,540);await page.waitForTimeout(300);const away=await snap();
    row.boundaryY=wall.player.y;row.afterBoundaryReverseY=away.player.y;
    if(!baseline)assert.ok(away.player.y<wall.player.y-30,'Must reverse away from wall without lifting');
    await touch('touchEnd');
    await page.locator('#pause').tap();await page.setViewportSize({width:844,height:390});await page.locator('#resume').tap();
    await touch('touchStart',350,210);await touch('touchMove',410,210);await page.waitForTimeout(300);await touch('touchEnd');
    assert.equal((await snap()).mode,'playing');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    results.push(row);console.log(JSON.stringify(row));await context.close();
  }
  assert.deepEqual(errors,[]);await fs.mkdir('tests/artifacts',{recursive:true});await fs.writeFile(`tests/artifacts/controls-${baseline?'baseline':'updated'}.json`,JSON.stringify({results,errors},null,2));
}finally{await browser.close();}
