import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, ENTITIES } from '../src/config';
import { BrowserPlatform } from '../src/platform';
import { isWater, moveInWater, progressFor, stageFor } from '../src/rules';
import { floatingOrigin } from '../src/steering-rules';
import { reachableArrival, shipNeeded } from '../src/spawning';
test('growth unlocks each class at its threshold, not before', () => { CONFIG.stages.forEach((s, i) => { assert.equal(stageFor(s.xp), i); if (i) assert.equal(stageFor(s.xp - 1), i - 1); }); assert.equal(stageFor(99999), 5); });
test('progress resets at milestones and caps at the final class', () => { assert.equal(progressFor(0), 0); assert.equal(progressFor(11), 0.5); assert.equal(progressFor(22), 0); assert.equal(progressFor(10000), 1); });
test('water checks reject docks, islands and world edges', () => { assert.equal(isWater(790, 620, 25), true); for (const [x,y] of [[-10,200],[1590,500],[253,795],[1348,241],[160,300],[1450,700]]) assert.equal(isWater(x,y,20),false); });
test('movement cannot tunnel through an island or exit harbor at high speed', () => { const result = moveInWater(450,795,-350,0,24); assert.ok(result.x >= 375); assert.ok(isWater(result.x,result.y,24)); const edge = moveInWater(800,600,5000,0,24); assert.ok(edge.x < 1540); });
test('larger classes are more rewarding and have reachable progression', () => { const ladder = ['driftwood','crate','rowboat','fishing','tug','cargo'] as const; for(let i=1;i<ladder.length;i++) assert.ok(ENTITIES[ladder[i]].score > ENTITIES[ladder[i-1]].score); assert.ok(Object.values(ENTITIES).reduce((sum,e)=>sum+e.xp*e.count,0) > CONFIG.stages[5].xp); });
test('storage is optional and never prevents a round', () => { const platform = new BrowserPlatform(); assert.equal(platform.loadBest(), 0); assert.doesNotThrow(() => platform.saveBest(100)); });
test('long touch drags rebase and reverse without crossing the original touch point', () => {
  for (const ratio of [1, 2]) {
    const origin = floatingOrigin({x:70*ratio,y:0},{x:290*ratio,y:0},CONFIG.movement.joystickRadius*ratio);
    assert.ok(210*ratio-origin.x<0);
    assert.deepEqual(floatingOrigin({x:0,y:0},{x:12*ratio,y:0},36*ratio),{x:0,y:0});
  }
});
test('ship deficits respect unlocks, count useful ships, and stop at a readable population', () => {
  for (let stage=0;stage<3;stage++) assert.equal(shipNeeded(stage,[]),undefined);
  assert.equal(shipNeeded(3,['bottle','cargo','tug']), 'fishing');
  assert.equal(shipNeeded(3,['fishing','fishing']),undefined);
  assert.equal(shipNeeded(4,['fishing','fishing','bottle']),'tug');
  assert.equal(shipNeeded(5,['tug','fishing','fishing']),'cargo');
  assert.equal(shipNeeded(5,['cargo','tug','fishing']),undefined);
  assert.equal(shipNeeded(5,['fishing','fishing','fishing','fishing','fishing']),undefined);
  assert.equal(shipNeeded(5,Array(90).fill('bottle')),'cargo','Debris cannot satisfy a ship deficit');
  assert.equal(shipNeeded(5,[],{cargo:7.9,tug:4.9}),'fishing','Fill useful supply during big-ship delays');
  assert.equal(shipNeeded(5,['fishing','fishing','fishing'],{cargo:7.9,tug:4.9}),undefined);
  assert.equal(shipNeeded(5,['fishing','fishing','fishing'],{cargo:8,tug:5}),'cargo');
});
test('arrival paths reject capture-range, distant and obstructed locations', () => {
  assert.equal(reachableArrival({x:790,y:620},800,640),false);
  assert.equal(reachableArrival({x:790,y:620},100,80),false);
  assert.equal(reachableArrival({x:450,y:795},80,795),false);
  assert.equal(reachableArrival({x:790,y:620},1250,400),true);
});

test('capture presentation reaches center without changing its initial position or reversing inward progress', async () => {
  const { capturePose } = await import('../src/capture-visual');
  for (const reduced of [false, true]) {
    const f = { distance: 55, angle: .7, rotation: .4, scale: .3, reduced };
    const start = capturePose(f, 0); assert.ok(Math.abs(Math.hypot(start.x, start.y) - 55) < 1e-9);
    let previous = 56;
    for (let elapsed = 0; elapsed <= .4; elapsed += .01) { const p = capturePose(f, elapsed), d = Math.hypot(p.x, p.y); assert.ok(d <= previous + 1e-9); previous = d; if (reduced) assert.equal(p.rotation, .4); }
    const end = capturePose(f, 1); assert.equal(end.done, true); assert.equal(Math.hypot(end.x, end.y), 0); assert.equal(end.alpha, 0);
  }
});
