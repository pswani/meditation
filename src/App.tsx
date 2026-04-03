import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './app/AppShell';
import { SyncStatusProvider } from './features/sync/SyncStatusProvider';
import { TimerProvider } from './features/timer/TimerContext';
import ActiveTimerPage from './pages/ActiveTimerPage';
import CustomPlayRunPage from './pages/CustomPlayRunPage';
import HistoryPage from './pages/HistoryPage';
import HomePage from './pages/HomePage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistRunPage from './pages/PlaylistRunPage';
import PracticePage from './pages/PracticePage';
import SankalpaPage from './pages/SankalpaPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <SyncStatusProvider>
      <TimerProvider>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="practice" element={<PracticePage />} />
            <Route path="practice/active" element={<ActiveTimerPage />} />
            <Route path="practice/custom-plays/active" element={<CustomPlayRunPage />} />
            <Route path="practice/playlists" element={<PlaylistsPage />} />
            <Route path="practice/playlists/active" element={<PlaylistRunPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="goals" element={<SankalpaPage />} />
            <Route path="sankalpa" element={<Navigate to="/goals" replace />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </TimerProvider>
    </SyncStatusProvider>
  );
}
