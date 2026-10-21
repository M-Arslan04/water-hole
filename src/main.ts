import { bootGame } from './bootstrap';
import { BrowserPlatform } from './platform';
bootGame(new BrowserPlatform(), { playLabel: 'Play' });

// Optional website telemetry must never hold up the game or enter shared/platform boot code.
if (import.meta.env.WATER_HOLE_WEB_ANALYTICS) {
  void import('./web-analytics').then(({ initWebAnalytics }) => initWebAnalytics()).catch(() => {});
}
