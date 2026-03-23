import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meditationTypes, soundOptions } from '../features/timer/constants';
import { useTimer } from '../features/timer/useTimer';
import type { MeditationType, TimerSettings } from '../types/timer';
import { getIntervalBellCount } from '../utils/timerValidation';

type SetupField = 'durationMinutes' | 'meditationType' | 'intervalMinutes';

export default function PracticePage() {
  const { settings, validation, activeSession, setSettings, startSession, clearOutcome, lastOutcome } = useTimer();
  const navigate = useNavigate();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [startAttempted, setStartAttempted] = useState(false);
  const [touched, setTouched] = useState<Record<SetupField, boolean>>({
    durationMinutes: false,
    meditationType: false,
    intervalMinutes: false,
  });

  const intervalCount = useMemo(
    () => (settings.intervalEnabled ? getIntervalBellCount(settings.durationMinutes, settings.intervalMinutes) : 0),
    [settings.durationMinutes, settings.intervalEnabled, settings.intervalMinutes]
  );

  const visibleErrors = useMemo(
    () => ({
      durationMinutes: (startAttempted || touched.durationMinutes) ? validation.errors.durationMinutes : undefined,
      meditationType: (startAttempted || touched.meditationType) ? validation.errors.meditationType : undefined,
      intervalMinutes:
        settings.intervalEnabled && (startAttempted || touched.intervalMinutes) ? validation.errors.intervalMinutes : undefined,
    }),
    [settings.intervalEnabled, startAttempted, touched, validation.errors]
  );

  useEffect(() => {
    if (visibleErrors.intervalMinutes) {
      setAdvancedOpen(true);
    }
  }, [visibleErrors.intervalMinutes]);

  function update<K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) {
    setSettings({
      ...settings,
      [key]: value,
    });
  }

  function markTouched(field: SetupField) {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function onStart() {
    setStartAttempted(true);
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
            Last session {lastOutcome.status}. An auto log was created for{' '}
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
            onBlur={() => markTouched('durationMinutes')}
          />
          {visibleErrors.durationMinutes ? (
            <small className="error-text">{visibleErrors.durationMinutes}</small>
          ) : (
            <small className="hint-text">Choose total session duration.</small>
          )}
        </label>

        <label>
          <span>Meditation type</span>
          <select
            value={settings.meditationType}
            onChange={(event) => update('meditationType', event.target.value as MeditationType | '')}
            onBlur={() => markTouched('meditationType')}
          >
            <option value="">Select meditation type</option>
            {meditationTypes.map((meditationType) => (
              <option key={meditationType} value={meditationType}>
                {meditationType}
              </option>
            ))}
          </select>
          {visibleErrors.meditationType ? (
            <small className="error-text">{visibleErrors.meditationType}</small>
          ) : (
            <small className="hint-text">Select meditation type before starting.</small>
          )}
        </label>
      </div>

      <section className="advanced-panel" aria-label="Advanced timer settings">
        <button
          type="button"
          className="advanced-toggle"
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((current) => !current)}
        >
          {advancedOpen ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </button>

        {advancedOpen ? (
          <div className="advanced-content">
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
                <div className="form-grid">
                  <label>
                    <span>Interval bell every (minutes)</span>
                    <input
                      type="number"
                      min={1}
                      value={settings.intervalMinutes}
                      onChange={(event) => update('intervalMinutes', Number(event.target.value))}
                      onBlur={() => markTouched('intervalMinutes')}
                    />
                    {visibleErrors.intervalMinutes ? (
                      <small className="error-text">{visibleErrors.intervalMinutes}</small>
                    ) : (
                      <small className="hint-text">
                        {intervalCount} interval bell{intervalCount === 1 ? '' : 's'} will occur before session end.
                      </small>
                    )}
                  </label>

                  <label>
                    <span>Interval sound</span>
                    <select value={settings.intervalSound} onChange={(event) => update('intervalSound', event.target.value)}>
                      {soundOptions.map((sound) => (
                        <option key={sound} value={sound}>
                          {sound}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <div className="timer-actions">
        <button type="button" onClick={onStart}>
          Start Session
        </button>
      </div>
    </section>
  );
}
