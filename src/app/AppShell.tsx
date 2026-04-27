import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShellStatusBanners } from './ShellStatusBanners';
import { buildSyncStatusMessage } from './appShellHelpers';
import { useCustomPlayAudioSync, usePlaylistAudioSync } from './useShellAudioSync';
import { useSyncStatus } from '../features/sync/useSyncStatus';
import { useCustomPlay } from '../features/timer/customPlayContext';
import { usePlaylistRuntime } from '../features/timer/playlistRuntimeContext';
import { useTimerActions } from '../features/timer/timerActionsContext';
import { useTimerState } from '../features/timer/timerStateContext';
import { getPlaylistRunCurrentItem, isAudioBackedPlaylistItem } from '../utils/playlistRuntime';
import { removeDeadLetterSyncQueueEntries } from '../utils/syncQueue';
import { getActiveNavItem, primaryNavItems } from './routes';

const MAX_AUDIO_RETRIES = 3;

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: { activeSession } } = useTimerState();
  const { recoveryMessage, clearRecoveryMessage } = useTimerActions();
  const {
    activeCustomPlayRun,
    updateCustomPlayRunProgress,
    completeCustomPlayRun,
    reportCustomPlayRuntimeIssue,
  } = useCustomPlay();
  const {
    activePlaylistRun,
    isPlaylistRunPaused,
    updatePlaylistRunProgress,
    completePlaylistRunCurrentItem,
    endPlaylistRunEarly,
    reportPlaylistRuntimeIssue,
  } = usePlaylistRuntime();
  const {
    connectionMode,
    summary: { nextRetryCount, failedCount, deadLetterCount },
    updateQueue,
  } = useSyncStatus();
  const [storageFull, setStorageFull] = useState(false);

  useEffect(() => {
    function handleStorageQuotaExceeded() {
      setStorageFull(true);
    }
    window.addEventListener('meditation:storage-quota-exceeded', handleStorageQuotaExceeded);
    return () => window.removeEventListener('meditation:storage-quota-exceeded', handleStorageQuotaExceeded);
  }, []);
  const activeNavItem = getActiveNavItem(location.pathname);
  const syncStatusMessage = buildSyncStatusMessage(connectionMode, nextRetryCount, failedCount);
  const showActiveTimerBanner = location.pathname !== '/practice/active';
  const showActiveCustomPlayBanner = location.pathname !== '/practice/custom-plays/active';
  const showActivePlaylistBanner = location.pathname !== '/practice/playlists/active';
  const customPlayAudioRef = useRef<HTMLAudioElement | null>(null);
  const playlistAudioRef = useRef<HTMLAudioElement | null>(null);
  const customPlayAudioErrorCountRef = useRef(0);
  const playlistAudioErrorCountRef = useRef(0);
  const activePlaylistItem = getPlaylistRunCurrentItem(activePlaylistRun);
  const activePlaylistAudioItem =
    activePlaylistRun?.currentSegment.phase === 'item' &&
    activePlaylistItem &&
    isAudioBackedPlaylistItem(activePlaylistItem)
      ? activePlaylistItem
      : null;

  // Release audio resources on unmount (W-H9)
  useEffect(() => {
    return () => {
      const customPlayAudio = customPlayAudioRef.current;
      if (customPlayAudio) {
        customPlayAudio.pause();
        customPlayAudio.src = '';
        customPlayAudio.load();
      }
      const playlistAudio = playlistAudioRef.current;
      if (playlistAudio) {
        playlistAudio.pause();
        playlistAudio.src = '';
        playlistAudio.load();
      }
    };
  }, []);

  // Pause audio and end the run when the active playlist item is deleted mid-playback (W-M2)
  const prevPlaylistItemRef = useRef(activePlaylistItem);
  useEffect(() => {
    const prev = prevPlaylistItemRef.current;
    prevPlaylistItemRef.current = activePlaylistItem;

    if (prev !== null && activePlaylistItem === null && activePlaylistRun !== null) {
      playlistAudioRef.current?.pause();
      endPlaylistRunEarly();
    }
  }, [activePlaylistItem, activePlaylistRun, endPlaylistRunEarly]);

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
            deadLetterCount={deadLetterCount}
            onDiscardDeadLetterEntries={() => updateQueue(removeDeadLetterSyncQueueEntries)}
            storageFull={storageFull}
            onDismissStorageFull={() => setStorageFull(false)}
            showActiveTimerBanner={showActiveTimerBanner}
            showActiveCustomPlayBanner={showActiveCustomPlayBanner}
            showActivePlaylistBanner={showActivePlaylistBanner}
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
            customPlayAudioErrorCountRef.current = 0;
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
            if (customPlayAudioErrorCountRef.current < MAX_AUDIO_RETRIES) {
              customPlayAudioErrorCountRef.current++;
              setTimeout(() => {
                const audio = customPlayAudioRef.current;
                if (audio) {
                  audio.load();
                  audio.play().catch(() => {});
                }
              }, 2000);
            } else {
              customPlayAudioErrorCountRef.current = 0;
              reportCustomPlayRuntimeIssue('The linked recording could not be loaded right now.');
            }
          }}
        />

        <audio
          ref={playlistAudioRef}
          style={{ display: 'none' }}
          onLoadedMetadata={() => {
            playlistAudioErrorCountRef.current = 0;
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
            if (playlistAudioErrorCountRef.current < MAX_AUDIO_RETRIES) {
              playlistAudioErrorCountRef.current++;
              setTimeout(() => {
                const audio = playlistAudioRef.current;
                if (audio) {
                  audio.load();
                  audio.play().catch(() => {});
                }
              }, 2000);
            } else {
              playlistAudioErrorCountRef.current = 0;
              reportPlaylistRuntimeIssue('The linked playlist recording could not be loaded right now.');
            }
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
