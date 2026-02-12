import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Prevent iOS status bar from overlaying the WebView when running via Capacitor
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

// Global safety net: catch ANY unhandled promise rejection so the Android WebView
// doesn't crash and close the app. This is critical for Capacitor mobile apps.
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection caught (app kept alive):', event.reason);
  event.preventDefault(); // Prevent the WebView from crashing
});

// Also catch uncaught errors globally
window.addEventListener('error', (event) => {
  console.warn('Uncaught error caught (app kept alive):', event.error);
  event.preventDefault();
});

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
