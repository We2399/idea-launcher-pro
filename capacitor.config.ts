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
  
  // ✅ LOCAL/OFFLINE MODE (PRODUCTION) - App loads from bundled 'dist' folder
  // No internet required, no "Not found" errors, always shows latest built version
  
  // Use HTTPS scheme so Supabase auth cookies/storage work correctly in the WebView
  android: {
    scheme: 'https'
  },
  
  // 🔧 DEVELOPMENT ONLY: Uncomment below for live-reload from Lovable preview
  // server: {
  //   url: 'https://bea471aa-2444-40ca-9c0c-5142cd0a98fc.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  
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
