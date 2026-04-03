import { useEffect, useMemo, useState } from 'react';
import { meditationTypes, soundOptions, defaultTimerSettings } from '../features/timer/constants';
import { useTimer } from '../features/timer/useTimer';
import type { TimerMode, TimerSettings } from '../types/timer';
import { detectTimerRuntimeEnvironment, requestTimerNotificationPermission } from '../utils/timerRuntime';
import { getIntervalBellCount, validateTimerSettings } from '../utils/timerValidation';

type SavePhase = 'idle' | 'awaiting-sync-start' | 'saving';
type SaveMessageTone = 'ok' | 'status' | 'warn';

function getNotificationCapabilityCopy(
  capability: ReturnType<typeof detectTimerRuntimeEnvironment>['notificationCapability']
): string {
  return capability === 'available' ? 'Available in this browser context.' : 'Unavailable in this browser context.';
}

function getNotificationPermissionCopy(
  permission: ReturnType<typeof detectTimerRuntimeEnvironment>['notificationPermission']
): string {
  switch (permission) {
    case 'granted':
      return 'Allowed.';
    case 'denied':
      return 'Blocked.';
    case 'default':
      return 'Not requested yet.';
    default:
      return 'Unavailable.';
  }
}

function hasTimerSettingsChanges(current: TimerSettings, baseline: TimerSettings): boolean {
  return (
    current.timerMode !== baseline.timerMode ||
    current.durationMinutes !== baseline.durationMinutes ||
    current.lastFixedDurationMinutes !== baseline.lastFixedDurationMinutes ||
    current.meditationType !== baseline.meditationType ||
    current.startSound !== baseline.startSound ||
    current.endSound !== baseline.endSound ||
    current.intervalEnabled !== baseline.intervalEnabled ||
    current.intervalMinutes !== baseline.intervalMinutes ||
    current.intervalSound !== baseline.intervalSound
  );
}

