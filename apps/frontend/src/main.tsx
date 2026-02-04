import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Capacitor } from '@capacitor/core';
import App from './App';
import './styles/globals.css';

// Register service worker for offline support (web only, not on native apps)
if ('serviceWorker' in navigator && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registered:', registration.scope);
      })
      .catch((error) => {
        console.warn('[SW] Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--casha-surface)',
            border: '1px solid var(--casha-border)',
            color: 'var(--casha-text-primary)',
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>
);
