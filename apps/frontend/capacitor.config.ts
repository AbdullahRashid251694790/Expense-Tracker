import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bigimmersive.Casha',
  appName: 'Casha',
  webDir: 'dist',
  android: {
    captureInput: true,
    useLegacyBridge: false,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#ffffff'
  },
  plugins: {
    App: {},
    Keyboard: {
      resize: 'none',
    }
  }
};

export default config;
