import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// In sandboxed environments, HMR is disabled (DISABLE_HMR=true) by platform proxy architecture.
// Prevent benign websocket closure unhandled rejections from triggering error overlays in the iframe.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = event?.reason?.message || String(event?.reason || '');
    if (
      reasonStr.includes('WebSocket') ||
      reasonStr.includes('websocket') ||
      reasonStr.includes('closed without opened')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const errorStr = event?.message || String(event?.error || '');
    if (
      errorStr.includes('WebSocket') ||
      errorStr.includes('websocket') ||
      errorStr.includes('closed without opened')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