export default function SettingsPage() {
  const { settings, setSettings, isSettingsLoading, isSettingsSyncing, settingsSyncError } = useTimer();
  const [draft, setDraft] = useState<TimerSettings>(settings);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveMessageTone, setSaveMessageTone] = useState<SaveMessageTone>('ok');
  const [savePhase, setSavePhase] = useState<SavePhase>('idle');
  const [errors, setErrors] = useState<ReturnType<typeof validateTimerSettings>['errors']>({});
  const [notificationRuntime, setNotificationRuntime] = useState(() => detectTimerRuntimeEnvironment());
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [notificationMessageTone, setNotificationMessageTone] = useState<SaveMessageTone>('status');
  const [isRequestingNotificationPermission, setIsRequestingNotificationPermission] = useState(false);
  const hasUnsavedChanges = useMemo(() => hasTimerSettingsChanges(draft, settings), [draft, settings]);
  const fixedDurationMinutes = draft.durationMinutes ?? draft.lastFixedDurationMinutes;
  const areSettingsControlsDisabled = isSettingsLoading || isSettingsSyncing;
  const durationMessageId = errors.durationMinutes ? 'settings-duration-error' : 'settings-duration-hint';
  const meditationTypeMessageId = errors.meditationType ? 'settings-meditation-type-error' : 'settings-meditation-type-hint';
  const intervalMessageId = errors.intervalMinutes ? 'settings-interval-error' : 'settings-interval-hint';

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    setNotificationRuntime(detectTimerRuntimeEnvironment());
  }, []);

  useEffect(() => {
    if (savePhase === 'idle') {
      return;
    }

    if (savePhase === 'awaiting-sync-start') {
      if (isSettingsSyncing) {
        setSavePhase('saving');
      }
      return;
    }

    if (isSettingsSyncing) {
      return;
    }

    if (settingsSyncError) {
      setSaveMessage(null);
      setSavePhase('idle');
      return;
    }

    setSaveMessage('Settings saved.');
    setSaveMessageTone('ok');
    setSavePhase('idle');
  }, [isSettingsSyncing, savePhase, settingsSyncError]);

  const intervalCount = useMemo(
    () => (draft.intervalEnabled && draft.timerMode === 'fixed' ? getIntervalBellCount(fixedDurationMinutes, draft.intervalMinutes) : 0),
    [draft.intervalEnabled, draft.intervalMinutes, draft.timerMode, fixedDurationMinutes]
  );

  function update<K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) {
    setSaveMessage(null);
    setSavePhase('idle');
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateDurationMinutes(value: number) {
    setSaveMessage(null);
    setSavePhase('idle');
    setDraft((current) => ({
      ...current,
      durationMinutes: value,
      lastFixedDurationMinutes: value > 0 ? value : current.lastFixedDurationMinutes,
    }));
  }

  function selectTimerMode(timerMode: TimerMode) {
    setSaveMessage(null);
    setSavePhase('idle');
    setDraft((current) => {
      if (timerMode === 'fixed') {
        return {
          ...current,
          timerMode: 'fixed',
          durationMinutes: current.durationMinutes ?? current.lastFixedDurationMinutes,
        };
      }

      return {
        ...current,
        timerMode: 'open-ended',
        durationMinutes: null,
        lastFixedDurationMinutes: current.durationMinutes ?? current.lastFixedDurationMinutes,
      };
    });
  }

  function saveDefaults() {
    if (!hasUnsavedChanges) {
      setSaveMessage(null);
      return;
    }

    const validation = validateTimerSettings(draft);
    setErrors(validation.errors);

    if (!validation.isValid) {
      setSaveMessage(null);
      return;
    }

    setSettings(draft);
    setSaveMessage('Saving timer preferences to the backend.');
    setSaveMessageTone('status');
    setSavePhase('awaiting-sync-start');
  }

  function resetDefaults() {
    const resetValue: TimerSettings = {
      ...defaultTimerSettings,
    };
    setDraft(resetValue);
    setSettings(resetValue);
    setErrors({});
    setSaveMessage('Saving app defaults to the backend.');
    setSaveMessageTone('status');
    setSavePhase('awaiting-sync-start');
  }

  async function enableCompletionNotifications() {
    setNotificationMessage(null);
    setIsRequestingNotificationPermission(true);

    try {
      const permission = await requestTimerNotificationPermission();
      const nextRuntime = detectTimerRuntimeEnvironment();
      setNotificationRuntime(nextRuntime);

      if (permission === 'granted') {
        setNotificationMessage('Completion notifications enabled.');
        setNotificationMessageTone('ok');
        return;
      }

      if (permission === 'denied') {
        setNotificationMessage('Notification permission was not granted in this browser.');
        setNotificationMessageTone('warn');
        return;
      }

      if (permission === 'unsupported') {
        setNotificationMessage('Notification permission is unavailable in this browser context.');
        setNotificationMessageTone('warn');
        return;
      }

      setNotificationMessage('Notification permission is still waiting for your decision.');
      setNotificationMessageTone('status');
    } catch {
      setNotificationRuntime(detectTimerRuntimeEnvironment());
      setNotificationMessage('Notification permission could not be requested right now.');
      setNotificationMessageTone('warn');
    } finally {
      setIsRequestingNotificationPermission(false);
    }
  }

  const notificationActionLabel = isRequestingNotificationPermission
    ? 'Requesting Permission...'
    : notificationRuntime.notificationPermission === 'granted'
      ? 'Notifications Enabled'
      : notificationRuntime.notificationPermission === 'denied'
        ? 'Notifications Blocked'
        : notificationRuntime.notificationCapability === 'unavailable'
          ? 'Notifications Unavailable'
          : 'Enable Completion Notifications';

  return (
    <section className="page-card settings-screen">
      <h2 className="page-title">Settings</h2>
      <p className="page-description">Adjust default timer preferences for a steady, low-friction practice flow.</p>

      {saveMessage ? (
        <div
          className={`status-banner ${saveMessageTone === 'ok' ? 'ok' : saveMessageTone === 'warn' ? 'warn' : ''}`}
          role="status"
        >
          <p>{saveMessage}</p>
        </div>
      ) : null}

      {isSettingsLoading ? (
        <div className="status-banner" role="status">
          <p>Loading timer preferences from the backend.</p>
        </div>
      ) : null}

      {settingsSyncError ? (
        <div className="status-banner warn" role="status">
          <p>{settingsSyncError}</p>
        </div>
      ) : null}

      <p className={`settings-draft-state ${hasUnsavedChanges ? 'warn' : 'saved'}`}>
        {hasUnsavedChanges ? 'You have unsaved changes.' : 'All timer defaults are saved.'}
      </p>

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
                onChange={() => selectTimerMode('fixed')}
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
                onChange={() => selectTimerMode('open-ended')}
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
                onChange={(event) => updateDurationMinutes(Number(event.target.value))}
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
              onChange={(event) => update('meditationType', event.target.value as TimerSettings['meditationType'])}
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
            <select
              value={draft.startSound}
              disabled={areSettingsControlsDisabled}
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
            <span>Default end sound</span>
            <select
              value={draft.endSound}
              disabled={areSettingsControlsDisabled}
              onChange={(event) => update('endSound', event.target.value)}
            >
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
                  disabled={areSettingsControlsDisabled}
                  aria-invalid={Boolean(errors.intervalMinutes)}
                  aria-describedby={intervalMessageId}
                  onChange={(event) => update('intervalMinutes', Number(event.target.value))}
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
                  onChange={(event) => update('intervalSound', event.target.value)}
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
          <button type="button" onClick={saveDefaults} disabled={!hasUnsavedChanges || areSettingsControlsDisabled}>
            Save Defaults
          </button>
          <button type="button" className="secondary" onClick={resetDefaults} disabled={areSettingsControlsDisabled}>
            Reset To App Defaults
          </button>
        </div>
      </section>

      <section className="settings-panel">
        <h3 className="section-title">Completion Notifications</h3>
        <div className="mode-hint-card">
          <strong>Optional completion notice</strong>
          <p className="section-subtitle">
            If the browser allows it, the app can post a timer completion notice while the app is not visible.
          </p>
        </div>

        {notificationMessage ? (
          <div
            className={`status-banner ${notificationMessageTone === 'ok' ? 'ok' : notificationMessageTone === 'warn' ? 'warn' : ''}`}
            role="status"
          >
            <p>{notificationMessage}</p>
          </div>
        ) : null}

        <p className="section-subtitle">Capability: {getNotificationCapabilityCopy(notificationRuntime.notificationCapability)}</p>
        <p className="section-subtitle">Permission: {getNotificationPermissionCopy(notificationRuntime.notificationPermission)}</p>

        {notificationRuntime.isLikelyIPhoneSafariBrowser ? (
          <p className="hint-text">
            In iPhone Safari browser tabs, timer completion can still wait until Safari returns to the foreground. This
            setting only helps when browser support and permission are both available.
          </p>
        ) : null}

        <div className="timer-actions">
          <button
            type="button"
            className={notificationRuntime.canRequestNotificationPermission ? '' : 'secondary'}
            disabled={!notificationRuntime.canRequestNotificationPermission || isRequestingNotificationPermission}
            onClick={() => {
              void enableCompletionNotifications();
            }}
          >
            {notificationActionLabel}
          </button>
        </div>
      </section>
    </section>
  );
}
