import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prayercycles.app',
  appName: 'Prayer Cycles',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'Prayer Cycles',
  },
  server: {
    // Needed for local-first Dexie.js — no external server
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
};

export default config;
