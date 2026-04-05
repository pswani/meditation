import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './app/AppShell';
import { SyncStatusProvider } from './features/sync/SyncStatusProvider';
import { TimerProvider } from './features/timer/TimerContext';

const ActiveTimerPage = lazy(() => import('./pages/ActiveTimerPage'));
const CustomPlayRunPage = lazy(() => import('./pages/CustomPlayRunPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const PlaylistsPage = lazy(() => import('./pages/PlaylistsPage'));
const PlaylistRunPage = lazy(() => import('./pages/PlaylistRunPage'));
const PracticePage = lazy(() => import('./pages/PracticePage'));
const SankalpaPage = lazy(() => import('./pages/SankalpaPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function RouteLoadingFallback() {
  return (
    <div aria-live="polite" className="page-shell page-shell--loading" role="status">
      Loading page...
    </div>
  );
}

function withRouteSuspense(node: ReactNode) {
  return <Suspense fallback={<RouteLoadingFallback />}>{node}</Suspense>;
}

export default function App() {
  return (
    <SyncStatusProvider>
      <TimerProvider>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={withRouteSuspense(<HomePage />)} />
            <Route path="practice" element={withRouteSuspense(<PracticePage />)} />
            <Route path="practice/active" element={withRouteSuspense(<ActiveTimerPage />)} />
            <Route path="practice/custom-plays/active" element={withRouteSuspense(<CustomPlayRunPage />)} />
            <Route path="practice/playlists" element={withRouteSuspense(<PlaylistsPage />)} />
            <Route path="practice/playlists/active" element={withRouteSuspense(<PlaylistRunPage />)} />
            <Route path="history" element={withRouteSuspense(<HistoryPage />)} />
            <Route path="goals" element={withRouteSuspense(<SankalpaPage />)} />
            <Route path="sankalpa" element={<Navigate to="/goals" replace />} />
            <Route path="settings" element={withRouteSuspense(<SettingsPage />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </TimerProvider>
    </SyncStatusProvider>
  );
}
