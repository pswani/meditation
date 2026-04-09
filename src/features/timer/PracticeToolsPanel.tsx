import CustomPlayManager from '../customPlays/CustomPlayManager';
import type { ActiveCustomPlayRun } from '../../types/customPlay';
import type { ActivePlaylistRun } from '../../types/playlist';
import type { TimerSettings } from '../../types/timer';

interface PracticeToolsPanelProps {
  readonly draftSettings: TimerSettings;
  readonly toolsOpen: boolean;
  readonly practiceToolsContentId: string;
  readonly activePlaylistRun: ActivePlaylistRun | null;
  readonly activeCustomPlayRun: ActiveCustomPlayRun | null;
  readonly onToggleTools: () => void;
  readonly onApplyCustomPlay: (nextSettings: TimerSettings) => void;
  readonly onStartCustomPlay: () => void;
  readonly onOpenActivePlaylistRun: () => void;
  readonly onOpenPlaylists: () => void;
}

export function PracticeToolsPanel({
  draftSettings,
  toolsOpen,
  practiceToolsContentId,
  activePlaylistRun,
  activeCustomPlayRun,
  onToggleTools,
  onApplyCustomPlay,
  onStartCustomPlay,
  onOpenActivePlaylistRun,
  onOpenPlaylists,
}: PracticeToolsPanelProps) {
  return (
    <section className="practice-tools-panel" aria-label="Practice tools">
      <div className="practice-tools-header">
        <h3 className="section-title">Practice Tools</h3>
        <button
          type="button"
          className="secondary"
          aria-expanded={toolsOpen}
          aria-controls={practiceToolsContentId}
          onClick={onToggleTools}
        >
          {toolsOpen ? 'Hide Tools' : 'Show Tools'}
        </button>
      </div>
      <p className="section-subtitle">Keep timer setup focused. Open tools when you want to manage custom play or playlists.</p>

      {activePlaylistRun ? (
        <div className="status-banner">
          <p>
            Playlist run active: {activePlaylistRun.playlistName} · item {activePlaylistRun.currentIndex + 1}/{activePlaylistRun.items.length}
          </p>
          <button type="button" className="link-button" onClick={onOpenActivePlaylistRun}>
            Resume Playlist Run
          </button>
        </div>
      ) : null}

      {!activePlaylistRun && activeCustomPlayRun ? (
        <div className="status-banner">
          <p>Custom play active: {activeCustomPlayRun.customPlayName}</p>
          <button type="button" className="link-button" onClick={onStartCustomPlay}>
            Resume Custom Play
          </button>
        </div>
      ) : null}

      {toolsOpen ? (
        <div id={practiceToolsContentId} className="practice-tools-content">
          <CustomPlayManager
            timerSettings={draftSettings}
            onApplyCustomPlay={onApplyCustomPlay}
            onStartCustomPlay={onStartCustomPlay}
          />

          <section className="playlist-entry-panel">
            <h3 className="section-title">Playlists</h3>
            <p className="section-subtitle">Manage ordered playlist flows and run them with automatic session log tracking.</p>
            <div className="timer-actions">
              <button type="button" onClick={onOpenPlaylists}>
                Open Playlists
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
