import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { meditationTypes, soundOptions } from '../features/timer/constants';
import { useTimer } from '../features/timer/useTimer';
import { getIntervalBellCount } from '../utils/timerValidation';
import type { MeditationType, TimerSettings } from '../types/timer';

export default function PracticePage() {
  const { settings, validation, activeSession, setSettings, startSession, clearOutcome, lastOutcome } = useTimer();
  const navigate = useNavigate();

  const intervalCount = useMemo(
    () => (settings.intervalEnabled ? getIntervalBellCount(settings.durationMinutes, settings.intervalMinutes) : 0),
    [settings.durationMinutes, settings.intervalEnabled, settings.intervalMinutes]
  );

  function update<K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) {
    setSettings({
      ...settings,
      [key]: value,
    });
  }

  function onStart() {
    const started = startSession();
    if (started) {
      navigate('/practice/active');
    }
  }

  return (
    <section className="page-card timer-setup">
      <h2 className="page-title">Timer Setup</h2>
      <p className="page-description">Set duration and meditation type, then start a calm, focused session.</p>

      {lastOutcome ? (
        <div className={`status-banner ${lastOutcome.status === 'completed' ? 'ok' : 'warn'}`}>
          <p>
            Last session {lastOutcome.status} and created an auto log for{' '}
            {Math.max(1, Math.round(lastOutcome.completedDurationSeconds / 60))} min.
          </p>
          <button type="button" className="link-button" onClick={clearOutcome}>
            Dismiss
          </button>
        </div>
      ) : null}

      {activeSession ? (
        <div className="status-banner">
          <p>An active session is in progress.</p>
          <button type="button" className="link-button" onClick={() => navigate('/practice/active')}>
            Open Active Timer
          </button>
        </div>
      ) : null}

      <div className="form-grid">
        <label>
          <span>Duration (minutes)</span>
          <input
            type="number"
            min={1}
            value={settings.durationMinutes}
            onChange={(event) => update('durationMinutes', Number(event.target.value))}
          />
          {validation.errors.durationMinutes ? <small className="error-text">{validation.errors.durationMinutes}</small> : null}
        </label>

        <label>
          <span>Meditation type</span>
          <select
            value={settings.meditationType}
            onChange={(event) => update('meditationType', event.target.value as MeditationType | '')}
          >
            <option value="">Select meditation type</option>
            {meditationTypes.map((meditationType) => (
              <option key={meditationType} value={meditationType}>
                {meditationType}
              </option>
            ))}
          </select>
          {validation.errors.meditationType ? <small className="error-text">{validation.errors.meditationType}</small> : null}
        </label>
      </div>

      <div className="form-grid">
        <label>
          <span>Start sound (optional)</span>
          <select value={settings.startSound} onChange={(event) => update('startSound', event.target.value)}>
            {soundOptions.map((sound) => (
              <option key={sound} value={sound}>
                {sound}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>End sound (optional)</span>
          <select value={settings.endSound} onChange={(event) => update('endSound', event.target.value)}>
            {soundOptions.map((sound) => (
              <option key={sound} value={sound}>
                {sound}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="interval-panel">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={settings.intervalEnabled}
            onChange={(event) => update('intervalEnabled', event.target.checked)}
          />
          <span>Enable interval bell</span>
        </label>

        {settings.intervalEnabled ? (
          <div className="form-grid single-row">
            <label>
              <span>Interval bell every (minutes)</span>
              <input
                type="number"
                min={1}
                value={settings.intervalMinutes}
                onChange={(event) => update('intervalMinutes', Number(event.target.value))}
              />
              {validation.errors.intervalMinutes ? <small className="error-text">{validation.errors.intervalMinutes}</small> : null}
              {!validation.errors.intervalMinutes ? (
                <small className="hint-text">
                  {intervalCount} interval bell{intervalCount === 1 ? '' : 's'} will occur before session end.
                </small>
              ) : null}
            </label>
          </div>
        ) : null}
      </div>

      <div className="timer-actions">
        <button type="button" onClick={onStart}>
          Start Session
        </button>
      </div>
    </section>
  );
}
