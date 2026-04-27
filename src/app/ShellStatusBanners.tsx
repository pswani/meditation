import { useEffect } from 'react';
import type { ActiveCustomPlayRun } from '../types/customPlay';
import type { ActivePlaylistRun } from '../types/playlist';
import type { ActiveSession } from '../types/timer';

interface ShellStatusBannersProps {
  readonly activeSession: ActiveSession | null;
  readonly activeCustomPlayRun: ActiveCustomPlayRun | null;
  readonly activePlaylistRun: ActivePlaylistRun | null;
  readonly recoveryMessage: string | null;
  readonly clearRecoveryMessage: () => void;
  readonly syncStatusMessage: string | null;
  readonly connectionMode: 'offline' | 'backend-unreachable' | 'online';
  readonly failedCount: number;
  readonly deadLetterCount: number;
  readonly onDiscardDeadLetterEntries: () => void;
  readonly storageFull: boolean;
  readonly onDismissStorageFull: () => void;
  readonly showActiveTimerBanner: boolean;
  readonly showActiveCustomPlayBanner: boolean;
  readonly showActivePlaylistBanner: boolean;
  readonly onOpenActiveTimer: () => void;
  readonly onOpenActiveCustomPlay: () => void;
  readonly onOpenActivePlaylist: () => void;
}

export function ShellStatusBanners({
  activeSession,
  activeCustomPlayRun,
  activePlaylistRun,
  recoveryMessage,
  clearRecoveryMessage,
  syncStatusMessage,
  connectionMode,
  failedCount,
  deadLetterCount,
  onDiscardDeadLetterEntries,
  storageFull,
  onDismissStorageFull,
  showActiveTimerBanner,
  showActiveCustomPlayBanner,
  showActivePlaylistBanner,
  onOpenActiveTimer,
  onOpenActiveCustomPlay,
  onOpenActivePlaylist,
}: ShellStatusBannersProps) {
  useEffect(() => {
    if (!recoveryMessage) return;
    const timerId = setTimeout(clearRecoveryMessage, 5000);
    return () => clearTimeout(timerId);
  }, [recoveryMessage, clearRecoveryMessage]);

  return (
    <>
      {activeSession && showActiveTimerBanner ? (
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
          <button type="button" className="secondary shell-active-action" onClick={onOpenActiveTimer}>
            {activeSession.isPaused ? 'Resume Paused Timer' : 'Resume Active Timer'}
          </button>
        </div>
      ) : null}
      {!activeSession && activeCustomPlayRun && showActiveCustomPlayBanner ? (
        <div className="shell-active-banner" role="status" aria-live="polite">
          <p>{activeCustomPlayRun.isPaused ? 'Paused custom play' : 'Active custom play'}: {activeCustomPlayRun.customPlayName}</p>
          <button type="button" className="secondary shell-active-action" onClick={onOpenActiveCustomPlay}>
            {activeCustomPlayRun.isPaused ? 'Resume Custom Play' : 'Open Custom Play'}
          </button>
        </div>
      ) : null}
      {!activeSession && !activeCustomPlayRun && activePlaylistRun && showActivePlaylistBanner ? (
        <div className="shell-active-banner" role="status" aria-live="polite">
          <p>
            Active playlist run: {activePlaylistRun.playlistName} · item {activePlaylistRun.currentIndex + 1}/
            {activePlaylistRun.items.length}
          </p>
          <button type="button" className="secondary shell-active-action" onClick={onOpenActivePlaylist}>
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
      {deadLetterCount > 0 ? (
        <div className="status-banner warn" role="alert" aria-live="assertive">
          <p>Some changes could not sync after several retries. Check your connection and reload to try again.</p>
          <button type="button" className="link-button" onClick={onDiscardDeadLetterEntries}>
            Discard
          </button>
        </div>
      ) : null}
      {storageFull ? (
        <div className="status-banner warn" role="alert" aria-live="assertive">
          <p>Device storage is full. Some data may not be saved. Free up space or clear old session history.</p>
          <button type="button" className="link-button" onClick={onDismissStorageFull}>
            Dismiss
          </button>
        </div>
      ) : null}
    </>
  );
}
