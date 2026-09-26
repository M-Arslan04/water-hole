import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// Real-time input only. No clock, position, XP or score mutation.
const label = process.env.RUN_LABEL || 'updated';
const mobile = process.env.MOBILE === '1';
const folder = `tests/artifacts/balance-${label}`;
await fs.mkdir(folder, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const context = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 1100 } });
const page = await context.newPage(), errors = [], samples = [], unlocks = {};
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const water = (x,y) => x >= 62 && x <= 1538 && y >= 62 && y <= 1038 && Math.hypot(x-253,y-795) >= 123 && Math.hypot(x-1348,y-241) >= 132 && ![[0,275,233,58],[1360,670,240,65],[55,0,48,160]].some(([rx,ry,w,h])=>Math.hypot(x-Math.max(rx,Math.min(rx+w,x)),y-Math.max(ry,Math.min(ry+h,y)))<24);
const clear = (p,e) => { const steps=Math.max(1,Math.ceil(Math.hypot(e.x-p.x,e.y-p.y)/10)); return Array.from({length:steps},(_,i)=>(i+1)/steps).every(t=>water(p.x+(e.x-p.x)*t,p.y+(e.y-p.y)*t)); };
// Waypoint search only chooses input directions; the scene still performs all navigation.
const nodes=[];
for(let x=80;x<=1520;x+=80)for(let y=80;y<=1040;y+=80)if(water(x,y))nodes.push({x,y});
const neighbors=nodes.map(a=>nodes.flatMap((b,i)=>Math.hypot(a.x-b.x,a.y-b.y)<=114&&a!==b&&clear(a,b)?[i]:[]));
function detour(player,targets){
  const distances=nodes.map(n=>clear(player,n)?Math.hypot(n.x-player.x,n.y-player.y):Infinity),first=nodes.map((_,i)=>i),visited=new Set();
  for(let count=0;count<nodes.length;count++){
    let at=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(at<0||distances[i]<distances[at]))at=i;
    if(at<0||!Number.isFinite(distances[at]))break;visited.add(at);
    if(targets.some(e=>clear(nodes[at],e)))return nodes[first[at]];
    for(const next of neighbors[at]){const cost=distances[at]+Math.hypot(nodes[at].x-nodes[next].x,nodes[at].y-nodes[next].y);if(cost<distances[next]){distances[next]=cost;first[next]=first[at];}}
  }
}
let keys = new Set(), touching = false;
const cdp = await context.newCDPSession(page);
try {
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5178/');
  await page.waitForFunction(()=>window.__waterHole && !document.querySelector('#play').disabled);
  await page.locator('#play').click();
  const start = Date.now(); let screenshotAt = 60;
  while (true) {
    const s = await page.evaluate(()=>window.__waterHole.snapshot());
    if (s.mode === 'finished') {
      const late = samples.filter(s=>s.time<=30), median = a=>a.sort((a,b)=>a-b)[Math.floor(a.length/2)];
      const summary = { label, mobile, score:s.score, captures:s.captured, unlocks, seconds:(Date.now()-start)/1000, scoreAt60Remaining:samples.find(s=>s.time<=60)?.score, scoreAt30Remaining:late[0]?.score,
        lateValuableMin:Math.min(...late.map(s=>s.valuable)), lateValuableMedian:median(late.map(s=>s.valuable)), lateCargoMin:Math.min(...late.map(s=>s.cargo)), lateZeroSamples:late.filter(s=>s.valuable===0).length, lateSamples:late.length, maxObjects:Math.max(...samples.map(s=>s.objects)), medianFps:median(samples.map(s=>s.fps)), errors };
      await page.screenshot({path:`${folder}/result.png`});
      await fs.writeFile(`${folder}/results.json`,JSON.stringify({summary,samples,spawnEvents:s.spawning?.events},null,2));
      console.log(JSON.stringify(summary,null,2)); assert.deepEqual(errors,[]); assert.ok(s.score>0); assert.ok(summary.seconds>=89);
      assert.ok(s.score > late[0].score, 'Driver must keep catching targets in the last 30s');
      for(const [i,event] of (s.spawning?.events||[]).entries()) {
        assert.ok(event.objects<=100&&event.valuable<=5,'Arrival exceeds population limits');
        assert.ok(event.distance>=500&&event.distance<=950,'Arrival is not within safe pursuit distance');
        if(event.kind==='cargo')assert.ok(event.wait>=8,'Cargo bypassed its replenishment delay');
        if(event.kind==='tug')assert.ok(event.wait>=5,'Tug bypassed its replenishment delay');
        if(i)assert.ok(event.time-s.spawning.events[i-1].time>=1.99,'Arrivals formed a burst');
      }
      if(process.env.EXPECT_SUPPLY==='1') { assert.ok(unlocks[6]<=40,'Efficient player must exercise max stage by 40s'); assert.ok(summary.lateZeroSamples / late.length < .15,'Too much late-round empty water'); }
      break;
    }
    assert.equal(s.mode,'playing'); unlocks[s.stage+1] ??= 90-s.time;
    samples.push({time:s.time,score:s.score,stage:s.stage+1,objects:s.entities.length,valuable:s.entities.filter(e=>e.tier>=3&&e.tier<=s.stage).length,cargo:s.entities.filter(e=>e.kind==='cargo'&&e.tier<=s.stage).length,reachable:s.entities.filter(e=>e.tier>=3&&e.tier<=s.stage&&clear(s.player,e)).length,fps:s.fps,player:s.player,ships:s.entities.filter(e=>e.tier>=3).map(e=>({id:e.id,kind:e.kind,x:e.x,y:e.y})),spawning:s.spawning?{...s.spawning,events:undefined}:undefined});
    if(s.time<=screenshotAt){ console.log('progress',label,s.time,s.score,s.stage+1,samples.at(-1).valuable); await page.screenshot({path:`${folder}/${s.time}-seconds-left.png`}); screenshotAt-=15; }
    const eligible=s.entities.filter(e=>e.tier<=s.stage), valuable=eligible.filter(e=>e.tier>=3);
    const pool=s.stage===5&&valuable.length?valuable:eligible;
    const candidates=pool.filter(e=>clear(s.player,e));
    const direct=candidates.sort((a,b)=>Math.hypot(a.x-s.player.x,a.y-s.player.y)/(1+a.tier*.18)-Math.hypot(b.x-s.player.x,b.y-s.player.y)/(1+b.tier*.18))[0];
    const target=direct || detour(s.player,pool);
    const dx=target?target.x-s.player.x:200,dy=target?target.y-s.player.y:0,d=Math.hypot(dx,dy),moving=d>(direct?s.player.radius*.8:12);
    if(mobile){
      if(touching)await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      touching=false;
      if(moving){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:145,y:540}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:145+dx/d*58,y:540+dy/d*58}]});touching=true;}
    } else {
      const wanted=new Set(); if(moving){if(Math.abs(dx)>18)wanted.add(dx>0?'d':'a');if(Math.abs(dy)>18)wanted.add(dy>0?'s':'w');}
      for(const k of keys)if(!wanted.has(k))await page.keyboard.up(k);for(const k of wanted)if(!keys.has(k))await page.keyboard.down(k);keys=wanted;
    }
    if(Date.now()-start>115000)throw Error('Round timed out');
    await page.waitForTimeout(220);
  }
} finally { await browser.close(); }
