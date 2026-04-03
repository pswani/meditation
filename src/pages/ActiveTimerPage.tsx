import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRemainingTime, getActiveSessionClockSeconds } from '../features/timer/time';
import { useTimer } from '../features/timer/useTimer';

export default function ActiveTimerPage() {
  const {
    activeSession,
    isPaused,
    pauseSession,
    resumeSession,
    endSessionEarly,
    lastOutcome,
    clearOutcome,
    timerSoundPlaybackMessage,
    clearTimerSoundPlaybackMessage,
    isSessionLogSyncing,
    sessionLogSyncError,
  } = useTimer();
  const navigate = useNavigate();
  const [showEndEarlyConfirm, setShowEndEarlyConfirm] = useState(false);
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!activeSession) {
      setShowEndEarlyConfirm(false);
    }
  }, [activeSession]);

  useEffect(() => {
    setClockNowMs(Date.now());

    if (!activeSession || isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setClockNowMs(Date.now());
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeSession, isPaused]);

  if (!activeSession) {
    if (lastOutcome) {
      const completionTitle = lastOutcome.status === 'completed' ? 'Session Completed' : 'Session Ended Early';

      return (
        <section className="page-card active-timer">
          <h2 className="page-title">{completionTitle}</h2>
          <p className="page-description">
            You completed {formatRemainingTime(lastOutcome.completedDurationSeconds)}.
          </p>
          {isSessionLogSyncing ? (
            <div className="status-banner" role="status">
              <p>Saving the latest auto log to the backend history.</p>
            </div>
          ) : null}
          {sessionLogSyncError ? (
            <div className="status-banner warn" role="status">
              <p>{sessionLogSyncError}</p>
            </div>
          ) : (
            <div className="status-banner ok" role="status">
              <p>An auto log was added to history.</p>
            </div>
          )}
          {timerSoundPlaybackMessage ? (
            <div className="status-banner warn" role="status">
              <p>{timerSoundPlaybackMessage}</p>
              <button type="button" className="link-button" onClick={clearTimerSoundPlaybackMessage}>
                Dismiss
              </button>
            </div>
          ) : null}
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

  const timerClockSeconds = getActiveSessionClockSeconds(activeSession, clockNowMs);
  const isOpenEndedSession = activeSession.timerMode === 'open-ended';
  const timerClockLabel = isOpenEndedSession ? 'Elapsed' : 'Remaining';
  const endActionLabel = isOpenEndedSession ? 'End Session' : 'End Early';
  const confirmationLabel = isOpenEndedSession ? 'End session confirmation' : 'End session early confirmation';

  return (
    <section className="page-card active-timer">
      <p className="eyebrow">{activeSession.meditationType}</p>
      <p className={`session-state ${isPaused ? 'paused' : ''}`}>{isPaused ? 'Paused' : 'In Session'}</p>
      <p className="timer-clock-label">{timerClockLabel}</p>
      <h2 className="timer-clock">{formatRemainingTime(timerClockSeconds)}</h2>
      <p className="page-description">
        {isOpenEndedSession
          ? 'Stay present. Pause or resume anytime, then end the session whenever it feels complete.'
          : 'Stay present. Pause or resume anytime, or end early if needed.'}
      </p>
      {!isOpenEndedSession ? (
        <div className="status-banner" role="status">
          <p>
            On iPhone Safari, if the phone is locked, the completion bell may play when you return to Safari.
          </p>
        </div>
      ) : null}

      {timerSoundPlaybackMessage ? (
        <div className="status-banner warn" role="status">
          <p>{timerSoundPlaybackMessage}</p>
          <button type="button" className="link-button" onClick={clearTimerSoundPlaybackMessage}>
            Dismiss
          </button>
        </div>
      ) : null}

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
          {endActionLabel}
        </button>
      </div>

      {showEndEarlyConfirm ? (
        <div className="confirm-sheet" role="dialog" aria-label={confirmationLabel}>
          <p>
            {isOpenEndedSession
              ? 'End this session now and create an auto log with the elapsed duration?'
              : 'End this session now and create an auto log with status ended early?'}
          </p>
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
              {endActionLabel}
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
