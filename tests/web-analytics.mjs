import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { build, resolveConfig } from 'vite';
import { chromium } from '@playwright/test';

const root = process.cwd(), out = path.join(root, 'tests/artifacts/web-analytics');
await fs.mkdir(out, { recursive: true });
const envKeys = ['VERCEL', 'VERCEL_ENV', 'WATER_HOLE_BUILD_TARGET', 'WATER_HOLE_DISABLE_ANALYTICS', 'NODE_ENV'];
const previous = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
const productionEnv = { VERCEL: '1', VERCEL_ENV: 'production', WATER_HOLE_BUILD_TARGET: 'vercel-web' };
const results = { builds: [], browser: [] };
try {
  for (const [name, env, enabled, mode] of [
    ['local-production', {}, false],
    ['other-target', { VERCEL: '1', VERCEL_ENV: 'production' }, false],
    ['vercel-preview', { ...productionEnv, VERCEL_ENV: 'preview' }, false],
    ['explicit-test-opt-out', { ...productionEnv, WATER_HOLE_DISABLE_ANALYTICS: '1' }, false],
    ['test-mode', productionEnv, false, 'test'],
    ['test-node-env', { ...productionEnv, NODE_ENV: 'test' }, false],
    ['vercel-production', productionEnv, true],
  ]) {
    for (const key of envKeys) delete process.env[key];
    Object.assign(process.env, env);
    const bundle = await build({ logLevel: 'error', mode: mode || 'production', build: { outDir: path.join(out, name) } });
    const modules = bundle.output.flatMap(chunk => Object.keys(chunk.modules || {}));
    assert.equal(modules.some(id => id.includes('/@vercel/analytics/')), enabled, name);
    assert.equal(modules.some(id => id.endsWith('/src/web-analytics.ts')), enabled, name);
    results.builds.push({ name, analyticsIncluded: enabled });
  }
  const dev = await resolveConfig({}, 'serve');
  assert.equal(dev.define['import.meta.env.WATER_HOLE_WEB_ANALYTICS'], 'false');
  results.builds.push({ name: 'development-with-vercel-env', analyticsIncluded: false });
} finally {
  for (const key of envKeys) previous[key] === undefined ? delete process.env[key] : process.env[key] = previous[key];
}

