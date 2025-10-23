import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { setupIonicReact } from '@ionic/react';
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/float-elements.css';
import { AuthProvider } from './context/AuthContext';
import { initializeTouchFix } from './utils/touchFix';

setupIonicReact({
  mode: 'md', // Force Material Design mode for consistency
  rippleEffect: false, // Disable ripple effect which can interfere with touch
});

// Initialize touch fix for Android WebView
initializeTouchFix();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Log device info for debugging
console.log('User Agent:', navigator.userAgent);
console.log('Platform:', navigator.platform);
console.log('Touch support:', 'ontouchstart' in window);

// Register service worker for PWA with auto-updates
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    console.log('[App] New version detected, updating...');
    // Auto-reload when update is available
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  },
  onSuccess: (registration) => {
    console.log('[App] Service worker registered successfully');
  }
});

// Check for updates every time the app loads
serviceWorkerRegistration.checkForUpdates().then((hasUpdate) => {
  if (hasUpdate) {
    console.log('[App] New version available, reloading...');
    // Clear cache and reload
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
});
