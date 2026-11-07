import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { config, loadRuntimeConfig } from './config';
import { applyLangToDocument, setDefaultLang } from './i18n';
import { loadContentPack } from './content/pack';
import { initScorm } from './scorm';
import { applyBranding } from './theme';

// Erst die config.json lesen (Branding ohne neuen Build), dann rendern.
loadRuntimeConfig()
  .then(loadContentPack)
  .finally(() => {
  setDefaultLang(config.language);
  applyLangToDocument();
  applyBranding();
  initScorm();
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
