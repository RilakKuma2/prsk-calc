import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import './theme.css';
import reportWebVitals from './reportWebVitals';
import { installStaleAssetRecovery } from './utils/staleAssetRecovery';

installStaleAssetRecovery();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// Register Service Worker for PWA cache and Push
if ('serviceWorker' in navigator) {
  // The versioned URL prevents a browser/CDN-cached sw.js from masking a new
  // Pages deployment. The Worker uses the same value for its own precache.
  const serviceWorkerBuildId = process.env.REACT_APP_BUILD_ID || 'development';
  const swUrl = `${process.env.PUBLIC_URL}/sw.js?v=${serviceWorkerBuildId}`;

  navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' })
    .then(registration => {
      console.log('SW registered: ', registration);

      const activateWaitingWorker = () => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      };

      activateWaitingWorker();
      registration.update();
      registration.addEventListener('updatefound', () => {
        const nextWorker = registration.installing;
        if (!nextWorker) return;
        nextWorker.addEventListener('statechange', () => {
          if (nextWorker.state === 'installed' && navigator.serviceWorker.controller) {
            nextWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    })
    .catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
}

reportWebVitals();
