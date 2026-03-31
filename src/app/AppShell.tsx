import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSyncStatus } from '../features/sync/useSyncStatus';
import { useTimer } from '../features/timer/useTimer';
import { getActiveNavItem, primaryNavItems } from './routes';

function buildSyncStatusMessage(isOnline: boolean, pendingCount: number, failedCount: number): string | null {
  if (!isOnline) {
    if (pendingCount > 0) {
      return `${pendingCount} change${pendingCount === 1 ? '' : 's'} will stay on this device and sync when the backend is reachable again.`;
    }

    return 'You are offline. Saved data already on this device remains available.';
  }

  if (failedCount > 0) {
    return `${failedCount} change${failedCount === 1 ? '' : 's'} still need another sync attempt.`;
  }

  if (pendingCount > 0) {
    return `${pendingCount} change${pendingCount === 1 ? '' : 's'} waiting to sync with the backend.`;
  }

  return null;
}

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeSession, activePlaylistRun, recoveryMessage, clearRecoveryMessage } = useTimer();
  const {
    isOnline,
    summary: { nextRetryCount, failedCount },
  } = useSyncStatus();
  const activeNavItem = getActiveNavItem(location.pathname);
  const syncStatusMessage = buildSyncStatusMessage(isOnline, nextRetryCount, failedCount);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <aside className="app-sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <div className="brand-title">Meditation App</div>
            <div className="brand-subtitle">Calm daily practice</div>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main destinations">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <p className="eyebrow">{activeNavItem.eyebrow}</p>
          <h1 className="topbar-title">{activeNavItem.title}</h1>
          {activeSession ? (
            <div className="shell-active-banner" role="status" aria-live="polite">
              <p>
                {activeSession.isPaused ? 'Paused timer' : 'Active timer'}: {activeSession.meditationType} ·{' '}
                {activeSession.isPaused
                  ? activeSession.timerMode === 'open-ended'
                    ? 'paused open-ended session'
                    : 'paused fixed session'
                  : activeSession.timerMode === 'open-ended'
                  ? 'open-ended session'
                  : 'in session'}
              </p>
              <button type="button" className="secondary shell-active-action" onClick={() => navigate('/practice/active')}>
                {activeSession.isPaused ? 'Resume Paused Timer' : 'Resume Active Timer'}
              </button>
            </div>
          ) : null}
          {!activeSession && activePlaylistRun ? (
            <div className="shell-active-banner" role="status" aria-live="polite">
              <p>
                Active playlist run: {activePlaylistRun.playlistName} · item {activePlaylistRun.currentIndex + 1}/
                {activePlaylistRun.items.length}
              </p>
              <button
                type="button"
                className="secondary shell-active-action"
                onClick={() => navigate('/practice/playlists/active')}
              >
                Resume Playlist Run
              </button>
            </div>
          ) : null}
          {recoveryMessage ? (
            <div className="status-banner warn" role="status" aria-live="polite">
              <p>{recoveryMessage}</p>
              <button type="button" className="link-button" onClick={clearRecoveryMessage}>
                Dismiss
              </button>
            </div>
          ) : null}
          {syncStatusMessage ? (
            <div className={`status-banner ${!isOnline || failedCount > 0 ? 'warn' : ''}`} role="status" aria-live="polite">
              <p>{syncStatusMessage}</p>
            </div>
          ) : null}
        </header>

        <main id="main-content" className="content" tabIndex={-1}>
          <Outlet />
        </main>

        <nav className="bottom-nav" aria-label="Bottom navigation">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `bottom-link ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
