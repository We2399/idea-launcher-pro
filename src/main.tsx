import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Prevent iOS status bar from overlaying the WebView when running via Capacitor
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

// Global safety net: catch ANY unhandled promise rejection so the Android WebView
// doesn't crash and close the app. This is critical for Capacitor mobile apps.
window.addEventListener('unhandledrejection', (event) => {
  console.warn('[GLOBAL] Unhandled promise rejection caught (app kept alive):', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.warn('[GLOBAL] Uncaught error caught (app kept alive):', event.error);
  event.preventDefault();
});

console.log('[BOOT] App starting, platform:', Capacitor.getPlatform());

;(async () => {
  if (typeof window !== 'undefined' && Capacitor.getPlatform() === 'ios') {
    try {
      await StatusBar.setOverlaysWebView({ overlay: true })
      await StatusBar.setStyle({ style: Style.Dark })
    } catch (e) {
      // ignore plugin errors in non-native or unsupported contexts
    }
  }
})()

createRoot(document.getElementById("root")!).render(<App />);