// Every request is intercepted. No synthetic visit can reach Vercel's collector.
const origin = 'https://water-hole.vercel.app';
const dist = path.join(out, 'vercel-production');
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };
const sdkScript = process.env.VERCEL_ANALYTICS_SCRIPT ? await fs.readFile(process.env.VERCEL_ANALYTICS_SCRIPT, 'utf8') : null;
const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
async function scenario(name, { url = origin + '/', webdriver = false, referrer, failure, localBuild = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36' });
  const requests = [], collected = [], errors = [];
  await context.addInitScript(({ webdriver }) => {
    Object.defineProperty(navigator, 'webdriver', { get: () => webdriver });
    localStorage.setItem('water-hole.best', '98765');
    localStorage.setItem('water-hole.player-name', 'PRIVATE-PLAYER-NAME');
  }, { webdriver });
  await context.route('**/*', async route => {
    const request = route.request(), u = new URL(request.url());
    requests.push({ url: request.url(), referrer: request.headers().referer });
    if (u.pathname.startsWith('/_vercel/insights/')) {
      if (u.pathname.endsWith('/script.js')) {
        if (failure === 'blocked') return route.abort('blockedbyclient');
        if (failure === 'unavailable') return route.fulfill({ status: 503, body: '' });
        // Without an official script fixture, only inspect the package's queued beforeSend hook.
        return route.fulfill({ contentType: 'text/javascript', body: sdkScript || '' });
      }
      collected.push({ path: u.pathname, data: request.postDataJSON(), referrer: request.headers().referer });
      return route.fulfill({ status: 200, body: '{}' });
    }
    if (failure === 'module' && /web-analytics-[^/]+\.js$/.test(u.pathname)) return route.abort();
    const base = localBuild ? path.join(out, 'local-production') : dist;
    const relative = u.pathname === '/' || !path.extname(u.pathname) ? 'index.html' : u.pathname.slice(1);
    const file = path.resolve(base, relative);
    if (!file.startsWith(base + path.sep)) return route.abort();
    try { return route.fulfill({ contentType: mime[path.extname(file)] || 'text/plain', body: await fs.readFile(file) }); }
    catch { return route.fulfill({ status: 404, body: '' }); }
  });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(url, referrer ? { referer: referrer } : {});
  await page.waitForFunction(() => document.querySelector('#play')?.disabled === false);
  const expected = !webdriver && new URL(url).origin === origin && !referrer?.includes('?') && !localBuild;
  if (expected && failure !== 'module') await page.waitForFunction(() => !!document.querySelector('script[src="/_vercel/insights/script.js"]'));
  if (expected && !failure) {
    if (sdkScript) await page.waitForFunction(() => !!window.vai);
    // Repeated initialization must not add another script or count a second view.
    const modules = (await fs.readdir(path.join(dist, 'assets'))).filter(n => /^web-analytics-.*\.js$/.test(n));
    await page.evaluate(async src => { const m = await import(src); await m.initWebAnalytics(); await m.initWebAnalytics(); }, '/assets/' + modules[0]);
    assert.equal(await page.locator('script[src="/_vercel/insights/script.js"]').count(), 1);
    {
      const sanitized = await page.evaluate(() => {
        const hook = window.vaq.find(([type]) => type === 'beforeSend')[1];
        return [hook({ type: 'pageview', url: location.href }), hook({ type: 'event', url: location.href }), hook({ type: 'pageview', url: 'https://water-hole.vercel.app/private/person' })];
      });
      assert.deepEqual(sanitized, [{ type: 'pageview', url: origin + '/' }, null, null]);
    }
  }
  await page.locator('#play').click();
  await page.waitForFunction(() => document.querySelector('.ocean-shell').dataset.screen === 'playing');
  await page.waitForTimeout(1100);
  await page.locator('#pause').click();
  await page.locator('#resume').click();
  assert.equal(await page.locator('.ocean-shell').getAttribute('data-screen'), 'playing');
  assert.deepEqual(errors, [], name);
  if (!expected || failure === 'module') assert.equal(requests.filter(r => r.url.includes('/_vercel/insights/')).length, 0, name);
  if (sdkScript && expected && !failure) {
    assert.equal(collected.length, 1, name + ' one page view, no gameplay event');
    assert.equal(collected[0].path, '/_vercel/insights/view');
    assert.equal(collected[0].data.o, origin + '/');
    assert.ok(!JSON.stringify(collected).match(/PRIVATE|98765|token=|utm_|#secret|userId|groupId/));
    assert.ok(collected.every(r => !r.referrer || r.referrer === origin + '/'));
  } else assert.equal(collected.length, 0);
  results.browser.push({ name, gameplayResponsive: true, scripts: requests.filter(r => r.url.endsWith('/_vercel/insights/script.js')).length, collected, errors });
  await page.screenshot({ path: path.join(out, name + '.png') });
  await context.close();
}
try {
  await scenario('sanitized-page-view', { url: origin + '/?token=PRIVATE&utm_source=PRIVATE#secret' });
  await scenario('sensitive-referrer-skipped', { referrer: 'https://example.com/?token=PRIVATE' });
  await scenario('automation-disabled', { webdriver: true });
  await scenario('localhost-disabled', { url: 'http://127.0.0.1:4186/' });
  await scenario('other-host-disabled', { url: 'https://another-platform.example/' });
  await scenario('local-build-on-public-host-disabled', { localBuild: true });
  await scenario('blocked-script', { failure: 'blocked' });
  await scenario('unavailable-script', { failure: 'unavailable' });
  await scenario('failed-optional-module', { failure: 'module' });
} finally {
  await browser.close();
  results.collector = sdkScript ? 'Official script replayed locally; POSTs intercepted, not delivered to Vercel' : 'Package hook inspected; no collector script executed';
  await fs.writeFile(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
}
console.log('PASS analytics build isolation, URL redaction, once-only initialization and non-blocking failures', results);
