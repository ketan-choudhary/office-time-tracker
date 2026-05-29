import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { InstallPrompt } from '@/components/InstallPrompt';
import { Layout } from '@/components/Layout';
import { Analytics } from '@/pages/Analytics';
import { Dashboard } from '@/pages/Dashboard';
import { DailyEntry } from '@/pages/DailyEntry';
import { ExportPage } from '@/pages/Export';
import { History } from '@/pages/History';
import { SettingsPage } from '@/pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <InstallPrompt />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="entry" element={<DailyEntry />} />
          <Route path="history" element={<History />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="export" element={<ExportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
