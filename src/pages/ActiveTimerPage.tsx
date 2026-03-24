import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRemainingTime } from '../features/timer/time';
import { useTimer } from '../features/timer/useTimer';

export default function ActiveTimerPage() {
  const { activeSession, isPaused, pauseSession, resumeSession, endSessionEarly, lastOutcome, clearOutcome } = useTimer();
  const navigate = useNavigate();
  const [showEndEarlyConfirm, setShowEndEarlyConfirm] = useState(false);

  useEffect(() => {
    if (!activeSession) {
      setShowEndEarlyConfirm(false);
    }
  }, [activeSession]);

  if (!activeSession) {
    if (lastOutcome) {
      const completionTitle = lastOutcome.status === 'completed' ? 'Session Completed' : 'Session Ended Early';

      return (
        <section className="page-card active-timer">
          <h2 className="page-title">{completionTitle}</h2>
          <p className="page-description">
            You completed {Math.max(1, Math.round(lastOutcome.completedDurationSeconds / 60))} min. An auto log was added to history.
          </p>
          <div className="timer-actions">
            <button
              type="button"
              onClick={() => {
                clearOutcome();
                navigate('/practice');
              }}
            >
              Start Another Session
            </button>
            <button type="button" className="secondary" onClick={() => navigate('/history')}>
              View History
            </button>
          </div>
        </section>
      );
    }

    return (
      <section className="page-card active-timer">
        <h2 className="page-title">Active Timer</h2>
        <p className="page-description">No active session right now.</p>
        <button type="button" onClick={() => navigate('/practice')}>
          Go To Timer Setup
        </button>
      </section>
    );
  }

  return (
    <section className="page-card active-timer">
      <p className="eyebrow">{activeSession.meditationType}</p>
      <p className={`session-state ${isPaused ? 'paused' : ''}`}>{isPaused ? 'Paused' : 'In Session'}</p>
      <h2 className="timer-clock">{formatRemainingTime(activeSession.remainingSeconds)}</h2>
      <p className="page-description">Stay present. Pause or resume anytime, or end early if needed.</p>

      <div className="timer-actions">
        {isPaused ? (
          <button type="button" onClick={resumeSession}>
            Resume
          </button>
        ) : (
          <button type="button" onClick={pauseSession}>
            Pause
          </button>
        )}
        <button type="button" className="secondary" onClick={() => setShowEndEarlyConfirm(true)}>
          End Early
        </button>
      </div>

      {showEndEarlyConfirm ? (
        <div className="confirm-sheet" role="dialog" aria-label="End session early confirmation">
          <p>End this session now and create an auto log with status ended early?</p>
          <div className="timer-actions">
            <button type="button" className="secondary" onClick={() => setShowEndEarlyConfirm(false)}>
              Continue Session
            </button>
            <button
              type="button"
              onClick={() => {
                setShowEndEarlyConfirm(false);
                endSessionEarly();
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
