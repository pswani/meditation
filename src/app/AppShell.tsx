import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { precacheUrlsForOffline } from '../features/sync/offlineApp';
import { useSyncStatus } from '../features/sync/useSyncStatus';
import { useTimer } from '../features/timer/useTimer';
import { getPlaylistRunCurrentItem, isAudioBackedPlaylistItem } from '../utils/playlistRuntime';
import { getActiveNavItem, primaryNavItems } from './routes';

function buildSyncStatusMessage(
  connectionMode: 'offline' | 'backend-unreachable' | 'online',
  pendingCount: number,
  failedCount: number
): string | null {
  if (connectionMode === 'offline') {
    if (pendingCount > 0) {
      return `${pendingCount} change${pendingCount === 1 ? '' : 's'} will stay on this device and sync when the backend is reachable again.`;
    }

    return 'You are offline. Saved data already on this device remains available.';
  }

  if (connectionMode === 'backend-unreachable') {
    if (pendingCount > 0) {
      return `${pendingCount} change${pendingCount === 1 ? '' : 's'} will stay on this device until the backend is reachable again.`;
    }

    return 'The backend is unavailable right now. Saved data already on this device remains available.';
  }

  if (failedCount > 0) {
    return `${failedCount} change${failedCount === 1 ? '' : 's'} still need another sync attempt.`;
  }

  if (pendingCount > 0) {
    return `${pendingCount} change${pendingCount === 1 ? '' : 's'} waiting to sync with the backend.`;
  }

  return null;
}

function buildCustomPlayMediaMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Playback is waiting for a device interaction. Tap Resume to continue this custom play.';
  }

  if (error instanceof DOMException && error.name === 'NotSupportedError') {
    return 'The linked recording could not be loaded on this device.';
  }

  if (error instanceof Error && error.message.toLowerCase().includes('network')) {
    return 'The linked recording could not be loaded because the media file is unavailable or not cached on this device right now.';
  }

  return 'The linked recording could not continue playing right now.';
}

function buildPlaylistMediaMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Playback is waiting for a device interaction. Tap Resume to continue this playlist item.';
  }

  if (error instanceof DOMException && error.name === 'NotSupportedError') {
    return 'The linked playlist recording could not be loaded on this device.';
  }

  if (error instanceof Error && error.message.toLowerCase().includes('network')) {
    return 'The linked playlist recording could not be loaded because the media file is unavailable or not cached on this device right now.';
  }

  return 'The linked playlist recording could not continue playing right now.';
}

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

  useEffect(() => {
    const audio = customPlayAudioRef.current;
    if (!audio) {
      return;
    }

    if (!activeCustomPlayRun) {
      try {
        audio.pause();
      } catch {
        // JSDOM does not implement media playback.
      }
      if (audio.getAttribute('src')) {
        audio.removeAttribute('src');
        audio.load();
      }
      return;
    }

    if (audio.src !== new URL(activeCustomPlayRun.mediaFilePath, window.location.origin).toString()) {
      audio.src = activeCustomPlayRun.mediaFilePath;
      audio.load();
    }

    const desiredPosition = Math.max(0, Math.min(activeCustomPlayRun.durationSeconds, activeCustomPlayRun.currentPositionSeconds));
    if (Math.abs(audio.currentTime - desiredPosition) > 1) {
      try {
        audio.currentTime = desiredPosition;
      } catch {
        // Wait for metadata before seeking.
      }
    }

    if (activeCustomPlayRun.isPaused) {
      try {
        audio.pause();
      } catch {
        // JSDOM does not implement media playback.
      }
      return;
    }

    void audio
      .play()
      .then(() => {
        reportCustomPlayRuntimeIssue(null);
      })
      .catch((error) => {
        reportCustomPlayRuntimeIssue(buildCustomPlayMediaMessage(error));
      });
  }, [activeCustomPlayRun, reportCustomPlayRuntimeIssue]);

  useEffect(() => {
    if (!activeCustomPlayRun?.mediaFilePath) {
      return;
    }

    void precacheUrlsForOffline([activeCustomPlayRun.mediaFilePath]);
  }, [activeCustomPlayRun?.mediaFilePath]);

  useEffect(() => {
    const audio = playlistAudioRef.current;
    if (!audio) {
      return;
    }

    if (!activePlaylistAudioItem || !activePlaylistRun || activePlaylistRun.currentSegment.phase !== 'item') {
      try {
        audio.pause();
      } catch {
        // JSDOM does not implement media playback.
      }
      if (audio.getAttribute('src')) {
        audio.removeAttribute('src');
        audio.load();
      }
      return;
    }

    if (!activePlaylistAudioItem.mediaFilePath) {
      reportPlaylistRuntimeIssue('The linked playlist recording is missing its media path.');
      return;
    }

    if (audio.src !== new URL(activePlaylistAudioItem.mediaFilePath, window.location.origin).toString()) {
      audio.src = activePlaylistAudioItem.mediaFilePath;
      audio.load();
    }

    const desiredPosition = Math.max(0, Math.min(audio.duration || Number.MAX_SAFE_INTEGER, activePlaylistRun.currentSegment.elapsedSeconds));
    if (Math.abs(audio.currentTime - desiredPosition) > 1) {
      try {
        audio.currentTime = desiredPosition;
      } catch {
        // Wait for metadata before seeking.
      }
    }

    if (isPlaylistRunPaused) {
      try {
        audio.pause();
      } catch {
        // JSDOM does not implement media playback.
      }
      return;
    }

    void audio
      .play()
      .then(() => {
        reportPlaylistRuntimeIssue(null);
      })
      .catch((error) => {
        reportPlaylistRuntimeIssue(buildPlaylistMediaMessage(error));
      });
  }, [activePlaylistAudioItem, activePlaylistRun, isPlaylistRunPaused, reportPlaylistRuntimeIssue]);

  useEffect(() => {
    if (!activePlaylistAudioItem?.mediaFilePath) {
      return;
    }

    void precacheUrlsForOffline([activePlaylistAudioItem.mediaFilePath]);
  }, [activePlaylistAudioItem?.mediaFilePath]);

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
          {!activeSession && activeCustomPlayRun ? (
            <div className="shell-active-banner" role="status" aria-live="polite">
              <p>
                {activeCustomPlayRun.isPaused ? 'Paused custom play' : 'Active custom play'}: {activeCustomPlayRun.customPlayName}
              </p>
              <button
                type="button"
                className="secondary shell-active-action"
                onClick={() => navigate('/practice/custom-plays/active')}
              >
                {activeCustomPlayRun.isPaused ? 'Resume Custom Play' : 'Open Custom Play'}
              </button>
            </div>
          ) : null}
          {!activeSession && !activeCustomPlayRun && activePlaylistRun ? (
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
            <div className={`status-banner ${connectionMode !== 'online' || failedCount > 0 ? 'warn' : ''}`} role="status" aria-live="polite">
              <p>{syncStatusMessage}</p>
            </div>
          ) : null}
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
