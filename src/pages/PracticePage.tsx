import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomPlayManager from '../features/customPlays/CustomPlayManager';
import { meditationTypes, soundOptions } from '../features/timer/constants';
import { formatRemainingTime } from '../features/timer/time';
import { useTimer } from '../features/timer/useTimer';
import type { MeditationType, TimerMode, TimerSettings } from '../types/timer';
import { detectTimerRuntimeEnvironment } from '../utils/timerRuntime';
import { getIntervalBellCount, validateTimerSettings } from '../utils/timerValidation';

type SetupField = 'durationMinutes' | 'meditationType' | 'intervalMinutes';

interface PracticeRouteState {
  readonly entryMessage?: string;
  readonly timerPreset?: TimerSettings;
}

const initialTouchedState: Record<SetupField, boolean> = {
  durationMinutes: false,
  meditationType: false,
  intervalMinutes: false,
};

export default function PracticePage() {
  const {
    settings: defaultSettings,
    activeSession,
    activeCustomPlayRun,
    activePlaylistRun,
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
  const isTimerStartBlockedByPlaylistRun = Boolean(activePlaylistRun) || Boolean(activeCustomPlayRun) || isSettingsLoading;
  const areTimerSettingsControlsDisabled = isSettingsLoading;
  const advancedContentId = 'advanced-timer-settings';
  const practiceToolsContentId = 'practice-tools-content';
  const timerStartBlockedMessageId = 'timer-start-blocked-message';
  const [draftSettings, setDraftSettings] = useState(defaultSettings);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [startAttempted, setStartAttempted] = useState(false);
  const [entryMessage, setEntryMessage] = useState<string | null>(null);
  const [isDraftDirty, setIsDraftDirty] = useState(false);
  const [touched, setTouched] = useState<Record<SetupField, boolean>>(initialTouchedState);
  const timerRuntime = useMemo(() => detectTimerRuntimeEnvironment(), []);
  const validation = useMemo(() => validateTimerSettings(draftSettings), [draftSettings]);
  const fixedDurationMinutes = draftSettings.durationMinutes ?? draftSettings.lastFixedDurationMinutes;
  const showSafariLockGuidance = draftSettings.timerMode === 'fixed' && timerRuntime.isLikelyIPhoneSafariBrowser;

  const intervalCount = useMemo(
    () =>
      draftSettings.intervalEnabled && draftSettings.timerMode === 'fixed'
        ? getIntervalBellCount(fixedDurationMinutes, draftSettings.intervalMinutes)
        : 0,
    [draftSettings.intervalEnabled, draftSettings.intervalMinutes, draftSettings.timerMode, fixedDurationMinutes]
  );

  const visibleErrors = useMemo(
    () => ({
      durationMinutes: (startAttempted || touched.durationMinutes) ? validation.errors.durationMinutes : undefined,
      meditationType: (startAttempted || touched.meditationType) ? validation.errors.meditationType : undefined,
      intervalMinutes:
        draftSettings.intervalEnabled && (startAttempted || touched.intervalMinutes) ? validation.errors.intervalMinutes : undefined,
    }),
    [draftSettings.intervalEnabled, startAttempted, touched, validation.errors]
  );
  const durationMessageId = visibleErrors.durationMinutes ? 'practice-duration-error' : 'practice-duration-hint';
  const meditationTypeMessageId = visibleErrors.meditationType ? 'practice-meditation-type-error' : 'practice-meditation-type-hint';
  const intervalMessageId = visibleErrors.intervalMinutes ? 'practice-interval-error' : 'practice-interval-hint';

  useEffect(() => {
    if (!isDraftDirty) {
      setDraftSettings(defaultSettings);
    }
  }, [defaultSettings, isDraftDirty]);

  useEffect(() => {
    if (visibleErrors.intervalMinutes) {
      setAdvancedOpen(true);
    }
  }, [visibleErrors.intervalMinutes]);

  useEffect(() => {
    const state = location.state as PracticeRouteState | null;
    if (!state?.entryMessage && !state?.timerPreset) {
      return;
    }

    if (state.timerPreset) {
      setDraftSettings(state.timerPreset);
      setIsDraftDirty(true);
      setStartAttempted(false);
      setTouched(initialTouchedState);
    }

    setEntryMessage(state.entryMessage ?? null);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  function update<K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) {
    setIsDraftDirty(true);
    setDraftSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateDurationMinutes(value: number) {
    setIsDraftDirty(true);
    setDraftSettings((current) => ({
      ...current,
      durationMinutes: value,
      lastFixedDurationMinutes: value > 0 ? value : current.lastFixedDurationMinutes,
    }));
  }

  function markTouched(field: SetupField) {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }));
  }

  function onStart() {
    setStartAttempted(true);
    const started = startSession(draftSettings);
    if (started) {
      navigate('/practice/active');
    }
  }

  function selectTimerMode(timerMode: TimerMode) {
    setIsDraftDirty(true);
    if (timerMode === 'fixed') {
      setDraftSettings((current) => ({
        ...current,
        timerMode: 'fixed',
        durationMinutes: current.durationMinutes ?? current.lastFixedDurationMinutes,
      }));
      return;
    }

    setDraftSettings((current) => ({
      ...current,
      timerMode: 'open-ended',
      durationMinutes: null,
      lastFixedDurationMinutes: current.durationMinutes ?? current.lastFixedDurationMinutes,
    }));
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

      {showSafariLockGuidance ? (
        <div className="status-banner" role="status">
          <p>
            On iPhone Safari browser tabs, if the phone locks before a fixed timer ends, completion can wait until Safari
            returns to the foreground.
          </p>
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
          {lastOutcome.deferredCompletion ? (
            <p>This fixed timer reached its scheduled end while Safari was in the background, so completion was confirmed on return.</p>
          ) : null}
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
        <label className={`timer-mode-option ${draftSettings.timerMode === 'fixed' ? 'selected' : ''}`}>
          <input
            type="radio"
            name="timer-mode"
            checked={draftSettings.timerMode === 'fixed'}
            disabled={areTimerSettingsControlsDisabled}
            onChange={() => selectTimerMode('fixed')}
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
            onChange={() => selectTimerMode('open-ended')}
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
              onChange={(event) => updateDurationMinutes(Number(event.target.value))}
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
            value={draftSettings.meditationType}
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
                  value={draftSettings.startSound}
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
                  value={draftSettings.endSound}
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
                  checked={draftSettings.intervalEnabled}
                  disabled={areTimerSettingsControlsDisabled}
                  onChange={(event) => update('intervalEnabled', event.target.checked)}
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
                      onChange={(event) => update('intervalMinutes', Number(event.target.value))}
                      onBlur={() => markTouched('intervalMinutes')}
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
          {draftSettings.timerMode === 'open-ended' ? 'Start Open-Ended Session' : 'Start Session'}
        </button>
      </div>

      {isTimerStartBlockedByPlaylistRun ? (
        <div id={timerStartBlockedMessageId} className="status-banner warn" role="status">
          <p>
            {isSettingsLoading
              ? 'Timer defaults are still loading from the backend. Please wait a moment before starting.'
              : activeCustomPlayRun
              ? `Custom play active: ${activeCustomPlayRun.customPlayName}. Resume or end it before starting a separate timer session.`
              : 'A playlist run is active. Resume or end the playlist run before starting a separate timer session.'}
          </p>
          {isSettingsLoading ? null : activeCustomPlayRun ? (
            <button type="button" className="link-button" onClick={() => navigate('/practice/custom-plays/active')}>
              Resume Custom Play
            </button>
          ) : (
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

        {!activePlaylistRun && activeCustomPlayRun ? (
          <div className="status-banner">
            <p>Custom play active: {activeCustomPlayRun.customPlayName}</p>
            <button type="button" className="link-button" onClick={() => navigate('/practice/custom-plays/active')}>
              Resume Custom Play
            </button>
          </div>
        ) : null}

        {toolsOpen ? (
          <div id={practiceToolsContentId} className="practice-tools-content">
            <CustomPlayManager
              timerSettings={draftSettings}
              onApplyCustomPlay={(nextSettings) => {
                setDraftSettings(nextSettings);
                setIsDraftDirty(true);
              }}
              onStartCustomPlay={() => navigate('/practice/custom-plays/active')}
            />

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
