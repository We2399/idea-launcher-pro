import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bea471aa244440ca9c0c5142cd0a98fc',
  appName: 'idea-launcher-pro',
  webDir: 'dist',
  server: {
    url: 'https://id-preview--bea471aa-2444-40ca-9c0c-5142cd0a98fc.lovable.app/?forceHideBadge=true&v=2',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
