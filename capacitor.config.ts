import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bea471aa244440ca9c0c5142cd0a98fc',
  appName: 'Jie Jie HR Hub',
  webDir: 'dist',
  
  // ============================================================
  // CAPACITOR MODE: LOCAL/OFFLINE MODE (ACTIVE)
  // ============================================================
  
  // ✅ CURRENT MODE: Local/Offline
  // - App runs from bundled 'dist' folder assets
  // - Works completely offline, no network required
  // - No "Waiting to reconnect" messages
  // - Fast and reliable for production & testing
  
  // Live reload enabled for development - loads from Lovable preview
  server: {
    url: 'https://bea471aa-2444-40ca-9c0c-5142cd0a98fc.lovableproject.com?forceHideBadge=true&v=3',
    cleartext: true
  },
  
  // To switch to local/offline mode (for production):
  // Comment out the server block above
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#5BBFBA',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;
