// Exercises the already installed debug APK; never builds, syncs, or installs it.
// Run with ANDROID_SERIAL set to the disposable emulator created for this test.
import { _android as android } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const serial = process.env.ANDROID_SERIAL;
assert.ok(serial?.startsWith('emulator-'), 'Select a test emulator with ANDROID_SERIAL');
const device = (await android.devices()).find(d => d.serial() === serial);
assert.ok(device, `Emulator ${serial} is not connected`);
const pkg = 'com.example.waterhole';
const out = 'tests/artifacts/android-device';
await fs.mkdir(out, { recursive: true });
const checks = [], errors = [];
let page;
const shell = command => device.shell(command);
const record = label => { checks.push(label); console.log(`PASS: ${label}`); };
const attach = async () => {
  page = await (await device.webView({ pkg })).page();
  page.on('pageerror', error => errors.push(error.message));
  await page.locator('#play:not([disabled])').waitFor({ timeout: 30000 });
};
const mode = name => page.waitForFunction(name => document.querySelector('#game-frame')?.dataset.mode === name, name);
const timer = () => page.locator('#timer').textContent();
const playerMarker = () => page.locator('#minimap').evaluate(canvas => {
  const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  let x = 0, y = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === 255 && data[i+1] === 227 && data[i+2] === 160 && data[i+3] === 255) {
      x += (i/4) % canvas.width; y += Math.floor(i/4/canvas.width); count++;
    }
  }
  return { x: x/count, y: y/count, count };
});
const screenshot = name => device.screenshot({ path: `${out}/${name}.png` });
const bounds = async () => {
  const sizes = await page.evaluate(() => {
    const dock = document.querySelector('#game-status');
    return { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
      dockTop: dock && !dock.hidden ? dock.getBoundingClientRect().top : null,
      canvasBottom: document.querySelector('#game canvas').getBoundingClientRect().bottom };
  });
  assert.ok(sizes.scrollWidth <= sizes.width + 1, JSON.stringify(sizes));
  if (sizes.dockTop !== null) assert.ok(sizes.canvasBottom <= sizes.dockTop + 1, `Dock overlaps water: ${JSON.stringify(sizes)}`);
  return sizes;
};
try {
  await shell(`am force-stop ${pkg}`);
  await shell(`am start -n ${pkg}/.MainActivity`);
  await attach();
  assert.equal(await page.evaluate(() => Capacitor.getPlatform()), 'android');
  assert.equal(await page.evaluate(() => typeof window.__waterHole), 'undefined');
  await bounds();
  await screenshot('welcome');
  record('Existing production game bundle launches inside the Android WebView');

  const welcomeBounds = await page.locator('#welcome-best').boundingBox();
  assert.ok(welcomeBounds.y + welcomeBounds.height <= await page.evaluate(() => innerHeight), 'Personal best fits the phone welcome screen');
  assert.equal(await page.locator('.field-guide').isVisible(), false);
  await page.locator('#welcome-help').click();
  assert.match(await page.locator('#primary-controls').textContent(), /Drag to steer/);
  assert.equal(await page.locator('#alternative-controls').isVisible(), false);
  await screenshot('touch-help');
  await shell('input keyevent KEYCODE_BACK');
  await page.locator('#how-to-play').waitFor({ state: 'hidden' });
  await mode('welcome');
  record('Compact welcome fits; touch-first help opens and Android Back closes it');

  await page.locator('#settings').click();
  await page.locator('#contrast-setting').check();
  await page.locator('#motion-setting').selectOption('reduce');
  await page.getByText('Open-source licenses', { exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#platform-settings pre')?.textContent.includes('MIT'));
  await screenshot('settings');
  await page.locator('#close-preferences').click();
  record('Native settings and bundled license notices open');
  if (await page.locator('#sound').getAttribute('aria-pressed') !== 'true') await page.locator('#sound').click();
  assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'true');

  await page.locator('#play').click();
  await mode('playing');
  const start = Date.now();
  await page.waitForFunction(() => document.querySelector('#timer').textContent !== '1:30', null, { timeout: 20000 });
  const cdp = await page.context().newCDPSession(page);
  const rect = await page.locator('#game').boundingBox();
  const x = rect.x + rect.width * .5, y = rect.y + rect.height * .5;
  const beforeDrag = await playerMarker();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 70, y }] });
  await page.waitForTimeout(1800);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const afterDrag = await playerMarker();
  assert.ok(beforeDrag.count && afterDrag.count && Math.hypot(afterDrag.x-beforeDrag.x, afterDrag.y-beforeDrag.y)>1, JSON.stringify({ beforeDrag, afterDrag }));
  const waterBounds = await bounds();
  assert.notEqual(waterBounds.dockTop, null, 'Updated APK must have the separate status dock');
  await screenshot('playing');
  record('Round starts, timer runs, and touch drag moves the player marker');
  record('Status dock occupies separate space below the canvas');

  await page.locator('#pause').click(); await mode('paused');
  const paused = await timer(); await page.waitForTimeout(1500); assert.equal(await timer(), paused);
  await page.locator('#pause-help').click();
  await page.locator('#how-to-play').waitFor();
  await shell('input keyevent KEYCODE_BACK');
  await page.locator('#how-to-play').waitFor({ state: 'hidden' });
  await mode('paused'); assert.equal(await timer(), paused);
  record('Help during a paused round closes with Android Back and preserves the timer');
  await page.locator('#resume').click(); await mode('playing');
  await shell('input keyevent KEYCODE_HOME');
  await new Promise(resolve => setTimeout(resolve, 2000));
  await shell(`am start -n ${pkg}/.MainActivity`);
  await mode('paused');
  const returned = await timer(); await page.waitForTimeout(1200); assert.equal(await timer(), returned);
  record('Pause freezes the timer; background/foreground returns to a paused round');
  await page.locator('#resume').click(); await mode('playing');
  await shell('input keyevent KEYCODE_BACK'); await mode('paused');
  await page.locator('#settings').click(); await page.locator('dialog[open]').waitFor();
  await shell('input keyevent KEYCODE_BACK'); await page.locator('dialog[open]').waitFor({ state: 'hidden' });
  await mode('paused');
  record('Android Back pauses gameplay and closes settings without resuming');

  await shell('settings put system accelerometer_rotation 0');
  await shell('settings put system user_rotation 1');
  await page.waitForFunction(() => innerWidth > innerHeight);
  await page.waitForFunction(() => document.querySelector('.shell').getBoundingClientRect().width >= innerWidth * .9);
  await page.waitForTimeout(1500); // Allow Android's rotation compositor to settle before the screenshot.
  await bounds(); await screenshot('landscape-paused');
  await mode('paused');
  await shell('settings put system user_rotation 0');
  await page.waitForFunction(() => innerHeight > innerWidth);
  await page.waitForTimeout(1500);
  await bounds();
  record('Portrait/landscape rotation retains the round and avoids horizontal overflow');
  await page.locator('#resume').click(); await mode('playing');
  // Steer through normal input for the remainder of a real 90-second round.
  for (let i = 0; i < 150 && await page.locator('#result').isHidden(); i++) {
    const key = ['d', 's', 'a', 'w'][i % 4];
    await page.keyboard.down(key); await page.waitForTimeout(2000); await page.keyboard.up(key);
  }
  await mode('finished');
  const score = await page.locator('#final-score').textContent();
  const best = await page.locator('#result-best').textContent();
  assert.ok(Number(score.replaceAll(',', '')) > 0, `No captures: ${score}`);
  await bounds(); await screenshot('result');
  record(`Complete timed round, captures, and result screen (${score} points; ${Math.round((Date.now()-start)/1000)}s wall time including pauses)`);
  await page.locator('#again').click(); await mode('playing');
  record('Replay starts a fresh round');

  await shell('svc wifi disable'); await shell('svc data disable');
  await shell(`am force-stop ${pkg}`); await shell(`am start -n ${pkg}/.MainActivity`);
  await attach();
  assert.equal(await page.locator('#welcome-best').textContent(), best);
  assert.equal(await page.locator('#sound').getAttribute('aria-pressed'), 'true');
  await page.locator('#settings').click();
  assert.equal(await page.locator('#contrast-setting').isChecked(), true);
  assert.equal(await page.locator('#motion-setting').inputValue(), 'reduce');
  await page.locator('#close-preferences').click();
  await page.locator('#play').click(); await mode('playing');
  await screenshot('offline');
  record('Offline cold start and Play work; best score and settings survive process restart');
  assert.deepEqual(errors, []);
} finally {
  await shell('svc wifi enable'); await shell('svc data enable');
  await shell('settings put system user_rotation 0');
  await fs.writeFile(`${out}/results.json`, JSON.stringify({ serial, checks, errors, limitations: ['Emulator only; not physical-device or screen-reader validation', 'Software graphics; not a hardware performance benchmark', 'Emulator audio output disabled; mute persistence tested, audible output untested', 'Ad rendering and consent depend on owner AdMob configuration'] }, null, 2));
  await device.close();
}
