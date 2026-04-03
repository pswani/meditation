import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRemainingTime } from '../features/timer/time';
import { useTimer } from '../features/timer/useTimer';
import {
  computePlaylistRunRemainingSeconds,
  getPlaylistRunCurrentItem,
  getPlaylistRunUpcomingItem,
  isAudioBackedPlaylistItem,
} from '../utils/playlistRuntime';
import { formatDurationLabel } from '../utils/sessionLog';

export default function PlaylistRunPage() {
  const {
    activePlaylistRun,
    isPlaylistRunPaused,
    pausePlaylistRun,
    resumePlaylistRun,
    endPlaylistRunEarly,
    playlistRunOutcome,
    clearPlaylistRunOutcome,
    playlistRuntimeMessage,
    clearPlaylistRuntimeMessage,
  } = useTimer();
  const navigate = useNavigate();
  const [showEndEarlyConfirm, setShowEndEarlyConfirm] = useState(false);

  useEffect(() => {
    if (!activePlaylistRun) {
      setShowEndEarlyConfirm(false);
    }
  }, [activePlaylistRun]);

  if (!activePlaylistRun) {
    if (playlistRunOutcome) {
      const heading = playlistRunOutcome.status === 'completed' ? 'Playlist Completed' : 'Playlist Ended Early';

      return (
        <section className="page-card playlist-run-screen">
          <h2 className="page-title">{heading}</h2>
          <p className="page-description">
            {playlistRunOutcome.playlistName} · {playlistRunOutcome.completedItems}/{playlistRunOutcome.totalItems} items logged.
          </p>
          <p className="section-subtitle">
            Total completed duration: {formatDurationLabel(playlistRunOutcome.completedDurationSeconds)}
          </p>
          <div className="timer-actions">
            <button
              type="button"
              onClick={() => {
                clearPlaylistRunOutcome();
                navigate('/practice/playlists');
              }}
            >
              Back To Playlists
            </button>
            <button type="button" className="secondary" onClick={() => navigate('/history')}>
              View History
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="page-card playlist-run-screen">
        <h2 className="page-title">Playlist Run</h2>
        <p className="page-description">No active playlist run right now.</p>
        <button type="button" onClick={() => navigate('/practice/playlists')}>
          Go To Playlists
        </button>
      </section>
    );
  }

  const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
  const upcomingItem = getPlaylistRunUpcomingItem(activePlaylistRun);
  const remainingPhaseSeconds = activePlaylistRun.currentSegment.remainingSeconds;
  const remainingRunSeconds = computePlaylistRunRemainingSeconds(activePlaylistRun);
  const inGapPhase = activePlaylistRun.currentSegment.phase === 'gap';
  const currentItemIsRecording = currentItem ? isAudioBackedPlaylistItem(currentItem) : false;

  return (
    <section className="page-card playlist-run-screen">
      <p className="eyebrow">Playlist Run</p>
      <h2 className="page-title">{activePlaylistRun.playlistName}</h2>
      <p className={`session-state ${isPlaylistRunPaused ? 'paused' : ''}`}>{isPlaylistRunPaused ? 'Paused' : inGapPhase ? 'Gap' : 'Running'}</p>
      <p className="section-subtitle">
        {inGapPhase ? 'Settling gap before the next item' : `Item ${activePlaylistRun.currentIndex + 1} of ${activePlaylistRun.items.length}`}
      </p>
      {currentItem ? (
        <p className="section-subtitle">
          {inGapPhase ? 'Next item' : 'Current item'}: {currentItem.title}
          {currentItemIsRecording ? ' · linked recording' : ''}
        </p>
      ) : null}
      {currentItem && !inGapPhase ? (
        <p className="section-subtitle">Current meditation type: {currentItem.meditationType}</p>
      ) : null}
      {upcomingItem ? (
        <p className="section-subtitle">
          Up next: {upcomingItem.title} ({upcomingItem.durationMinutes} min)
        </p>
      ) : (
        <p className="section-subtitle">{inGapPhase ? 'Up next: Final item in this playlist run.' : 'Up next: Final item in this playlist run.'}</p>
      )}
      <h3 className="timer-clock">{formatRemainingTime(remainingPhaseSeconds)}</h3>

      <div className="home-summary-grid">
        <article className="summary-card">
          <p className="summary-label">Meditation completed</p>
          <p className="summary-value">{formatDurationLabel(activePlaylistRun.completedDurationSeconds)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Playlist remaining</p>
          <p className="summary-value">{formatRemainingTime(remainingRunSeconds)}</p>
        </article>
      </div>
      <p className="section-subtitle">
        Completed so far: {activePlaylistRun.completedItems}/{activePlaylistRun.items.length} items ·{' '}
        {formatDurationLabel(activePlaylistRun.completedDurationSeconds)}
      </p>

      <p className="page-description">
        {inGapPhase
          ? 'Stay settled. The next item will begin automatically after the short gap.'
          : currentItemIsRecording
          ? 'The linked recording continues here while playlist progress stays in sync.'
          : 'Stay present. This timed item will move to the next segment automatically.'}
      </p>

      {playlistRuntimeMessage ? (
        <div className="status-banner warn" role="status">
          <p>{playlistRuntimeMessage}</p>
          <button type="button" className="link-button" onClick={clearPlaylistRuntimeMessage}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="timer-actions">
        {isPlaylistRunPaused ? (
          <button type="button" onClick={resumePlaylistRun}>
            Resume
          </button>
        ) : (
          <button type="button" onClick={pausePlaylistRun}>
            Pause
          </button>
        )}

        <button type="button" className="secondary" onClick={() => setShowEndEarlyConfirm(true)}>
          End Early
        </button>
      </div>

      {showEndEarlyConfirm ? (
        <div className="confirm-sheet" role="dialog" aria-label="End playlist early confirmation">
          <p>End this playlist run now and create session log entries for completed progress?</p>
          <div className="timer-actions">
            <button type="button" className="secondary" onClick={() => setShowEndEarlyConfirm(false)}>
              Continue Run
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEndEarlyConfirm(false);
                endPlaylistRunEarly();
              }}
            >
              End Early
            </button>
          </div>
        </div>
      ) : null}

      <button type="button" className="link-button" onClick={() => navigate('/history')}>
        View History
      </button>
    </section>
  );
}
