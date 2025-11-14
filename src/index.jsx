import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';
import { initializeOfflineNetworkInterceptor } from './utils/offlineNetworkInterceptor';

initializeOfflineNetworkInterceptor();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Service Worker only in production; aggressively unregister in development to avoid HMR reload loops
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    } else {
      // Development: unregister any existing SW and clear caches to prevent stale assets and reload loops
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
      });
      if (window.caches && window.caches.keys) {
        caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
      }
    }
  });
}