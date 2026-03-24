import { useMemo, useState } from 'react';
import { meditationTypes, soundOptions, defaultTimerSettings } from '../features/timer/constants';
import { useTimer } from '../features/timer/useTimer';
import type { TimerSettings } from '../types/timer';
import { getIntervalBellCount, validateTimerSettings } from '../utils/timerValidation';

export default function SettingsPage() {
  const { settings, setSettings } = useTimer();
  const [draft, setDraft] = useState<TimerSettings>(settings);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<ReturnType<typeof validateTimerSettings>['errors']>({});

  const intervalCount = useMemo(
    () => (draft.intervalEnabled ? getIntervalBellCount(draft.durationMinutes, draft.intervalMinutes) : 0),
    [draft.durationMinutes, draft.intervalEnabled, draft.intervalMinutes]
  );

  function update<K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) {
    setSaveMessage(null);
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function saveDefaults() {
    const validation = validateTimerSettings(draft);
    setErrors(validation.errors);

    if (!validation.isValid) {
      setSaveMessage(null);
      return;
    }

    setSettings(draft);
    setSaveMessage('Settings saved.');
  }

  function resetDefaults() {
    const resetValue: TimerSettings = {
      ...defaultTimerSettings,
    };
    setDraft(resetValue);
    setSettings(resetValue);
    setErrors({});
    setSaveMessage('Settings reset to app defaults.');
  }

  return (
    <section className="page-card settings-screen">
      <h2 className="page-title">Settings</h2>
      <p className="page-description">Adjust default timer preferences for a steady, low-friction practice flow.</p>

      {saveMessage ? (
        <div className="status-banner ok" role="status">
          <p>{saveMessage}</p>
        </div>
      ) : null}

      <section className="settings-panel">
        <h3 className="section-title">Default Timer Preferences</h3>
        <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
          <label>
            <span>Default duration (minutes)</span>
            <input
              type="number"
              min={1}
              value={draft.durationMinutes}
              onChange={(event) => update('durationMinutes', Number(event.target.value))}
            />
            {errors.durationMinutes ? (
              <small className="error-text">{errors.durationMinutes}</small>
            ) : (
              <small className="hint-text">Used when opening timer setup.</small>
            )}
          </label>

          <label>
            <span>Default meditation type</span>
            <select
              value={draft.meditationType}
              onChange={(event) => update('meditationType', event.target.value as TimerSettings['meditationType'])}
            >
              <option value="">Select meditation type</option>
              {meditationTypes.map((meditationType) => (
                <option key={meditationType} value={meditationType}>
                  {meditationType}
                </option>
              ))}
            </select>
            {errors.meditationType ? <small className="error-text">{errors.meditationType}</small> : null}
          </label>

          <label>
            <span>Default start sound</span>
            <select value={draft.startSound} onChange={(event) => update('startSound', event.target.value)}>
              {soundOptions.map((sound) => (
                <option key={sound} value={sound}>
                  {sound}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Default end sound</span>
            <select value={draft.endSound} onChange={(event) => update('endSound', event.target.value)}>
              {soundOptions.map((sound) => (
                <option key={sound} value={sound}>
                  {sound}
                </option>
              ))}
            </select>
          </label>

          <label className="checkbox-row settings-checkbox">
            <input
              type="checkbox"
              checked={draft.intervalEnabled}
              onChange={(event) => update('intervalEnabled', event.target.checked)}
            />
            <span>Enable interval bell by default</span>
          </label>

          {draft.intervalEnabled ? (
            <>
              <label>
                <span>Default interval (minutes)</span>
                <input
                  type="number"
                  min={1}
                  value={draft.intervalMinutes}
                  onChange={(event) => update('intervalMinutes', Number(event.target.value))}
                />
                {errors.intervalMinutes ? (
                  <small className="error-text">{errors.intervalMinutes}</small>
                ) : (
                  <small className="hint-text">
                    {intervalCount} interval bell{intervalCount === 1 ? '' : 's'} within the default session.
                  </small>
                )}
              </label>

              <label>
                <span>Default interval sound</span>
                <select value={draft.intervalSound} onChange={(event) => update('intervalSound', event.target.value)}>
                  {soundOptions.map((sound) => (
                    <option key={sound} value={sound}>
                      {sound}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
        </form>

        <div className="timer-actions">
          <button type="button" onClick={saveDefaults}>
            Save Defaults
          </button>
          <button type="button" className="secondary" onClick={resetDefaults}>
            Reset To App Defaults
          </button>
        </div>
      </section>
    </section>
  );
}
