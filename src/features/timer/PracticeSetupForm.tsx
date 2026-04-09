import { meditationTypes, soundOptions } from './constants';
import type { TimerMode, TimerSettings } from '../../types/timer';

interface PracticeSetupFormProps {
  readonly draftSettings: TimerSettings;
  readonly fixedDurationMinutes: number;
  readonly visibleErrors: {
    readonly durationMinutes?: string;
    readonly meditationType?: string;
    readonly intervalMinutes?: string;
  };
  readonly intervalCount: number;
  readonly advancedOpen: boolean;
  readonly advancedContentId: string;
  readonly areTimerSettingsControlsDisabled: boolean;
  readonly onSelectTimerMode: (timerMode: TimerMode) => void;
  readonly onUpdateDurationMinutes: (value: number) => void;
  readonly onUpdate: <K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) => void;
  readonly onMarkTouched: (field: 'durationMinutes' | 'meditationType' | 'intervalMinutes') => void;
  readonly onToggleAdvanced: () => void;
}

export function PracticeSetupForm({
  draftSettings,
  fixedDurationMinutes,
  visibleErrors,
  intervalCount,
  advancedOpen,
  advancedContentId,
  areTimerSettingsControlsDisabled,
  onSelectTimerMode,
  onUpdateDurationMinutes,
  onUpdate,
  onMarkTouched,
  onToggleAdvanced,
}: PracticeSetupFormProps) {
  const durationMessageId = visibleErrors.durationMinutes ? 'practice-duration-error' : 'practice-duration-hint';
  const meditationTypeMessageId = visibleErrors.meditationType ? 'practice-meditation-type-error' : 'practice-meditation-type-hint';
  const intervalMessageId = visibleErrors.intervalMinutes ? 'practice-interval-error' : 'practice-interval-hint';

  return (
    <>
      <section className="timer-mode-panel" aria-label="Timer mode">
        <label className={`timer-mode-option ${draftSettings.timerMode === 'fixed' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="timer-mode"
            checked={draftSettings.timerMode === 'fixed'}
            disabled={areTimerSettingsControlsDisabled}
            onChange={() => onSelectTimerMode('fixed')}
          />
          <span className="timer-mode-copy">
            <strong>Fixed Duration</strong>
            <small>Choose a total time and let the timer complete on its own.</small>
          </span>
        </label>

        <label className={`timer-mode-option ${draftSettings.timerMode === 'open-ended' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="timer-mode"
            checked={draftSettings.timerMode === 'open-ended'}
            disabled={areTimerSettingsControlsDisabled}
            onChange={() => onSelectTimerMode('open-ended')}
          />
          <span className="timer-mode-copy">
            <strong>Open-Ended</strong>
            <small>Start without an end time and finish manually when the session feels complete.</small>
          </span>
        </label>
      </section>

      <div className="form-grid">
        {draftSettings.timerMode === 'fixed' ? (
          <label>
            <span>Duration (minutes)</span>
            <input
              type="number"
              min={1}
              value={fixedDurationMinutes}
              disabled={areTimerSettingsControlsDisabled}
              aria-invalid={Boolean(visibleErrors.durationMinutes)}
              aria-describedby={durationMessageId}
              onChange={(event) => onUpdateDurationMinutes(Number(event.target.value))}
              onBlur={() => onMarkTouched('durationMinutes')}
            />
            {visibleErrors.durationMinutes ? (
              <small id={durationMessageId} className="error-text">
                {visibleErrors.durationMinutes}
              </small>
            ) : (
              <small id={durationMessageId} className="hint-text">
                Choose total session duration.
              </small>
            )}
          </label>
        ) : (
          <div className="mode-hint-card">
            <strong>Open-ended session</strong>
            <p className="section-subtitle">This timer will show elapsed time and continue until you choose End Session.</p>
          </div>
        )}

        <label>
          <span>Meditation type</span>
          <select
            value={draftSettings.meditationType}
            disabled={areTimerSettingsControlsDisabled}
            aria-invalid={Boolean(visibleErrors.meditationType)}
            aria-describedby={meditationTypeMessageId}
            onChange={(event) => onUpdate('meditationType', event.target.value as TimerSettings['meditationType'])}
            onBlur={() => onMarkTouched('meditationType')}
          >
            <option value="">Select meditation type</option>
            {meditationTypes.map((meditationType) => (
              <option key={meditationType} value={meditationType}>
                {meditationType}
              </option>
            ))}
          </select>
          {visibleErrors.meditationType ? (
            <small id={meditationTypeMessageId} className="error-text">
              {visibleErrors.meditationType}
            </small>
          ) : (
            <small id={meditationTypeMessageId} className="hint-text">
              Select meditation type before starting.
            </small>
          )}
        </label>
      </div>

      <section className="advanced-panel" aria-label="Advanced timer settings">
        <button
          type="button"
          className="advanced-toggle"
          aria-expanded={advancedOpen}
          aria-controls={advancedContentId}
          disabled={areTimerSettingsControlsDisabled}
          onClick={onToggleAdvanced}
        >
          {advancedOpen ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </button>

        {advancedOpen ? (
          <div id={advancedContentId} className="advanced-content">
            <div className="form-grid">
              <label>
                <span>Start sound (optional)</span>
                <select
                  value={draftSettings.startSound}
                  disabled={areTimerSettingsControlsDisabled}
                  onChange={(event) => onUpdate('startSound', event.target.value)}
                >
                  {soundOptions.map((sound) => (
                    <option key={sound} value={sound}>
                      {sound}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>End sound (optional)</span>
                <select
                  value={draftSettings.endSound}
                  disabled={areTimerSettingsControlsDisabled}
                  onChange={(event) => onUpdate('endSound', event.target.value)}
                >
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
                  checked={draftSettings.intervalEnabled}
                  disabled={areTimerSettingsControlsDisabled}
                  onChange={(event) => onUpdate('intervalEnabled', event.target.checked)}
                />
                <span>Enable interval bell</span>
              </label>

              {draftSettings.intervalEnabled ? (
                <div className="form-grid">
                  <label>
                    <span>Interval bell every (minutes)</span>
                    <input
                      type="number"
                      min={1}
                      value={draftSettings.intervalMinutes}
                      disabled={areTimerSettingsControlsDisabled}
                      aria-invalid={Boolean(visibleErrors.intervalMinutes)}
                      aria-describedby={intervalMessageId}
                      onChange={(event) => onUpdate('intervalMinutes', Number(event.target.value))}
                      onBlur={() => onMarkTouched('intervalMinutes')}
                    />
                    {visibleErrors.intervalMinutes ? (
                      <small id={intervalMessageId} className="error-text">
                        {visibleErrors.intervalMinutes}
                      </small>
                    ) : (
                      <small id={intervalMessageId} className="hint-text">
                        {draftSettings.timerMode === 'open-ended'
                          ? `A bell will repeat every ${draftSettings.intervalMinutes} minute${draftSettings.intervalMinutes === 1 ? '' : 's'} until you end the session.`
                          : `${intervalCount} interval bell${intervalCount === 1 ? '' : 's'} will occur before session end.`}
                      </small>
                    )}
                  </label>

                  <label>
                    <span>Interval sound</span>
                    <select
                      value={draftSettings.intervalSound}
                      disabled={areTimerSettingsControlsDisabled}
                      onChange={(event) => onUpdate('intervalSound', event.target.value)}
                    >
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
    </>
  );
}
