import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomPlayManager from '../features/customPlays/CustomPlayManager';
import { meditationTypes, soundOptions } from '../features/timer/constants';
import { formatRemainingTime } from '../features/timer/time';
import { useTimer } from '../features/timer/useTimer';
import type { MeditationType, TimerMode, TimerSettings } from '../types/timer';
import { getIntervalBellCount } from '../utils/timerValidation';

type SetupField = 'durationMinutes' | 'meditationType' | 'intervalMinutes';

interface PracticeRouteState {
  readonly entryMessage?: string;
}

export default function PracticePage() {
  const {
    settings,
    validation,
    activeSession,
    activePlaylistRun,
    setSettings,
    startSession,
    clearOutcome,
    lastOutcome,
    isSessionLogSyncing,
    sessionLogSyncError,
    isSettingsLoading,
    settingsSyncError,
  } = useTimer();
  const navigate = useNavigate();
  const location = useLocation();
  const isTimerStartBlockedByPlaylistRun = Boolean(activePlaylistRun) || isSettingsLoading;
  const areTimerSettingsControlsDisabled = isSettingsLoading;
  const advancedContentId = 'advanced-timer-settings';
  const practiceToolsContentId = 'practice-tools-content';
  const timerStartBlockedMessageId = 'timer-start-blocked-message';
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [startAttempted, setStartAttempted] = useState(false);
  const [entryMessage, setEntryMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<SetupField, boolean>>({
    durationMinutes: false,
    meditationType: false,
    intervalMinutes: false,
  });

  const intervalCount = useMemo(
    () => (settings.intervalEnabled && settings.timerMode === 'fixed' ? getIntervalBellCount(settings.durationMinutes, settings.intervalMinutes) : 0),
    [settings.durationMinutes, settings.intervalEnabled, settings.intervalMinutes, settings.timerMode]
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
  const durationMessageId = visibleErrors.durationMinutes ? 'practice-duration-error' : 'practice-duration-hint';
  const meditationTypeMessageId = visibleErrors.meditationType ? 'practice-meditation-type-error' : 'practice-meditation-type-hint';
  const intervalMessageId = visibleErrors.intervalMinutes ? 'practice-interval-error' : 'practice-interval-hint';

  useEffect(() => {
    if (visibleErrors.intervalMinutes) {
      setAdvancedOpen(true);
    }
  }, [visibleErrors.intervalMinutes]);

  useEffect(() => {
    const state = location.state as PracticeRouteState | null;
    if (!state?.entryMessage) {
      return;
    }

    setEntryMessage(state.entryMessage);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

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

  function selectTimerMode(timerMode: TimerMode) {
    update('timerMode', timerMode);
  }

  return (
    <section className="page-card timer-setup">
      <h2 className="page-title">Timer Setup</h2>
      <p className="page-description">Choose a fixed-duration or open-ended session, then start with a calm, focused setup.</p>

      {entryMessage ? (
        <div className="status-banner warn" role="status">
          <p>{entryMessage}</p>
          <button type="button" className="link-button" onClick={() => setEntryMessage(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      {isSettingsLoading ? (
        <div className="status-banner" role="status">
          <p>Loading timer defaults from the backend before starting a session.</p>
        </div>
      ) : null}

      {settingsSyncError ? (
        <div className="status-banner warn" role="status">
          <p>{settingsSyncError}</p>
        </div>
      ) : null}

      {lastOutcome ? (
        <div className={`status-banner ${sessionLogSyncError ? 'warn' : lastOutcome.status === 'completed' ? 'ok' : 'warn'}`}>
          <p>
            Last session {lastOutcome.status}.{' '}
            {isSessionLogSyncing
              ? `Saving ${formatRemainingTime(lastOutcome.completedDurationSeconds)} to backend history.`
              : `An auto log was created for ${formatRemainingTime(lastOutcome.completedDurationSeconds)}.`}
          </p>
          {sessionLogSyncError ? <p>{sessionLogSyncError}</p> : null}
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

      <section className="timer-mode-panel" aria-label="Timer mode">
        <label className={`timer-mode-option ${settings.timerMode === 'fixed' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="timer-mode"
            checked={settings.timerMode === 'fixed'}
            disabled={areTimerSettingsControlsDisabled}
            onChange={() => selectTimerMode('fixed')}
          />
          <span className="timer-mode-copy">
            <strong>Fixed Duration</strong>
            <small>Choose a total time and let the timer complete on its own.</small>
          </span>
        </label>

        <label className={`timer-mode-option ${settings.timerMode === 'open-ended' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="timer-mode"
            checked={settings.timerMode === 'open-ended'}
            disabled={areTimerSettingsControlsDisabled}
            onChange={() => selectTimerMode('open-ended')}
          />
          <span className="timer-mode-copy">
            <strong>Open-Ended</strong>
            <small>Start without an end time and finish manually when the session feels complete.</small>
          </span>
        </label>
      </section>

      <div className="form-grid">
        {settings.timerMode === 'fixed' ? (
          <label>
            <span>Duration (minutes)</span>
            <input
              type="number"
              min={1}
              value={settings.durationMinutes}
              disabled={areTimerSettingsControlsDisabled}
              aria-invalid={Boolean(visibleErrors.durationMinutes)}
              aria-describedby={durationMessageId}
              onChange={(event) => update('durationMinutes', Number(event.target.value))}
              onBlur={() => markTouched('durationMinutes')}
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
            value={settings.meditationType}
            disabled={areTimerSettingsControlsDisabled}
            aria-invalid={Boolean(visibleErrors.meditationType)}
            aria-describedby={meditationTypeMessageId}
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
          onClick={() => setAdvancedOpen((current) => !current)}
        >
          {advancedOpen ? 'Hide Advanced Options' : 'Show Advanced Options'}
        </button>

        {advancedOpen ? (
          <div id={advancedContentId} className="advanced-content">
            <div className="form-grid">
              <label>
                <span>Start sound (optional)</span>
                <select
                  value={settings.startSound}
                  disabled={areTimerSettingsControlsDisabled}
                  onChange={(event) => update('startSound', event.target.value)}
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
                  value={settings.endSound}
                  disabled={areTimerSettingsControlsDisabled}
                  onChange={(event) => update('endSound', event.target.value)}
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
                  checked={settings.intervalEnabled}
                  disabled={areTimerSettingsControlsDisabled}
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
                      disabled={areTimerSettingsControlsDisabled}
                      aria-invalid={Boolean(visibleErrors.intervalMinutes)}
                      aria-describedby={intervalMessageId}
                      onChange={(event) => update('intervalMinutes', Number(event.target.value))}
                      onBlur={() => markTouched('intervalMinutes')}
                    />
                    {visibleErrors.intervalMinutes ? (
                      <small id={intervalMessageId} className="error-text">
                    {visibleErrors.intervalMinutes}
                  </small>
                ) : (
                  <small id={intervalMessageId} className="hint-text">
                    {settings.timerMode === 'open-ended'
                      ? `A bell will repeat every ${settings.intervalMinutes} minute${settings.intervalMinutes === 1 ? '' : 's'} until you end the session.`
                      : `${intervalCount} interval bell${intervalCount === 1 ? '' : 's'} will occur before session end.`}
                  </small>
                )}
              </label>

                  <label>
                    <span>Interval sound</span>
                    <select
                      value={settings.intervalSound}
                      disabled={areTimerSettingsControlsDisabled}
                      onChange={(event) => update('intervalSound', event.target.value)}
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

      <div className="timer-actions">
        <button
          type="button"
          onClick={onStart}
          disabled={isTimerStartBlockedByPlaylistRun}
          aria-describedby={isTimerStartBlockedByPlaylistRun ? timerStartBlockedMessageId : undefined}
        >
          {settings.timerMode === 'open-ended' ? 'Start Open-Ended Session' : 'Start Session'}
        </button>
      </div>

      {isTimerStartBlockedByPlaylistRun ? (
        <div id={timerStartBlockedMessageId} className="status-banner warn" role="status">
          <p>
            {isSettingsLoading
              ? 'Timer defaults are still loading from the backend. Please wait a moment before starting.'
              : 'A playlist run is active. Resume or end the playlist run before starting a separate timer session.'}
          </p>
          {isSettingsLoading ? null : (
            <button type="button" className="link-button" onClick={() => navigate('/practice/playlists/active')}>
              Resume Playlist Run
            </button>
          )}
        </div>
      ) : null}

      <section className="practice-tools-panel" aria-label="Practice tools">
        <div className="practice-tools-header">
          <h3 className="section-title">Practice Tools</h3>
          <button
            type="button"
            className="secondary"
            aria-expanded={toolsOpen}
            aria-controls={practiceToolsContentId}
            onClick={() => setToolsOpen((current) => !current)}
          >
            {toolsOpen ? 'Hide Tools' : 'Show Tools'}
          </button>
        </div>
        <p className="section-subtitle">
          Keep timer setup focused. Open tools when you want to manage custom play or playlists.
        </p>

        {activePlaylistRun ? (
          <div className="status-banner">
            <p>
              Playlist run active: {activePlaylistRun.playlistName} · item {activePlaylistRun.currentIndex + 1}/
              {activePlaylistRun.items.length}
            </p>
            <button type="button" className="link-button" onClick={() => navigate('/practice/playlists/active')}>
              Resume Playlist Run
            </button>
          </div>
        ) : null}

        {toolsOpen ? (
          <div id={practiceToolsContentId} className="practice-tools-content">
            <CustomPlayManager />

            <section className="playlist-entry-panel">
              <h3 className="section-title">Playlists</h3>
              <p className="section-subtitle">Manage ordered playlist flows and run them with automatic session log tracking.</p>
              <div className="timer-actions">
                <button type="button" onClick={() => navigate('/practice/playlists')}>
                  Open Playlists
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </section>
  );
}
