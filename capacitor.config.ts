import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.bea471aa244440ca9c0c5142cd0a98fc',
  appName: 'idea-launcher-pro',
  webDir: 'dist',
  
  // ============================================================
  // CAPACITOR MODE CONFIGURATION
  // ============================================================
  
  // LOCAL MODE (Default - For Testing & Production)
  // - Uses bundled assets from 'dist' folder
  // - Works offline, no network dependency
  // - Fast and reliable for emulator/device testing
  // - CURRENT MODE: The server block below is commented out
  
  // DEVELOPMENT MODE (For Live Reload from Lovable)
  // - Loads app directly from Lovable sandbox URL
  // - Changes in Lovable appear instantly on device/emulator
  // - Requires internet connection
  // - TO ENABLE: Uncomment the 'server' block below
  
  // Uncomment this block for live reload during development:
  /*
  server: {
    url: 'https://bea471aa-2444-40ca-9c0c-5142cd0a98fc.lovableproject.com?forceHideBadge=true&v=3',
    cleartext: true
  },
  */
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
