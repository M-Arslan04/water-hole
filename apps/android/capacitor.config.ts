import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.example.waterhole', appName: 'Water Hole', webDir: 'dist',
  // No server.url: the installed application always loads bundled assets.
  android: { backgroundColor: '#132f39' },
};
export default config;
