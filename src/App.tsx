import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './app/AppShell';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import PracticePage from './pages/PracticePage';
import SankalpaPage from './pages/SankalpaPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="goals" element={<SankalpaPage />} />
        <Route path="sankalpa" element={<Navigate to="/goals" replace />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
