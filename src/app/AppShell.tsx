import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTimer } from '../features/timer/useTimer';
import { getActiveNavItem, primaryNavItems } from './routes';

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeSession, activePlaylistRun, recoveryMessage, clearRecoveryMessage } = useTimer();
  const activeNavItem = getActiveNavItem(location.pathname);

  return (
    <div className="app-shell">
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
                Active timer: {activeSession.meditationType} · {activeSession.remainingSeconds > 0 ? 'in session' : 'ending'}
              </p>
              <button type="button" className="secondary shell-active-action" onClick={() => navigate('/practice/active')}>
                Resume Active Timer
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
        </header>

        <main className="content">
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
