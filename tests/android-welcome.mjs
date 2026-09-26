// Targeted visual regression on the installed emulator APK; never builds it.
import { _android } from 'playwright-core';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const serial = process.env.ANDROID_SERIAL;
assert.ok(serial?.startsWith('emulator-'));
const device = (await _android.devices()).find(d => d.serial() === serial);
assert.ok(device);
const pkg = 'com.example.waterhole';
try {
  await device.shell(`am force-stop ${pkg}`);
  await device.shell(`am start -n ${pkg}/.MainActivity`);
  const page = await (await device.webView({ pkg })).page();
  await page.locator('#play:not([disabled])').waitFor();
  const layout = await page.evaluate(() => ({
    height: innerHeight,
    bottom: document.querySelector('#game-frame').getBoundingClientRect().bottom,
    bestBottom: document.querySelector('#welcome-best').getBoundingClientRect().bottom,
  }));
  assert.ok(layout.height - layout.bottom <= 16 && layout.bottom <= layout.height, 'Harbor fills available welcome height');
  assert.ok(layout.bestBottom <= layout.height, 'Personal best remains visible');
  const alphas = await page.locator('.help-catches img').evaluateAll(async images => {
    const values = [];
    for (const image of images.slice(0, 3)) {
      await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = 220; canvas.height = 100;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, 220, 100); ctx.drawImage(image, 0, 0);
      values.push(ctx.getImageData(25, 50, 1, 1).data[3]);
    }
    return values;
  });
  assert.deepEqual(alphas, [0, 0, 0], 'Small-object icons must not contain leftover cargo artwork');
  await page.locator('#settings').click();
  await page.locator('#contrast-setting').uncheck();
  await page.locator('#motion-setting').selectOption('system');
  await page.locator('#close-preferences').click();
  if (await page.locator('#sound').getAttribute('aria-pressed') === 'true') await page.locator('#sound').click();
  await page.locator('#welcome-help').click();
  assert.match(await page.locator('#primary-controls').textContent(), /Drag to steer/);
  await page.locator('#other-controls').scrollIntoViewIfNeeded();
  await device.screenshot({ path: 'tests/artifacts/android-device/help-icons-corrected.png' });
  await page.locator('#close-help').click();
  await device.screenshot({ path: 'tests/artifacts/android-device/welcome-final.png' });
  await fs.writeFile('tests/artifacts/android-device/welcome-visual.json', JSON.stringify({serial, alphas, layout, passed:true},null,2));
  console.log('PASS: clean native guide icons, touch-first help, and default welcome ready for testing.');
} finally { await device.close(); }
