import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRemainingTime } from '../features/timer/time';
import { useCustomPlay } from '../features/timer/customPlayContext';
import { formatDurationLabel } from '../utils/sessionLog';

export default function CustomPlayRunPage() {
  const {
    activeCustomPlayRun,
    customPlayRunOutcome,
    pauseCustomPlayRun,
    resumeCustomPlayRun,
    endCustomPlayRunEarly,
    clearCustomPlayRunOutcome,
    customPlayRuntimeMessage,
    clearCustomPlayRuntimeMessage,
  } = useCustomPlay();
  const navigate = useNavigate();
  const [showEndEarlyConfirm, setShowEndEarlyConfirm] = useState(false);

  useEffect(() => {
    if (!activeCustomPlayRun) {
      setShowEndEarlyConfirm(false);
    }
  }, [activeCustomPlayRun]);

  if (!activeCustomPlayRun) {
    if (customPlayRunOutcome) {
      const heading = customPlayRunOutcome.status === 'completed' ? 'Custom Play Completed' : 'Custom Play Ended Early';

      return (
        <section className="page-card playlist-run-screen">
          <h2 className="page-title">{heading}</h2>
          <p className="page-description">{customPlayRunOutcome.customPlayName}</p>
          <p className="section-subtitle">
            Logged duration: {formatDurationLabel(customPlayRunOutcome.completedDurationSeconds)}
          </p>
          <div className="timer-actions">
            <button
              type="button"
              onClick={() => {
                clearCustomPlayRunOutcome();
                navigate('/practice');
              }}
            >
              Back To Practice
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
        <h2 className="page-title">Custom Play</h2>
        <p className="page-description">No active custom play right now.</p>
        <button type="button" onClick={() => navigate('/practice')}>
          Go To Practice
        </button>
      </section>
    );
  }

  const remainingSeconds = Math.max(0, activeCustomPlayRun.durationSeconds - activeCustomPlayRun.currentPositionSeconds);

  return (
    <section className="page-card playlist-run-screen">
      <p className="eyebrow">Custom Play</p>
      <h2 className="page-title">{activeCustomPlayRun.customPlayName}</h2>
      <p className={`session-state ${activeCustomPlayRun.isPaused ? 'paused' : ''}`}>
        {activeCustomPlayRun.isPaused ? 'Paused' : 'Playing'}
      </p>
      <p className="section-subtitle">{activeCustomPlayRun.meditationType}</p>
      <p className="section-subtitle">Recording: {activeCustomPlayRun.mediaLabel}</p>
      {activeCustomPlayRun.recordingLabel ? (
        <p className="section-subtitle">Session note: {activeCustomPlayRun.recordingLabel}</p>
      ) : null}

      <div className="home-summary-grid">
        <article className="summary-card">
          <p className="summary-label">Elapsed</p>
          <p className="summary-value">{formatRemainingTime(activeCustomPlayRun.currentPositionSeconds)}</p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Remaining</p>
          <p className="summary-value">{formatRemainingTime(remainingSeconds)}</p>
        </article>
      </div>

      <p className="page-description">
        {activeCustomPlayRun.isPaused
          ? 'Resume when you are ready to continue the recording.'
          : 'Stay present. You can pause the recording or end the session early if needed.'}
      </p>

      {customPlayRuntimeMessage ? (
        <div className="status-banner warn" role="status">
          <p>{customPlayRuntimeMessage}</p>
          <button type="button" className="link-button" onClick={clearCustomPlayRuntimeMessage}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="timer-actions">
        {activeCustomPlayRun.isPaused ? (
          <button type="button" onClick={resumeCustomPlayRun}>
            Resume
          </button>
        ) : (
          <button type="button" onClick={pauseCustomPlayRun}>
            Pause
          </button>
        )}
        <button type="button" className="secondary" onClick={() => setShowEndEarlyConfirm(true)}>
          End Early
        </button>
      </div>

      {showEndEarlyConfirm ? (
        <div className="confirm-sheet" role="dialog" aria-label="End custom play early confirmation">
          <p>End this custom play now and create an auto log for the progress completed so far?</p>
          <div className="timer-actions">
            <button type="button" className="secondary" onClick={() => setShowEndEarlyConfirm(false)}>
              Continue Custom Play
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEndEarlyConfirm(false);
                endCustomPlayRunEarly();
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
