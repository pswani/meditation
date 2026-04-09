import { useEffect, useMemo, useState } from 'react';
import type { MeditationType, TimerMode, TimerSettings } from '../../types/timer';
import { detectTimerRuntimeEnvironment } from '../../utils/timerRuntime';
import { getIntervalBellCount, validateTimerSettings } from '../../utils/timerValidation';

type SetupField = 'durationMinutes' | 'meditationType' | 'intervalMinutes';

const initialTouchedState: Record<SetupField, boolean> = {
  durationMinutes: false,
  meditationType: false,
  intervalMinutes: false,
};

export function usePracticeSetupState(defaultSettings: TimerSettings) {
  const [draftSettings, setDraftSettings] = useState(defaultSettings);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [startAttempted, setStartAttempted] = useState(false);
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

  function applyDraftPreset(nextSettings: TimerSettings) {
    setDraftSettings(nextSettings);
    setIsDraftDirty(true);
    setStartAttempted(false);
    setTouched(initialTouchedState);
  }

  function beginStartAttempt() {
    setStartAttempted(true);
  }

  return {
    draftSettings,
    setDraftSettings,
    advancedOpen,
    setAdvancedOpen,
    toolsOpen,
    setToolsOpen,
    startAttempted,
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
    markDraftDirty: () => setIsDraftDirty(true),
  };
}

export type PracticeVisibleErrors = ReturnType<typeof usePracticeSetupState>['visibleErrors'];
export type PracticeUpdateField = <K extends keyof TimerSettings>(key: K, value: TimerSettings[K]) => void;
export type PracticeMeditationType = MeditationType;
