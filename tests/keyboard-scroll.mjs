import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
  for (const url of [process.env.TEST_URL || 'http://127.0.0.1:5188/', process.env.PRODUCTION_URL || 'http://127.0.0.1:5189/']) {
    const page = await browser.newPage({viewport:{width:1280,height:720}});
    await page.goto(url);
    await page.waitForFunction(()=>!document.querySelector('#play').disabled);
    await page.locator('#play').click();
    // A scrollable desktop page and focus outside the harbor reproduce the bug.
    await page.evaluate(()=>window.scrollTo(0,160));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight));
    for (const focus of ['game', 'body', 'sound']) {
      await page.evaluate(focus=>{
        if(focus==='body') document.activeElement.blur();
        else document.getElementById(focus).focus({preventScroll:true});
      },focus);
      for (const [key,sign] of [['ArrowUp',-1],['ArrowDown',1]]) {
        const before=await page.evaluate(()=>({scroll:scrollY, player:window.__waterHole?.snapshot().player.y}));
        await page.keyboard.down(key); await page.waitForTimeout(400); await page.keyboard.up(key); await page.waitForTimeout(150);
        const after=await page.evaluate(()=>({scroll:scrollY, player:window.__waterHole?.snapshot().player.y}));
        assert.equal(after.scroll,before.scroll,`${url} ${focus} ${key} scrolled the page`);
        if(before.player!==undefined) assert.ok((after.player-before.player)*sign>10,`${key} must still steer`);
      }
    }
    await page.locator('#pause').click();
    await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0);});
    await page.keyboard.down('ArrowDown');await page.waitForTimeout(400);await page.keyboard.up('ArrowDown');await page.waitForTimeout(150);
    assert.ok(await page.evaluate(()=>scrollY>0),'Paused page should scroll normally');
    await page.locator('#settings').click();
    await page.locator('#motion-setting').focus();
    await page.evaluate(()=>{window.keyTrace=[];window.addEventListener('keydown',e=>window.keyTrace.push({key:e.key,prevented:e.defaultPrevented,target:e.target.id,active:document.activeElement.id}));});
    await page.keyboard.press('Space');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
    const menuArrow=await page.evaluate(()=>window.keyTrace.find(e=>e.key==='ArrowDown'));
    assert.equal(menuArrow.target,'motion-setting');
    assert.equal(menuArrow.prevented,false,'Game must not consume arrows in settings');
    await page.keyboard.press('Escape');
    await page.locator('#resume').focus();await page.keyboard.press('Space');
    await page.waitForFunction(()=>document.querySelector('#game-frame').dataset.mode==='playing');
    console.log(`${url}: arrows steer without page scroll; paused scrolling, settings arrows and Space resume pass`);
    await page.close();
  }
} finally { await browser.close(); }
