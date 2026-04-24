import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PracticeSetupForm } from '../features/timer/PracticeSetupForm';
import { PracticeToolsPanel } from '../features/timer/PracticeToolsPanel';
import { formatRemainingTime } from '../features/timer/time';
import { usePracticeSetupState } from '../features/timer/usePracticeSetupState';
import { useTimer } from '../features/timer/useTimer';
import type { TimerSettings } from '../types/timer';

interface PracticeRouteState {
  readonly entryMessage?: string;
  readonly timerPreset?: TimerSettings;
}

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
  const [entryMessage, setEntryMessage] = useState<string | null>(null);
  const {
    draftSettings,
    advancedOpen,
    setAdvancedOpen,
    toolsOpen,
    setToolsOpen,
    beginStartAttempt,
    visibleErrors,
    fixedDurationMinutes,
    intervalCount,
    showSafariLockGuidance,
    update,
    updateDurationMinutes,
    markTouched,
    selectTimerMode,
    applyDraftPreset,
    markDraftDirty,
  } = usePracticeSetupState(defaultSettings);

  useEffect(() => {
    const state = location.state as PracticeRouteState | null;
    if (!state?.entryMessage && !state?.timerPreset) {
      return;
    }

    if (state.timerPreset) {
      applyDraftPreset(state.timerPreset);
    }

    setEntryMessage(state.entryMessage ?? null);
    navigate(location.pathname, { replace: true, state: null });
  }, [applyDraftPreset, location.pathname, location.state, navigate]);

  function onStart() {
    beginStartAttempt();
    const started = startSession(draftSettings);
    if (started) {
      navigate('/practice/active');
    }
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
          <p>Loading timer defaults before starting a session.</p>
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
              ? `Saving ${formatRemainingTime(lastOutcome.completedDurationSeconds)} to history.`
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

      <PracticeSetupForm
        draftSettings={draftSettings}
        fixedDurationMinutes={fixedDurationMinutes}
        visibleErrors={visibleErrors}
        intervalCount={intervalCount}
        advancedOpen={advancedOpen}
        advancedContentId={advancedContentId}
        areTimerSettingsControlsDisabled={areTimerSettingsControlsDisabled}
        onSelectTimerMode={selectTimerMode}
        onUpdateDurationMinutes={updateDurationMinutes}
        onUpdate={update}
        onMarkTouched={markTouched}
        onToggleAdvanced={() => setAdvancedOpen((current) => !current)}
      />

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
              ? 'Timer defaults are still loading. Please wait a moment before starting.'
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

      <PracticeToolsPanel
        draftSettings={draftSettings}
        toolsOpen={toolsOpen}
        practiceToolsContentId={practiceToolsContentId}
        activePlaylistRun={activePlaylistRun}
        activeCustomPlayRun={activeCustomPlayRun}
        onToggleTools={() => setToolsOpen((current) => !current)}
        onApplyCustomPlay={(nextSettings) => {
          applyDraftPreset(nextSettings);
          markDraftDirty();
        }}
        onStartCustomPlay={() => navigate('/practice/custom-plays/active')}
        onOpenActivePlaylistRun={() => navigate('/practice/playlists/active')}
        onOpenPlaylists={() => navigate('/practice/playlists')}
      />
    </section>
  );
}
