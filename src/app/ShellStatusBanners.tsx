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
  onOpenActiveTimer,
  onOpenActiveCustomPlay,
  onOpenActivePlaylist,
}: ShellStatusBannersProps) {
  return (
    <>
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
          <button type="button" className="secondary shell-active-action" onClick={onOpenActiveTimer}>
            {activeSession.isPaused ? 'Resume Paused Timer' : 'Resume Active Timer'}
          </button>
        </div>
      ) : null}
      {!activeSession && activeCustomPlayRun ? (
        <div className="shell-active-banner" role="status" aria-live="polite">
          <p>{activeCustomPlayRun.isPaused ? 'Paused custom play' : 'Active custom play'}: {activeCustomPlayRun.customPlayName}</p>
          <button type="button" className="secondary shell-active-action" onClick={onOpenActiveCustomPlay}>
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
    </>
  );
}
