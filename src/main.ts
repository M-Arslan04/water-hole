import { bootGame } from './bootstrap';
import { BrowserPlatform } from './platform';
bootGame(new BrowserPlatform(), { playLabel: 'Play' });
