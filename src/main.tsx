import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Prevent iOS status bar from overlaying the WebView when running via Capacitor
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

;(async () => {
  if (typeof window !== 'undefined' && Capacitor.getPlatform() === 'ios') {
    try {
      // Enable overlay mode so content goes behind status bar, then safe-area CSS handles padding
      await StatusBar.setOverlaysWebView({ overlay: true })
      // Choose dark text for light header background
      await StatusBar.setStyle({ style: Style.Dark })
    } catch (e) {
      // ignore plugin errors in non-native or unsupported contexts
    }
  }
})()

createRoot(document.getElementById("root")!).render(<App />);
