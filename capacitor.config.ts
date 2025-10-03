import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bea471aa244440ca9c0c5142cd0a98fc',
  appName: 'idea-launcher-pro',
  webDir: 'dist',
  // server: {
  //   url: 'https://bea471aa-2444-40ca-9c0c-5142cd0a98fc.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
