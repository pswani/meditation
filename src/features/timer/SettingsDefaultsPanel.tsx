import { meditationTypes, soundOptions } from './constants';
import type { TimerMode, TimerSettings } from '../../types/timer';

interface SettingsDefaultsPanelProps {
  readonly draft: TimerSettings;
  readonly errors: Record<string, string | undefined>;
  readonly fixedDurationMinutes: number;
  readonly intervalCount: number;
  readonly hasUnsavedChanges: boolean;
  readonly areSettingsControlsDisabled: boolean;
  readonly onSelectTimerMode: (timerMode: TimerMode) => void;
  readonly onUpdateDurationMinutes: (value: number) => void;
  readonly onUpdate: <K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) => void;
  readonly onSaveDefaults: () => void;
  readonly onResetDefaults: () => void;
}

export function SettingsDefaultsPanel({
  draft,
  errors,
  fixedDurationMinutes,
  intervalCount,
  hasUnsavedChanges,
  areSettingsControlsDisabled,
  onSelectTimerMode,
  onUpdateDurationMinutes,
  onUpdate,
  onSaveDefaults,
  onResetDefaults,
}: SettingsDefaultsPanelProps) {
  const durationMessageId = errors.durationMinutes ? 'settings-duration-error' : 'settings-duration-hint';
  const meditationTypeMessageId = errors.meditationType ? 'settings-meditation-type-error' : 'settings-meditation-type-hint';
  const intervalMessageId = errors.intervalMinutes ? 'settings-interval-error' : 'settings-interval-hint';

  return (
    <section className="settings-panel">
      <h3 className="section-title">Default Timer Preferences</h3>
      <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
        <section className="timer-mode-panel" aria-label="Default timer mode">
          <label className={`timer-mode-option ${draft.timerMode === 'fixed' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="default-timer-mode"
              checked={draft.timerMode === 'fixed'}
              disabled={areSettingsControlsDisabled}
              onChange={() => onSelectTimerMode('fixed')}
            />
            <span className="timer-mode-copy">
              <strong>Fixed Duration</strong>
              <small>Keep a saved default duration ready for quick start.</small>
            </span>
          </label>

          <label className={`timer-mode-option ${draft.timerMode === 'open-ended' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="default-timer-mode"
              checked={draft.timerMode === 'open-ended'}
              disabled={areSettingsControlsDisabled}
              onChange={() => onSelectTimerMode('open-ended')}
            />
            <span className="timer-mode-copy">
              <strong>Open-Ended</strong>
              <small>Open timer setup ready to start without a planned finish time.</small>
            </span>
          </label>
        </section>

        {draft.timerMode === 'fixed' ? (
          <label>
            <span>Default duration (minutes)</span>
            <input
              type="number"
              min={1}
              value={fixedDurationMinutes}
              disabled={areSettingsControlsDisabled}
              aria-invalid={Boolean(errors.durationMinutes)}
              aria-describedby={durationMessageId}
              onChange={(event) => onUpdateDurationMinutes(Number(event.target.value))}
            />
            {errors.durationMinutes ? (
              <small id={durationMessageId} className="error-text">
                {errors.durationMinutes}
              </small>
            ) : (
              <small id={durationMessageId} className="hint-text">
                Used when opening timer setup.
              </small>
            )}
          </label>
        ) : (
          <div className="mode-hint-card">
            <strong>Open-ended default</strong>
            <p className="section-subtitle">Quick start and timer setup will open without a scheduled end time.</p>
          </div>
        )}

        <label>
          <span>Default meditation type</span>
          <select
            value={draft.meditationType}
            disabled={areSettingsControlsDisabled}
            aria-invalid={Boolean(errors.meditationType)}
            aria-describedby={meditationTypeMessageId}
            onChange={(event) => onUpdate('meditationType', event.target.value as TimerSettings['meditationType'])}
          >
            <option value="">Select meditation type</option>
            {meditationTypes.map((meditationType) => (
              <option key={meditationType} value={meditationType}>
                {meditationType}
              </option>
            ))}
          </select>
          {errors.meditationType ? (
            <small id={meditationTypeMessageId} className="error-text">
              {errors.meditationType}
            </small>
          ) : (
            <small id={meditationTypeMessageId} className="hint-text">
              Used as the default meditation type in timer setup.
            </small>
          )}
        </label>

        <label>
          <span>Default start sound</span>
          <select value={draft.startSound} disabled={areSettingsControlsDisabled} onChange={(event) => onUpdate('startSound', event.target.value)}>
            {soundOptions.map((sound) => (
              <option key={sound} value={sound}>
                {sound}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Default end sound</span>
          <select value={draft.endSound} disabled={areSettingsControlsDisabled} onChange={(event) => onUpdate('endSound', event.target.value)}>
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
            disabled={areSettingsControlsDisabled}
            onChange={(event) => onUpdate('intervalEnabled', event.target.checked)}
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
                disabled={areSettingsControlsDisabled}
                aria-invalid={Boolean(errors.intervalMinutes)}
                aria-describedby={intervalMessageId}
                onChange={(event) => onUpdate('intervalMinutes', Number(event.target.value))}
              />
              {errors.intervalMinutes ? (
                <small id={intervalMessageId} className="error-text">
                  {errors.intervalMinutes}
                </small>
              ) : (
                <small id={intervalMessageId} className="hint-text">
                  {draft.timerMode === 'open-ended'
                    ? `A bell will repeat every ${draft.intervalMinutes} minute${draft.intervalMinutes === 1 ? '' : 's'} until the session is ended.`
                    : `${intervalCount} interval bell${intervalCount === 1 ? '' : 's'} within the default session.`}
                </small>
              )}
            </label>

            <label>
              <span>Default interval sound</span>
              <select
                value={draft.intervalSound}
                disabled={areSettingsControlsDisabled}
                onChange={(event) => onUpdate('intervalSound', event.target.value)}
              >
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
        <button type="button" onClick={onSaveDefaults} disabled={!hasUnsavedChanges || areSettingsControlsDisabled}>
          Save Defaults
        </button>
        <button type="button" className="secondary" onClick={onResetDefaults} disabled={areSettingsControlsDisabled}>
          Reset To App Defaults
        </button>
      </div>
    </section>
  );
}
