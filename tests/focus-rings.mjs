import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const url=process.env.TEST_URL || 'http://127.0.0.1:4190';
const out=process.env.TEST_OUTPUT || 'tests/artifacts/focus-rings';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const results=[],errors=[];
const baseline=process.env.FOCUS_BASELINE==='1';
async function inspect(p,id,expected,label){
 await p.waitForFunction(id=>document.activeElement?.id===id,id);
 const state=await p.locator('#'+id).evaluate(e=>({id:e.id,visible:e.matches(':focus-visible'),outline:getComputedStyle(e).outlineStyle,width:getComputedStyle(e).outlineWidth}));
 results.push({label,...state});
 if(!baseline)assert.equal(state.outline!=='none'&&state.width!=='0px',expected,label);
}
async function round(keyboard){
 const name=keyboard?'keyboard':'mouse';
 const p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url);await p.waitForFunction(()=>!document.querySelector('#play').disabled);
 if(keyboard){for(let i=0;i<8&&(await p.evaluate(()=>document.activeElement.id))!=='play';i++)await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'play');await inspect(p,'play',true,'Tab to Play');await p.keyboard.press('Enter');}
 else await p.locator('#play').click();
 if(keyboard)await p.keyboard.press('Escape');else await p.locator('#pause').click();
 await inspect(p,'resume',keyboard,name+' pause');
 if(keyboard)await p.keyboard.press('Enter');else await p.locator('#resume').click();
 if(!keyboard){await p.keyboard.down('d');await p.waitForTimeout(350);await p.keyboard.up('d');}
 // Let the real 90-second timer expire; no scene mutation or accelerated clock.
 console.log(name+': waiting for complete round');
 await p.waitForFunction(()=>document.querySelector('.ocean-shell').dataset.screen==='finished',null,{timeout:130000});
 await inspect(p,'result-title',false,name+' results');
 await p.screenshot({animations:'disabled',path:out+'/'+name+'-results.png'});
 if(keyboard){await p.keyboard.press('Tab');await inspect(p,'again',true,'Results Tab to replay');await p.keyboard.press('Tab');await p.keyboard.press('Enter');}
 else await p.locator('#ocean-home').click();
 await inspect(p,'play',keyboard,name+' return home');await p.screenshot({animations:'disabled',path:out+'/'+name+'-home.png'});
 if(!keyboard){await p.keyboard.press('Tab');await inspect(p,'welcome-help',true,'Mouse to keyboard');await p.keyboard.press('Shift+Tab');await inspect(p,'play',true,'Shift+Tab to Play');}
 if(keyboard){await p.locator('#play').click();await p.locator('#pause').click();await inspect(p,'resume',false,'Keyboard to mouse pause');await p.locator('#pause-home').click();await p.locator('#ocean-confirm-leave').click();await inspect(p,'play',false,'Keyboard to mouse home');}
 await p.close();
}
try{
 // A first visit/reload is not a return-home transition and must not autofocus Play.
 const home=await browser.newPage();home.on('pageerror',e=>errors.push(e.message));
 for(const action of ['fresh','reload','reload-after-keyboard']){
  if(action==='fresh')await home.goto(url);else await home.reload();
  await home.waitForFunction(()=>!document.querySelector('#play').disabled);
  await home.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const state=await home.locator('#play').evaluate(e=>({active:e===document.activeElement,outline:getComputedStyle(e).outlineStyle}));
  results.push({label:action,...state});
  if(!baseline){assert.equal(state.active,false,action);assert.equal(state.outline,'none',action);}
  await home.screenshot({animations:'disabled',path:out+'/'+action+'.png'});
  if(action==='reload'){for(let i=0;i<8&&(await home.evaluate(()=>document.activeElement.id))!=='play';i++)await home.keyboard.press('Tab');await inspect(home,'play',true,'Keyboard before reload');}
 }
 await home.close();
 await Promise.all(baseline?[round(false)]:[round(false),round(true)]);
 const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await p.goto(url);await p.waitForFunction(()=>!document.querySelector('#play').disabled);
 await p.locator('#play').tap();await p.locator('#pause').tap();await inspect(p,'resume',false,'Touch pause');
 await p.locator('#pause-home').tap();await p.locator('#ocean-confirm-leave').tap();await inspect(p,'play',false,'Touch return home');
 await p.locator('#welcome-help').tap();await p.locator('#close-help').tap();
 assert.equal(await p.evaluate(()=>document.activeElement.id),'welcome-help');
 // High contrast keeps keyboard outlines visible too.
 await p.locator('#settings').tap();await p.locator('#contrast-setting').check();await p.locator('#close-preferences').tap();
 await p.keyboard.press('Tab');await inspect(p,'sound',true,'High contrast keyboard');
 await p.close();assert.deepEqual(errors,[]);console.log(baseline?'Baseline recorded':'PASS automatic pointer focus and visible keyboard focus',results);
}finally{await fs.writeFile(out+'/results.json',JSON.stringify({results,errors},null,2));await browser.close();}
