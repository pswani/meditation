import { useEffect, useMemo, useState } from 'react';
import { NotificationSettingsPanel } from '../features/timer/NotificationSettingsPanel';
import { SettingsDefaultsPanel } from '../features/timer/SettingsDefaultsPanel';
import { defaultTimerSettings } from '../features/timer/constants';
import { useTimer } from '../features/timer/useTimer';
import type { TimerMode, TimerSettings } from '../types/timer';
import { detectTimerRuntimeEnvironment, requestTimerNotificationPermission } from '../utils/timerRuntime';
import { getIntervalBellCount, validateTimerSettings } from '../utils/timerValidation';
import { hasTimerSettingsChanges, type SaveMessageTone, type SavePhase } from './settingsPageHelpers';

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

      <SettingsDefaultsPanel
        draft={draft}
        errors={errors}
        fixedDurationMinutes={fixedDurationMinutes}
        intervalCount={intervalCount}
        hasUnsavedChanges={hasUnsavedChanges}
        areSettingsControlsDisabled={areSettingsControlsDisabled}
        onSelectTimerMode={selectTimerMode}
        onUpdateDurationMinutes={updateDurationMinutes}
        onUpdate={update}
        onSaveDefaults={saveDefaults}
        onResetDefaults={resetDefaults}
      />

      <NotificationSettingsPanel
        notificationRuntime={notificationRuntime}
        notificationMessage={notificationMessage}
        notificationMessageTone={notificationMessageTone}
        isRequestingNotificationPermission={isRequestingNotificationPermission}
        notificationActionLabel={notificationActionLabel}
        onEnableCompletionNotifications={() => {
          void enableCompletionNotifications();
        }}
      />
    </section>
  );
}
