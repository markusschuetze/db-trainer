import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { loadRuntimeConfig } from './config';
import { initScorm } from './scorm';
import { applyBranding } from './theme';

// Erst die config.json lesen (Branding ohne neuen Build), dann rendern.
loadRuntimeConfig().finally(() => {
  applyBranding();
  initScorm();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
