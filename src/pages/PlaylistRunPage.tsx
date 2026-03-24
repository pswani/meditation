import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRemainingTime } from '../features/timer/time';
import { useTimer } from '../features/timer/useTimer';
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

  const currentItem = activePlaylistRun.items[activePlaylistRun.currentIndex];

  return (
    <section className="page-card playlist-run-screen">
      <p className="eyebrow">Playlist Run</p>
      <h2 className="page-title">{activePlaylistRun.playlistName}</h2>
      <p className={`session-state ${isPlaylistRunPaused ? 'paused' : ''}`}>{isPlaylistRunPaused ? 'Paused' : 'Running'}</p>
      <p className="section-subtitle">
        Item {activePlaylistRun.currentIndex + 1} of {activePlaylistRun.items.length}
      </p>
      <p className="section-subtitle">Current meditation type: {currentItem.meditationType}</p>
      <h3 className="timer-clock">{formatRemainingTime(activePlaylistRun.currentItemRemainingSeconds)}</h3>

      <p className="section-subtitle">
        Completed so far: {activePlaylistRun.completedItems}/{activePlaylistRun.items.length} items ·{' '}
        {formatDurationLabel(activePlaylistRun.completedDurationSeconds)}
      </p>

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
