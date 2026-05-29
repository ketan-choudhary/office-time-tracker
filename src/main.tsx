import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { initDatabase } from './db';
import './index.css';

async function bootstrap() {
  await initDatabase();

  const updateSW = registerSW({
    onNeedRefresh() {
      if (confirm('A new version is available. Reload to update?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.info('Office Time Tracker is ready for offline use.');
    },
  });

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
