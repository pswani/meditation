import { useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShellStatusBanners } from './ShellStatusBanners';
import { buildSyncStatusMessage } from './appShellHelpers';
import { useCustomPlayAudioSync, usePlaylistAudioSync } from './useShellAudioSync';
import { useSyncStatus } from '../features/sync/useSyncStatus';
import { useTimer } from '../features/timer/useTimer';
import { getPlaylistRunCurrentItem, isAudioBackedPlaylistItem } from '../utils/playlistRuntime';
import { getActiveNavItem, primaryNavItems } from './routes';

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    activeSession,
    activeCustomPlayRun,
    activePlaylistRun,
    isPlaylistRunPaused,
    recoveryMessage,
    clearRecoveryMessage,
    updateCustomPlayRunProgress,
    completeCustomPlayRun,
    reportCustomPlayRuntimeIssue,
    updatePlaylistRunProgress,
    completePlaylistRunCurrentItem,
    reportPlaylistRuntimeIssue,
  } = useTimer();
  const {
    connectionMode,
    summary: { nextRetryCount, failedCount },
  } = useSyncStatus();
  const activeNavItem = getActiveNavItem(location.pathname);
  const syncStatusMessage = buildSyncStatusMessage(connectionMode, nextRetryCount, failedCount);
  const customPlayAudioRef = useRef<HTMLAudioElement | null>(null);
  const playlistAudioRef = useRef<HTMLAudioElement | null>(null);
  const activePlaylistItem = getPlaylistRunCurrentItem(activePlaylistRun);
  const activePlaylistAudioItem =
    activePlaylistRun?.currentSegment.phase === 'item' &&
    activePlaylistItem &&
    isAudioBackedPlaylistItem(activePlaylistItem)
      ? activePlaylistItem
      : null;

  useCustomPlayAudioSync({
    audioRef: customPlayAudioRef,
    activeCustomPlayRun,
    reportCustomPlayRuntimeIssue,
  });

  usePlaylistAudioSync({
    audioRef: playlistAudioRef,
    activePlaylistRun,
    activePlaylistAudioItem,
    isPlaylistRunPaused,
    reportPlaylistRuntimeIssue,
  });

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
          <ShellStatusBanners
            activeSession={activeSession}
            activeCustomPlayRun={activeCustomPlayRun}
            activePlaylistRun={activePlaylistRun}
            recoveryMessage={recoveryMessage}
            clearRecoveryMessage={clearRecoveryMessage}
            syncStatusMessage={syncStatusMessage}
            connectionMode={connectionMode}
            failedCount={failedCount}
            onOpenActiveTimer={() => navigate('/practice/active')}
            onOpenActiveCustomPlay={() => navigate('/practice/custom-plays/active')}
            onOpenActivePlaylist={() => navigate('/practice/playlists/active')}
          />
        </header>

        <main id="main-content" className="content" tabIndex={-1}>
          <Outlet />
        </main>

        <audio
          ref={customPlayAudioRef}
          style={{ display: 'none' }}
          onLoadedMetadata={() => {
            const audio = customPlayAudioRef.current;
            if (!audio || !activeCustomPlayRun) {
              return;
            }

            if (Math.abs(audio.currentTime - activeCustomPlayRun.currentPositionSeconds) > 1) {
              try {
                audio.currentTime = activeCustomPlayRun.currentPositionSeconds;
              } catch {
                // Ignore seek failures; playback can continue from the current loaded position.
              }
            }
          }}
          onTimeUpdate={() => {
            const audio = customPlayAudioRef.current;
            if (!audio) {
              return;
            }

            updateCustomPlayRunProgress(audio.currentTime);
          }}
          onEnded={() => {
            const audio = customPlayAudioRef.current;
            completeCustomPlayRun(audio?.duration || audio?.currentTime || activeCustomPlayRun?.durationSeconds || 0);
          }}
          onError={() => {
            reportCustomPlayRuntimeIssue('The linked recording could not be loaded from its media path.');
          }}
        />

        <audio
          ref={playlistAudioRef}
          style={{ display: 'none' }}
          onLoadedMetadata={() => {
            const audio = playlistAudioRef.current;
            if (!audio || !activePlaylistRun || activePlaylistRun.currentSegment.phase !== 'item') {
              return;
            }

            if (Math.abs(audio.currentTime - activePlaylistRun.currentSegment.elapsedSeconds) > 1) {
              try {
                audio.currentTime = activePlaylistRun.currentSegment.elapsedSeconds;
              } catch {
                // Ignore seek failures; playback can continue from the current loaded position.
              }
            }
          }}
          onTimeUpdate={() => {
            const audio = playlistAudioRef.current;
            if (!audio) {
              return;
            }

            updatePlaylistRunProgress(audio.currentTime);
          }}
          onEnded={() => {
            const audio = playlistAudioRef.current;
            completePlaylistRunCurrentItem(audio?.duration || audio?.currentTime || 0);
          }}
          onError={() => {
            reportPlaylistRuntimeIssue('The linked playlist recording could not be loaded from its media path.');
          }}
        />

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
