import type { CapacitorConfig } from '@capacitor/cli';

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.sanomed.healthrecords',
  appName: 'Sanomed',
  webDir: 'out',
  android: {
    allowMixedContent: true,
  },
  server: {
    androidScheme: 'https',
    cleartext: true,
    ...(serverUrl ? { url: serverUrl } : {}),
  }
};

export default config;
