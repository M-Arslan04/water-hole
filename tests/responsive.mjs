import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const url = process.env.PRODUCTION_URL || 'http://127.0.0.1:4178/';
const folder = 'tests/artifacts/responsive';
await fs.mkdir(folder,{recursive:true});
const errors=[], results=[];
const context=await browser.newContext({viewport:{width:360,height:800},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
function record(test,details){results.push({test,details});console.log(test,JSON.stringify(details));}
async function fit(state) {
  const metrics=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    const frame=document.querySelector('#game-frame'), card=document.querySelector('#result:not([hidden]) .modal-card, #pause-overlay:not([hidden]) .modal-card');
    const selectors=card?['h2','.final-score','.result-stats','.result-best','.primary-button']:[];
    return {viewport:{width:innerWidth,height:innerHeight},scroll:{x:scrollX,y:scrollY,width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight},frame:rect(frame),canvas:rect(document.querySelector('#game canvas')),playfield:rect(document.querySelector('#game')),dock:document.querySelector('#game-status').hidden?null:rect(document.querySelector('#game-status')),card:card?{...rect(card),clientWidth:card.clientWidth,scrollWidth:card.scrollWidth,scrollHeight:card.scrollHeight,clientHeight:card.clientHeight}:null,children:card?selectors.flatMap(s=>[...card.querySelectorAll(s)].map(rect)):[],audio:rect(document.querySelector('#sound')),inSession:document.body.classList.contains('in-round'),mode:frame.dataset.mode};
  });
  const {viewport,frame,card}=metrics;
  assert.ok(metrics.scroll.width<=viewport.width+1,`${state}: document is wider than viewport`);
  if(metrics.inSession&&(viewport.width<=650||viewport.height<=550)) {
    assert.ok(frame.x>=-1&&frame.right<=viewport.width+1&&frame.y>=-1&&frame.bottom<=viewport.height+1,`${state}: harbor leaves viewport: ${JSON.stringify(frame)}`);
    assert.ok(metrics.scroll.height<=viewport.height+1,`${state}: session causes vertical page scroll`);
    assert.ok(metrics.audio.width>=44 && metrics.audio.height>=44,`${state}: mute touch target too small`);
    assert.ok(metrics.audio.y>=0 && metrics.audio.bottom<=viewport.height,`${state}: mute is unavailable`);
  }
  assert.ok(Math.abs(metrics.canvas.width-metrics.playfield.width)<2 && Math.abs(metrics.canvas.height-metrics.playfield.height)<2,`${state}: canvas and playfield sizes disagree`);
  if(metrics.dock) {
    assert.ok(metrics.canvas.bottom<=metrics.dock.y+1,`${state}: status dock covers playable water`);
    assert.ok(metrics.dock.bottom<=frame.bottom+1,`${state}: status dock leaves harbor`);
  }
  if(card){
    assert.ok(card.x>=frame.x&&card.right<=frame.right&&card.y>=frame.y&&card.bottom<=frame.bottom,`${state}: modal is clipped by harbor`);
    assert.ok(card.scrollWidth<=card.clientWidth+1,`${state}: modal content has horizontal overflow`);
    for(const child of metrics.children)assert.ok(child.x>=card.x-1&&child.right<=card.right+1,`${state}: result content leaves modal`);
  }
  record(state,metrics);
}
try{
 await page.goto(url);await page.waitForFunction(()=>!document.querySelector('#play').disabled);
 await fit('360x800 welcome');await page.screenshot({path:`folder/welcome.png`.replace('folder',folder)});
 // Start after scrolling any overflow on the welcome screen; Play must reset it.
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await page.locator('#play').tap();await page.waitForTimeout(350);
 await fit('360x800 playing');assert.equal(await page.evaluate(()=>scrollY),0);
 const cdp=await context.newCDPSession(page);
 let touching=false;
 async function release(){if(touching){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});touching=false;}}
 async function steer(dx,dy){await release();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:90,y:500}]});touching=true;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:90+dx,y:500+dy}]});}
 await steer(56,-15);await page.waitForTimeout(1300);await release();
 assert.ok(Number((await page.locator('#score').innerText()).replaceAll(',',''))>0,'Touch steering did not collect');
 await page.locator('#pause').tap();await fit('360x800 paused');const timer=await page.locator('#timer').innerText();
 // Model address-bar expansion and collapse by changing the available height.
 await page.setViewportSize({width:360,height:660});await page.waitForTimeout(150);await fit('360x660 browser chrome expanded');
 assert.equal(await page.locator('#timer').innerText(),timer);
 await page.setViewportSize({width:800,height:360});await page.waitForTimeout(150);await fit('800x360 paused landscape');
 await page.setViewportSize({width:360,height:800});await page.locator('#resume').tap();
 let seconds=0;const directions=[[56,0],[0,-56],[-56,0],[0,56]];
 while(await page.locator('#game-frame').getAttribute('data-mode')!=='finished'){
   if(seconds%8===0)await steer(...directions[Math.floor(seconds/8)%4]);
   if(seconds%15===0)record('Real mobile round',{seconds,timer:await page.locator('#timer').innerText(),score:await page.locator('#score').innerText()});
   await page.waitForTimeout(1000);if(++seconds>110)throw Error('Real 90-second round did not finish');
 }
 await release();await fit('360x800 finished');assert.equal(await page.locator('.intro').isVisible(),false);
 await page.screenshot({path:`${folder}/result-360x800.png`});
 for(const [width,height] of [[320,568],[390,844],[430,932],[640,800],[568,320],[800,360],[844,390],[768,1024],[1024,768],[1440,900]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(200);await fit(`${width}x${height} finished`);
   await page.locator('#again').scrollIntoViewIfNeeded();const button=await page.locator('#again').boundingBox();assert.ok(button.x>=0&&button.x+button.width<=width&&button.y>=0&&button.y+button.height<=height,`Replay unavailable at ${width}x${height}`);
   if([320,390,800,568,1440].includes(width))await page.screenshot({path:`${folder}/result-${width}x${height}.png`});
 }
 await page.setViewportSize({width:360,height:800});await page.waitForTimeout(150);
 // Presentation-only stress case; gameplay state and clock are never changed.
 await page.locator('#final-score').evaluate(el=>el.textContent='999,999,999');await fit('360x800 long-score presentation');
 await page.locator('#again').tap();await page.waitForTimeout(100);await fit('360x800 restarted');assert.match(await page.locator('#timer').innerText(),/^1:(29|30)$/);
 await page.locator('#pause').tap();await page.screenshot({path:`${folder}/pause-360x800.png`});
 assert.deepEqual(errors,[]);record('Console errors',errors);
 await fs.writeFile(`${folder}/results.json`,JSON.stringify({date:new Date().toISOString(),url,results,errors},null,2));
}finally{await browser.close();}
