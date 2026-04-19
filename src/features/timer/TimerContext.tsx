import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useSyncStatus } from '../sync/useSyncStatus';
import type {
  ActiveCustomPlayRun,
  CustomPlay,
  CustomPlayRunOutcome,
  CustomPlayRunStartResult,
  CustomPlaySaveResult,
} from '../../types/customPlay';
import type { LastUsedMeditation } from '../../types/home';
import type { ActivePlaylistRun, Playlist, PlaylistRunOutcome, PlaylistSaveResult } from '../../types/playlist';
import type { ActiveSession, TimerSettings } from '../../types/timer';
import {
  createCustomPlay,
  resolveCustomPlayMediaAsset,
  updateCustomPlay,
  validateCustomPlayDraft,
} from '../../utils/customPlay';
import { buildManualLogEntry, type ManualLogSaveResult, validateManualLogInput } from '../../utils/manualLog';
import { createPlaylist, updatePlaylist, validatePlaylistDraft } from '../../utils/playlist';
import { buildPlaylistItemLogEntry } from '../../utils/playlistLog';
import { evaluatePlaylistDelete, evaluatePlaylistRunStart } from '../../utils/playlistRunPolicy';
import {
  buildActivePlaylistRun,
  completePlaylistRunCurrentSegment,
  getPlaylistItemDurationSeconds,
  getPlaylistRunCurrentItem,
  isAudioBackedPlaylistItem,
  pausePlaylistRun as pauseActivePlaylistRun,
  resumePlaylistRun as resumeActivePlaylistRun,
  updatePlaylistRunAudioProgress,
  updatePlaylistRunTimedProgress,
} from '../../utils/playlistRuntime';
import {
  buildCustomPlayLogEntry,
  canChangeSessionLogMeditationType,
  updateSessionLogMeditationType as applySessionLogMeditationTypeUpdate,
} from '../../utils/sessionLog';
import {
  loadLastUsedMeditation,
  saveActivePlaylistRunState,
  saveActiveCustomPlayRunState,
  saveActiveTimerState,
  saveCustomPlays,
  savePlaylists,
  saveSessionLogs,
  saveTimerSettings,
} from '../../utils/storage';
import { validateTimerSettings } from '../../utils/timerValidation';
import { notifyTimerCompletion } from '../../utils/timerCompletionNotice';
import { shouldRunForegroundCatchUp } from './foregroundCatchUp';
import { createTimerSoundPlayer, getElapsedIntervalCueCount } from './timerSoundPlayback';
import { createInitialTimerState, timerReducer } from './timerReducer';
import { TimerContext, type TimerContextValue } from './timerContextObject';
import {
  attemptTimerSoundPlayback,
  buildQueuedDeleteMessage,
  buildQueuedSaveMessage,
  clearLastUsedMeditationRecord,
  createTimerBootstrap,
  mergeCustomPlays,
  mergePlaylists,
  mergeSessionLogs,
  mergeQueueEntry,
  recordLastUsedMeditation,
  serializeActiveCustomPlayPersistence,
  type TimerBootstrap,
} from './timerProviderHelpers';
import { getActiveSessionElapsedMilliseconds } from './time';
import { useTimerSyncEffects } from './useTimerSyncEffects';

type TimerSyncTickSource = 'interval' | 'scheduled-completion' | 'foreground-return';

function getFixedTimerCompletionDelayMs(session: ActiveSession, nowMs: number): number | null {
  if (session.timerMode !== 'fixed' || session.intendedDurationSeconds === null) {
    return null;
  }

  return Math.max(0, session.intendedDurationSeconds * 1000 - getActiveSessionElapsedMilliseconds(session, nowMs));
}

export function TimerProvider({ children }: { readonly children: ReactNode }) {
  const {
    connectionMode,
    canAttemptBackendSync,
    queue,
    updateQueue,
    reportBackendReachable,
    reportBackendUnreachable,
  } = useSyncStatus();
  const [bootstrap] = useState<TimerBootstrap>(() => createTimerBootstrap(Date.now()));
  const [lastUsedMeditation, setLastUsedMeditation] = useState<LastUsedMeditation | null>(() => loadLastUsedMeditation());
  const [state, dispatch] = useReducer(
    timerReducer,
    undefined,
    () => {
      const initialState = createInitialTimerState(bootstrap.settings, bootstrap.sessionLogs);

      return {
        ...initialState,
        activeSession: bootstrap.hydration.activeSession,
      };
    }
  );
  const [customPlays, setCustomPlays] = useState<CustomPlay[]>(bootstrap.customPlays);
  const [playlists, setPlaylists] = useState<Playlist[]>(bootstrap.playlists);
  const [activeCustomPlayRun, setActiveCustomPlayRun] = useState<ActiveCustomPlayRun | null>(bootstrap.hydration.activeCustomPlayRun);
  const [customPlayRunOutcome, setCustomPlayRunOutcome] = useState<CustomPlayRunOutcome | null>(null);
  const [activePlaylistRun, setActivePlaylistRun] = useState<ActivePlaylistRun | null>(bootstrap.hydration.activePlaylistRun);
  const [playlistRunOutcome, setPlaylistRunOutcome] = useState<PlaylistRunOutcome | null>(null);
  const [isPlaylistRunPaused, setIsPlaylistRunPaused] = useState(bootstrap.hydration.isPlaylistRunPaused);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(bootstrap.hydration.recoveryMessage);
  const [isSessionLogsLoading, setIsSessionLogsLoading] = useState(true);
  const [isSessionLogSyncing, setIsSessionLogSyncing] = useState(false);
  const [sessionLogSyncError, setSessionLogSyncError] = useState<string | null>(null);
  const [isCustomPlaysLoading, setIsCustomPlaysLoading] = useState(true);
  const [isCustomPlaySyncing, setIsCustomPlaySyncing] = useState(false);
  const [customPlaySyncError, setCustomPlaySyncError] = useState<string | null>(null);
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(true);
  const [isPlaylistSyncing, setIsPlaylistSyncing] = useState(false);
  const [playlistSyncError, setPlaylistSyncError] = useState<string | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSettingsSyncing, setIsSettingsSyncing] = useState(false);
  const [settingsSyncError, setSettingsSyncError] = useState<string | null>(null);
  const [timerSoundPlaybackMessage, setTimerSoundPlaybackMessage] = useState<string | null>(null);
  const [customPlayRuntimeMessage, setCustomPlayRuntimeMessage] = useState<string | null>(null);
  const [playlistRuntimeMessage, setPlaylistRuntimeMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isPlaylistsLoading || lastUsedMeditation?.kind !== 'playlist') {
      return;
    }

    if (!playlists.some((playlist) => playlist.id === lastUsedMeditation.playlistId)) {
      clearLastUsedMeditationRecord(setLastUsedMeditation);
    }
  }, [isPlaylistsLoading, lastUsedMeditation, playlists]);

  useEffect(() => {
    if (isCustomPlaysLoading || lastUsedMeditation?.kind !== 'custom-play') {
      return;
    }

    if (!customPlays.some((play) => play.id === lastUsedMeditation.customPlayId)) {
      clearLastUsedMeditationRecord(setLastUsedMeditation);
    }
  }, [customPlays, isCustomPlaysLoading, lastUsedMeditation]);
  const [activeSessionNowMs, setActiveSessionNowMs] = useState(() => Date.now());
  const latestSessionLogsRef = useRef(state.sessionLogs);
  const latestCustomPlaysRef = useRef(customPlays);
  const latestPlaylistsRef = useRef(playlists);
  const latestTimerSettingsRef = useRef(state.settings);
  const latestSyncQueueRef = useRef(queue);
  const isTimerProviderMountedRef = useRef(true);
  const skipInitialTimerSettingsPersistRef = useRef(true);
  const skipInitialSessionLogsPersistRef = useRef(true);
  const skipInitialCustomPlaysPersistRef = useRef(true);
  const skipInitialPlaylistsPersistRef = useRef(true);
  const skipInitialActiveTimerPersistRef = useRef(bootstrap.skipInitialActiveTimerPersist);
  const skipInitialActiveCustomPlayPersistRef = useRef(bootstrap.skipInitialActiveCustomPlayPersist);
  const skipInitialActivePlaylistPersistRef = useRef(bootstrap.skipInitialActivePlaylistPersist);
  const remoteSessionLogsHydratedRef = useRef(false);
  const syncedSessionLogIdsRef = useRef<Set<string>>(new Set());
  const syncedCustomPlayIdsRef = useRef<Set<string>>(new Set());
  const deletedCustomPlayIdsRef = useRef<Set<string>>(new Set());
  const syncedPlaylistIdsRef = useRef<Set<string>>(new Set());
  const deletedPlaylistIdsRef = useRef<Set<string>>(new Set());
  const remoteSettingsHydratedRef = useRef(false);
  const lastPersistedTimerSettingsRef = useRef<TimerSettings | null>(null);
  const isFlushingSyncQueueRef = useRef(false);
  const completedCustomPlayHydrationKeyRef = useRef<string | null>(null);
  const inFlightCustomPlayHydrationKeyRef = useRef<string | null>(null);
  const completedPlaylistHydrationKeyRef = useRef<string | null>(null);
  const inFlightPlaylistHydrationKeyRef = useRef<string | null>(null);
  const completedSessionLogHydrationKeyRef = useRef<string | null>(null);
  const inFlightSessionLogHydrationKeyRef = useRef<string | null>(null);
  const completedTimerSettingsHydrationKeyRef = useRef<string | null>(null);
  const inFlightTimerSettingsHydrationKeyRef = useRef<string | null>(null);
  const timerSoundPlayerRef = useRef(createTimerSoundPlayer());
  const initialRecoveredActiveSessionIdRef = useRef(bootstrap.hydration.activeSession?.startedAt ?? null);
  const activeSessionSoundStateRef = useRef<{
    sessionId: string | null;
    startHandled: boolean;
    lastIntervalCueCount: number;
  }>({
    sessionId: null,
    startHandled: false,
    lastIntervalCueCount: 0,
  });
  const lastActiveSessionRef = useRef(state.activeSession);
  const pendingEndedSessionRef = useRef<ActiveSession | null>(null);
  const handledSoundPlaybackMessageKeyRef = useRef<string | null>(null);
  const handledTimerOutcomeEndedAtRef = useRef<string | null>(null);
  const lastForegroundCatchUpAtMsRef = useRef<number | null>(null);
  const isPaused = state.activeSession?.isPaused ?? false;
  const activeTimerPersistence = state.activeSession;
  const activeCustomPlayPersistence = useMemo(
    () =>
      activeCustomPlayRun
        ? {
            ...activeCustomPlayRun,
            currentPositionSeconds: Math.max(
              0,
              Math.min(activeCustomPlayRun.durationSeconds, Math.round(activeCustomPlayRun.currentPositionSeconds))
            ),
          }
        : null,
    [activeCustomPlayRun]
  );
  const activePlaylistPersistence = useMemo(
    () => {
      if (!activePlaylistRun) {
        return null;
      }

      const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
      let persistedSegment = activePlaylistRun.currentSegment;

      if (!isPlaylistRunPaused && activePlaylistRun.currentSegment.phase === 'gap') {
        persistedSegment = {
          ...activePlaylistRun.currentSegment,
          remainingSeconds: activePlaylistRun.smallGapSeconds,
        };
      }

      if (
        !isPlaylistRunPaused &&
        activePlaylistRun.currentSegment.phase === 'item' &&
        currentItem &&
        !isAudioBackedPlaylistItem(currentItem)
      ) {
        persistedSegment = {
          ...activePlaylistRun.currentSegment,
          elapsedSeconds: 0,
          remainingSeconds: getPlaylistItemDurationSeconds(currentItem),
        };
      }

      return {
        activePlaylistRun: {
          ...activePlaylistRun,
          currentSegment: persistedSegment,
        },
        isPaused: isPlaylistRunPaused,
      };
    },
    [activePlaylistRun, isPlaylistRunPaused]
  );
  const serializedActivePlaylistPersistence = useMemo(
    () => (activePlaylistPersistence ? JSON.stringify(activePlaylistPersistence) : 'null'),
    [activePlaylistPersistence]
  );
  const serializedActiveCustomPlayPersistence = useMemo(
    () => serializeActiveCustomPlayPersistence(activeCustomPlayPersistence),
    [activeCustomPlayPersistence]
  );
  const syncRefs = useMemo(
    () => ({
      latestSessionLogsRef,
      latestCustomPlaysRef,
      latestPlaylistsRef,
      latestTimerSettingsRef,
      latestSyncQueueRef,
      isTimerProviderMountedRef,
      remoteSessionLogsHydratedRef,
      syncedSessionLogIdsRef,
      syncedCustomPlayIdsRef,
      deletedCustomPlayIdsRef,
      syncedPlaylistIdsRef,
      deletedPlaylistIdsRef,
      remoteSettingsHydratedRef,
      lastPersistedTimerSettingsRef,
      isFlushingSyncQueueRef,
      completedCustomPlayHydrationKeyRef,
      inFlightCustomPlayHydrationKeyRef,
      completedPlaylistHydrationKeyRef,
      inFlightPlaylistHydrationKeyRef,
      completedSessionLogHydrationKeyRef,
      inFlightSessionLogHydrationKeyRef,
      completedTimerSettingsHydrationKeyRef,
      inFlightTimerSettingsHydrationKeyRef,
    }),
    []
  );

  useEffect(() => {
    latestSessionLogsRef.current = state.sessionLogs;
  }, [state.sessionLogs]);

  useEffect(() => {
    latestCustomPlaysRef.current = customPlays;
  }, [customPlays]);

  useEffect(() => {
    latestPlaylistsRef.current = playlists;
  }, [playlists]);

  useEffect(() => {
    latestTimerSettingsRef.current = state.settings;
  }, [state.settings]);

  useEffect(() => {
    latestSyncQueueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    isTimerProviderMountedRef.current = true;

    return () => {
      isTimerProviderMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!activePlaylistRun) {
      setIsPlaylistRunPaused(false);
    }
  }, [activePlaylistRun]);

  useEffect(() => {
    setActiveSessionNowMs(Date.now());
  }, [state.activeSession, isPaused]);

  useEffect(() => {
    if (skipInitialTimerSettingsPersistRef.current) {
      skipInitialTimerSettingsPersistRef.current = false;
      return;
    }

    saveTimerSettings(state.settings);
  }, [state.settings]);

  useEffect(() => {
    if (skipInitialSessionLogsPersistRef.current) {
      skipInitialSessionLogsPersistRef.current = false;
      return;
    }

    saveSessionLogs(state.sessionLogs);
  }, [state.sessionLogs]);

  useEffect(() => {
    if (skipInitialCustomPlaysPersistRef.current) {
      skipInitialCustomPlaysPersistRef.current = false;
      return;
    }

    saveCustomPlays(customPlays);
  }, [customPlays]);

  useEffect(() => {
    if (skipInitialPlaylistsPersistRef.current) {
      skipInitialPlaylistsPersistRef.current = false;
      return;
    }

    savePlaylists(playlists);
  }, [playlists]);

  useEffect(() => {
    if (skipInitialActiveTimerPersistRef.current) {
      skipInitialActiveTimerPersistRef.current = false;
      return;
    }

    saveActiveTimerState(activeTimerPersistence);
  }, [activeTimerPersistence]);

  useEffect(() => {
    if (skipInitialActiveCustomPlayPersistRef.current) {
      skipInitialActiveCustomPlayPersistRef.current = false;
      return;
    }

    if (serializedActiveCustomPlayPersistence === 'null') {
      saveActiveCustomPlayRunState(null);
      return;
    }

    saveActiveCustomPlayRunState(JSON.parse(serializedActiveCustomPlayPersistence) as ActiveCustomPlayRun);
  }, [serializedActiveCustomPlayPersistence]);

  useEffect(() => {
    if (skipInitialActivePlaylistPersistRef.current) {
      skipInitialActivePlaylistPersistRef.current = false;
      return;
    }

    if (serializedActivePlaylistPersistence === 'null') {
      saveActivePlaylistRunState(null, false);
      return;
    }

    const parsed = JSON.parse(serializedActivePlaylistPersistence) as {
      readonly activePlaylistRun: ActivePlaylistRun;
      readonly isPaused: boolean;
    };

    saveActivePlaylistRunState(parsed.activePlaylistRun, parsed.isPaused);
  }, [serializedActivePlaylistPersistence]);

  useTimerSyncEffects({
    bootstrap,
    state,
    queue,
    connectionMode,
    canAttemptBackendSync,
    updateQueue,
    reportBackendReachable,
    reportBackendUnreachable,
    refs: syncRefs,
    dispatch,
    setCustomPlays,
    setPlaylists,
    setIsSessionLogsLoading,
    setIsSessionLogSyncing,
    setSessionLogSyncError,
    setIsCustomPlaysLoading,
    setIsCustomPlaySyncing,
    setCustomPlaySyncError,
    setIsPlaylistsLoading,
    setIsPlaylistSyncing,
    setPlaylistSyncError,
    setIsSettingsLoading,
    setIsSettingsSyncing,
    setSettingsSyncError,
  });

  useEffect(() => {
    function syncTimerClockAndSessionState(source: TimerSyncTickSource): void {
      const nowMs = Date.now();
      setActiveSessionNowMs(nowMs);
      dispatch({ type: 'SYNC_TICK', nowMs, source });
    }

    function runForegroundCatchUp(): void {
      const nowMs = Date.now();
      if (!shouldRunForegroundCatchUp(lastForegroundCatchUpAtMsRef.current, nowMs)) {
        return;
      }

      lastForegroundCatchUpAtMsRef.current = nowMs;
      setActiveSessionNowMs(nowMs);
      dispatch({ type: 'SYNC_TICK', nowMs, source: 'foreground-return' });
    }

    if (!state.activeSession || isPaused) {
      return;
    }

    lastForegroundCatchUpAtMsRef.current = null;

    const intervalId = window.setInterval(() => {
      syncTimerClockAndSessionState('interval');
    }, 500);
    const completionDelayMs = getFixedTimerCompletionDelayMs(state.activeSession, Date.now());
    const completionTimeoutId =
      completionDelayMs === null
        ? null
        : window.setTimeout(() => {
            syncTimerClockAndSessionState('scheduled-completion');
          }, completionDelayMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runForegroundCatchUp();
      }
    };
    const handlePageShow = () => {
      runForegroundCatchUp();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.clearInterval(intervalId);
      if (completionTimeoutId !== null) {
        window.clearTimeout(completionTimeoutId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [state.activeSession, isPaused]);

  useEffect(() => {
    const activeSession = state.activeSession;
    const soundState = activeSessionSoundStateRef.current;
    const nowMs = activeSessionNowMs;

    if (activeSession) {
      const isRecoveredSession = activeSession.startedAt === initialRecoveredActiveSessionIdRef.current;

      if (soundState.sessionId !== activeSession.startedAt) {
        soundState.sessionId = activeSession.startedAt;
        soundState.startHandled = isRecoveredSession;
        soundState.lastIntervalCueCount = isRecoveredSession
          ? getElapsedIntervalCueCount(activeSession, nowMs)
          : 0;
        handledSoundPlaybackMessageKeyRef.current = null;
        setTimerSoundPlaybackMessage(null);
      }

      lastActiveSessionRef.current = activeSession;
      pendingEndedSessionRef.current = activeSession;
      handledTimerOutcomeEndedAtRef.current = null;

      if (!soundState.startHandled) {
        soundState.startHandled = true;
        void attemptTimerSoundPlayback(
          timerSoundPlayerRef.current,
          handledSoundPlaybackMessageKeyRef,
          setTimerSoundPlaybackMessage,
          activeSession.startSound,
          'start'
        );
      }

      // Interval playback follows actual elapsed session milestones so pause/resume and timer drift do not double-fire cues.
      if (activeSession.intervalEnabled && !isPaused) {
        const elapsedIntervalCueCount = getElapsedIntervalCueCount(activeSession, nowMs);
        if (elapsedIntervalCueCount > soundState.lastIntervalCueCount) {
          soundState.lastIntervalCueCount = elapsedIntervalCueCount;
          void attemptTimerSoundPlayback(
            timerSoundPlayerRef.current,
            handledSoundPlaybackMessageKeyRef,
            setTimerSoundPlaybackMessage,
            activeSession.intervalSound,
            'interval'
          );
        }
      }

      if (isRecoveredSession) {
        initialRecoveredActiveSessionIdRef.current = null;
      }

      return;
    }

    soundState.sessionId = null;
    soundState.startHandled = false;
    soundState.lastIntervalCueCount = 0;

    if (!state.lastOutcome) {
      handledTimerOutcomeEndedAtRef.current = null;
      lastActiveSessionRef.current = null;
      pendingEndedSessionRef.current = null;
      return;
    }

    const completedSession = pendingEndedSessionRef.current ?? lastActiveSessionRef.current;
    if (!completedSession || handledTimerOutcomeEndedAtRef.current === state.lastOutcome.endedAt) {
      return;
    }

    handledTimerOutcomeEndedAtRef.current = state.lastOutcome.endedAt;
    pendingEndedSessionRef.current = null;

    if (state.lastOutcome.status === 'completed') {
      notifyTimerCompletion(`Your ${completedSession.meditationType} session has completed.`);
    }

    void attemptTimerSoundPlayback(
      timerSoundPlayerRef.current,
      handledSoundPlaybackMessageKeyRef,
      setTimerSoundPlaybackMessage,
      completedSession.endSound,
      'end'
    );
  }, [activeSessionNowMs, isPaused, state.activeSession, state.lastOutcome]);

  const finalizePlaylistRunSegment = useCallback(
    (status: PlaylistRunOutcome['status'], currentPositionSeconds?: number) => {
      if (!activePlaylistRun) {
        return;
      }

      const nowMs = Date.now();
      const endedAt = new Date(nowMs);

      if (activePlaylistRun.currentSegment.phase === 'gap') {
        if (status === 'completed') {
          const nextRun = completePlaylistRunCurrentSegment(activePlaylistRun, nowMs);
          if (nextRun) {
            setActivePlaylistRun(nextRun);
          }
          return;
        }

        setPlaylistRunOutcome({
          status: 'ended early',
          playlistName: activePlaylistRun.playlistName,
          completedItems: activePlaylistRun.completedItems,
          totalItems: activePlaylistRun.items.length,
          completedDurationSeconds: activePlaylistRun.completedDurationSeconds,
          endedAt: endedAt.toISOString(),
        });
        setActivePlaylistRun(null);
        setIsPlaylistRunPaused(false);
        return;
      }

      const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
      if (!currentItem) {
        return;
      }

      const intendedDurationSeconds = getPlaylistItemDurationSeconds(currentItem);
      const completedCurrentItemSeconds =
        status === 'completed'
          ? intendedDurationSeconds
          : Math.max(0, Math.min(intendedDurationSeconds, Math.round(currentPositionSeconds ?? activePlaylistRun.currentSegment.elapsedSeconds)));

      const completedLog = buildPlaylistItemLogEntry({
        playlistId: activePlaylistRun.playlistId,
        playlistName: activePlaylistRun.playlistName,
        playlistRunId: activePlaylistRun.runId,
        playlistRunStartedAt: activePlaylistRun.runStartedAt,
        item: currentItem,
        itemPosition: activePlaylistRun.currentIndex + 1,
        itemCount: activePlaylistRun.items.length,
        startedAt: activePlaylistRun.currentSegment.startedAt,
        endedAt,
        completedDurationSeconds: completedCurrentItemSeconds,
        status,
      });

      dispatch({ type: 'ADD_SESSION_LOG', payload: completedLog });

      if (status === 'ended early') {
        setPlaylistRunOutcome({
          status: 'ended early',
          playlistName: activePlaylistRun.playlistName,
          completedItems: activePlaylistRun.completedItems,
          totalItems: activePlaylistRun.items.length,
          completedDurationSeconds: activePlaylistRun.completedDurationSeconds + completedCurrentItemSeconds,
          endedAt: endedAt.toISOString(),
        });
        setActivePlaylistRun(null);
        setIsPlaylistRunPaused(false);
        return;
      }

      const nextRun = completePlaylistRunCurrentSegment(activePlaylistRun, nowMs);
      if (!nextRun) {
        setActivePlaylistRun(null);
        setIsPlaylistRunPaused(false);
        setPlaylistRunOutcome({
          status: 'completed',
          playlistName: activePlaylistRun.playlistName,
          completedItems: activePlaylistRun.completedItems + 1,
          totalItems: activePlaylistRun.items.length,
          completedDurationSeconds: activePlaylistRun.completedDurationSeconds + intendedDurationSeconds,
          endedAt: endedAt.toISOString(),
        });
        return;
      }

      setActivePlaylistRun(nextRun);
    },
    [activePlaylistRun]
  );

  useEffect(() => {
    if (!activePlaylistRun || isPlaylistRunPaused) {
      return;
    }

    const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
    if (
      activePlaylistRun.currentSegment.phase === 'item' &&
      currentItem &&
      isAudioBackedPlaylistItem(currentItem)
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const nowMs = Date.now();

      if (activePlaylistRun.currentSegment.phase === 'gap') {
        const remainingSeconds = Math.max(0, Math.ceil((activePlaylistRun.currentSegment.endAtMs - nowMs) / 1000));
        if (remainingSeconds > 0) {
          if (remainingSeconds !== activePlaylistRun.currentSegment.remainingSeconds) {
            setActivePlaylistRun({
              ...activePlaylistRun,
              currentSegment: {
                ...activePlaylistRun.currentSegment,
                remainingSeconds,
              },
            });
          }
          return;
        }

        finalizePlaylistRunSegment('completed');
        return;
      }

      const nextRun = updatePlaylistRunTimedProgress(activePlaylistRun, nowMs);
      if (nextRun.currentSegment.remainingSeconds > 0) {
        if (nextRun.currentSegment.remainingSeconds !== activePlaylistRun.currentSegment.remainingSeconds) {
          setActivePlaylistRun(nextRun);
        }
        return;
      }

      finalizePlaylistRunSegment('completed');
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activePlaylistRun, finalizePlaylistRunSegment, isPlaylistRunPaused]);

  const finalizeCustomPlayRun = useCallback(
    (status: CustomPlayRunOutcome['status'], currentPositionSeconds = activeCustomPlayRun?.currentPositionSeconds ?? 0) => {
      if (!activeCustomPlayRun) {
        return;
      }

      const endedAt = new Date();
      const completedDurationSeconds = Math.max(
        0,
        Math.min(activeCustomPlayRun.durationSeconds, Math.round(currentPositionSeconds))
      );
      const logEntry = buildCustomPlayLogEntry({
        customPlayRun: activeCustomPlayRun,
        endedAt,
        completedDurationSeconds,
        status,
      });

      dispatch({ type: 'ADD_SESSION_LOG', payload: logEntry });
      setCustomPlayRunOutcome({
        status,
        customPlayId: activeCustomPlayRun.customPlayId,
        customPlayName: activeCustomPlayRun.customPlayName,
        completedDurationSeconds: logEntry.completedDurationSeconds,
        endedAt: endedAt.toISOString(),
      });
      setActiveCustomPlayRun(null);
      void attemptTimerSoundPlayback(
        timerSoundPlayerRef.current,
        handledSoundPlaybackMessageKeyRef,
        setCustomPlayRuntimeMessage,
        activeCustomPlayRun.endSound,
        'end'
      );
    },
    [activeCustomPlayRun]
  );

  const value = useMemo<TimerContextValue>(
    () => ({
      settings: state.settings,
      validation: state.validation,
      activeSession: state.activeSession,
      lastOutcome: state.lastOutcome,
      sessionLogs: state.sessionLogs,
      recentLogs: state.sessionLogs.slice(0, 20),
      customPlays,
      playlists,
      lastUsedMeditation,
      activeCustomPlayRun,
      customPlayRunOutcome,
      activePlaylistRun,
      playlistRunOutcome,
      isPaused,
      isPlaylistRunPaused,
      recoveryMessage,
      isSessionLogsLoading,
      isSessionLogSyncing,
      sessionLogSyncError,
      isCustomPlaysLoading,
      isCustomPlaySyncing,
      customPlaySyncError,
      isPlaylistsLoading,
      isPlaylistSyncing,
      playlistSyncError,
      isSettingsLoading,
      isSettingsSyncing,
      settingsSyncError,
      timerSoundPlaybackMessage,
      customPlayRuntimeMessage,
      playlistRuntimeMessage,
      setSettings: (settings) => dispatch({ type: 'SET_SETTINGS', payload: settings }),
      saveCustomPlay: async (draft, editId): Promise<CustomPlaySaveResult> => {
        const validation = validateCustomPlayDraft(draft);
        if (!validation.isValid) {
          return {
            ...validation,
            persisted: false,
          };
        }

        const now = new Date();
        const existingPlay = editId ? customPlays.find((play) => play.id === editId) : null;
        if (editId && !existingPlay) {
          const persistenceError = 'The custom play could not be found for update.';
          setCustomPlaySyncError(persistenceError);
          return {
            ...validation,
            persisted: false,
            persistenceError,
          };
        }

        const candidate = existingPlay ? updateCustomPlay(existingPlay, draft, now) : createCustomPlay(draft, now);
        deletedCustomPlayIdsRef.current.delete(candidate.id);
        setCustomPlays((current) => {
          if (existingPlay) {
            return current.map((play) => (play.id === candidate.id ? candidate : play));
          }

          return mergeCustomPlays([candidate], current);
        });
        mergeQueueEntry(updateQueue, {
          entityType: 'custom-play',
          operation: 'upsert',
          recordId: candidate.id,
          payload: candidate,
        });

        if (!canAttemptBackendSync) {
          setCustomPlaySyncError(buildQueuedSaveMessage(connectionMode, 'custom play'));
        } else {
          setCustomPlaySyncError(null);
        }

        return {
          ...validation,
          persisted: true,
        };
      },
      deleteCustomPlay: async (playId) => {
        if (!customPlays.some((play) => play.id === playId)) {
          return false;
        }

        if (activeCustomPlayRun?.customPlayId === playId) {
          setCustomPlaySyncError('Finish the active custom play before deleting it.');
          return false;
        }

        setCustomPlays((current) => current.filter((play) => play.id !== playId));
        if (lastUsedMeditation?.kind === 'custom-play' && lastUsedMeditation.customPlayId === playId) {
          clearLastUsedMeditationRecord(setLastUsedMeditation);
        }
        mergeQueueEntry(updateQueue, {
          entityType: 'custom-play',
          operation: 'delete',
          recordId: playId,
          payload: null,
        });

        if (!canAttemptBackendSync) {
          setCustomPlaySyncError(buildQueuedDeleteMessage(connectionMode, 'custom play'));
        } else {
          setCustomPlaySyncError(null);
        }

        return true;
      },
      toggleFavoriteCustomPlay: async (playId) => {
        const existingPlay = customPlays.find((play) => play.id === playId);
        if (!existingPlay) {
          return false;
        }

        const candidate = {
          ...existingPlay,
          favorite: !existingPlay.favorite,
          updatedAt: new Date().toISOString(),
        };
        deletedCustomPlayIdsRef.current.delete(candidate.id);
        setCustomPlays((current) => current.map((play) => (play.id === candidate.id ? candidate : play)));
        mergeQueueEntry(updateQueue, {
          entityType: 'custom-play',
          operation: 'upsert',
          recordId: candidate.id,
          payload: candidate,
        });

        if (!canAttemptBackendSync) {
          setCustomPlaySyncError(buildQueuedSaveMessage(connectionMode, 'custom play'));
        } else {
          setCustomPlaySyncError(null);
        }
        return true;
      },
      startCustomPlayRun: (playId): CustomPlayRunStartResult => {
        if (isCustomPlaysLoading) {
          return { started: false, reason: 'custom plays loading' };
        }

        if (state.activeSession) {
          return { started: false, reason: 'timer session active' };
        }

        if (activePlaylistRun) {
          return { started: false, reason: 'playlist run active' };
        }

        if (activeCustomPlayRun) {
          return { started: false, reason: 'custom play run active' };
        }

        const play = customPlays.find((entry) => entry.id === playId);
        if (!play) {
          return { started: false, reason: 'custom play not found' };
        }

        const mediaAsset = resolveCustomPlayMediaAsset(play.mediaAssetId);
        if (!mediaAsset) {
          return { started: false, reason: 'media unavailable' };
        }

        const nowMs = Date.now();
        const startedAt = new Date(nowMs).toISOString();
        timerSoundPlayerRef.current.prepare([play.endSound].filter((label) => label !== play.startSound));
        handledSoundPlaybackMessageKeyRef.current = null;
        setCustomPlayRuntimeMessage(null);
        setCustomPlayRunOutcome(null);
        void attemptTimerSoundPlayback(
          timerSoundPlayerRef.current,
          handledSoundPlaybackMessageKeyRef,
          setCustomPlayRuntimeMessage,
          play.startSound,
          'start'
        );
        recordLastUsedMeditation(setLastUsedMeditation, {
          kind: 'custom-play',
          customPlayId: play.id,
          customPlayName: play.name,
          usedAt: startedAt,
        });
        setActiveCustomPlayRun({
          runId: `${play.id}-${nowMs}`,
          customPlayId: play.id,
          customPlayName: play.name,
          meditationType: play.meditationType,
          recordingLabel: play.recordingLabel,
          mediaAssetId: mediaAsset.id,
          mediaLabel: mediaAsset.label,
          mediaFilePath: mediaAsset.filePath,
          durationSeconds: mediaAsset.durationSeconds,
          startedAt,
          startedAtMs: nowMs,
          currentPositionSeconds: 0,
          isPaused: false,
          startSound: play.startSound,
          endSound: play.endSound,
        });
        return { started: true };
      },
      pauseCustomPlayRun: () => {
        if (!activeCustomPlayRun) {
          return;
        }

        setActiveCustomPlayRun({
          ...activeCustomPlayRun,
          isPaused: true,
        });
      },
      resumeCustomPlayRun: () => {
        if (!activeCustomPlayRun) {
          return;
        }

        setActiveCustomPlayRun({
          ...activeCustomPlayRun,
          isPaused: false,
        });
      },
      updateCustomPlayRunProgress: (currentPositionSeconds) => {
        if (!activeCustomPlayRun) {
          return;
        }

        const nextPositionSeconds = Math.max(0, Math.min(activeCustomPlayRun.durationSeconds, currentPositionSeconds));
        if (Math.abs(nextPositionSeconds - activeCustomPlayRun.currentPositionSeconds) < 0.25) {
          return;
        }

        setActiveCustomPlayRun({
          ...activeCustomPlayRun,
          currentPositionSeconds: nextPositionSeconds,
        });
      },
      completeCustomPlayRun: (currentPositionSeconds) => {
        finalizeCustomPlayRun('completed', currentPositionSeconds);
      },
      endCustomPlayRunEarly: (currentPositionSeconds) => {
        finalizeCustomPlayRun('ended early', currentPositionSeconds);
      },
      clearCustomPlayRunOutcome: () => {
        setCustomPlayRunOutcome(null);
      },
      reportCustomPlayRuntimeIssue: (message) => {
        handledSoundPlaybackMessageKeyRef.current = null;
        setCustomPlayRuntimeMessage(message);
      },
      savePlaylist: async (draft, editId): Promise<PlaylistSaveResult> => {
        const validation = validatePlaylistDraft(draft);
        if (!validation.isValid) {
          return {
            ...validation,
            persisted: false,
          };
        }

        const now = new Date();
        let candidate: Playlist;
        if (editId) {
          const existingPlaylist = playlists.find((playlist) => playlist.id === editId);
          if (!existingPlaylist) {
            const persistenceError = 'That playlist is no longer available.';
            setPlaylistSyncError(persistenceError);
            return {
              ...validation,
              persisted: false,
              persistenceError,
            };
          }

          candidate = updatePlaylist(existingPlaylist, draft, now);
        } else {
          candidate = createPlaylist(draft, now);
        }

        setPlaylists((current) => {
          if (editId) {
            return current.map((playlist) => (playlist.id === candidate.id ? candidate : playlist));
          }

          return mergePlaylists([candidate], current);
        });
        deletedPlaylistIdsRef.current.delete(candidate.id);
        mergeQueueEntry(updateQueue, {
          entityType: 'playlist',
          operation: 'upsert',
          recordId: candidate.id,
          payload: candidate,
        });

        if (!canAttemptBackendSync) {
          setPlaylistSyncError(buildQueuedSaveMessage(connectionMode, 'playlist'));
        } else {
          setPlaylistSyncError(null);
        }

        return {
          ...validation,
          persisted: true,
        };
      },
      deletePlaylist: async (playlistId) => {
        const result = evaluatePlaylistDelete(playlistId, activePlaylistRun);
        if (!result.deleted) {
          return result;
        }

        setPlaylists((current) => current.filter((playlist) => playlist.id !== playlistId));
        if (lastUsedMeditation?.kind === 'playlist' && lastUsedMeditation.playlistId === playlistId) {
          clearLastUsedMeditationRecord(setLastUsedMeditation);
        }
        mergeQueueEntry(updateQueue, {
          entityType: 'playlist',
          operation: 'delete',
          recordId: playlistId,
          payload: null,
        });

        if (!canAttemptBackendSync) {
          setPlaylistSyncError(buildQueuedDeleteMessage(connectionMode, 'playlist'));
        } else {
          setPlaylistSyncError(null);
        }
        return result;
      },
      toggleFavoritePlaylist: async (playlistId) => {
        const existingPlaylist = playlists.find((playlist) => playlist.id === playlistId);
        if (!existingPlaylist) {
          return false;
        }

        const candidate = {
          ...existingPlaylist,
          favorite: !existingPlaylist.favorite,
          updatedAt: new Date().toISOString(),
        };
        deletedPlaylistIdsRef.current.delete(candidate.id);
        setPlaylists((current) => current.map((playlist) => (playlist.id === candidate.id ? candidate : playlist)));
        mergeQueueEntry(updateQueue, {
          entityType: 'playlist',
          operation: 'upsert',
          recordId: candidate.id,
          payload: candidate,
        });

        if (!canAttemptBackendSync) {
          setPlaylistSyncError(buildQueuedSaveMessage(connectionMode, 'playlist'));
        } else {
          setPlaylistSyncError(null);
        }
        return true;
      },
      startPlaylistRun: (playlistId) => {
        const startResult = evaluatePlaylistRunStart({
          playlistId,
          playlists,
          isPlaylistsLoading,
          activeTimerSession: Boolean(state.activeSession),
          activeCustomPlayRun: Boolean(activeCustomPlayRun),
          activePlaylistRun,
        });

        if (!startResult.started) {
          return startResult;
        }

        const playlist = playlists.find((entry) => entry.id === playlistId);
        if (!playlist) {
          return {
            started: false,
            reason: 'playlist not found',
          };
        }

        const nowMs = Date.now();
        const runStartedAt = new Date(nowMs).toISOString();
        const activeRun = buildActivePlaylistRun(playlist, customPlays, nowMs);
        if (!activeRun) {
          return {
            started: false,
            reason: 'playlist item unavailable',
          };
        }

        setPlaylistRunOutcome(null);
        setPlaylistRuntimeMessage(null);
        setIsPlaylistRunPaused(false);
        recordLastUsedMeditation(setLastUsedMeditation, {
          kind: 'playlist',
          playlistId: playlist.id,
          playlistName: playlist.name,
          usedAt: runStartedAt,
        });
        setActivePlaylistRun(activeRun);

        return startResult;
      },
      clearLastUsedMeditation: () => {
        clearLastUsedMeditationRecord(setLastUsedMeditation);
      },
      pausePlaylistRun: () => {
        if (!activePlaylistRun) {
          return;
        }

        setActivePlaylistRun(pauseActivePlaylistRun(activePlaylistRun, Date.now()));
        setIsPlaylistRunPaused(true);
      },
      resumePlaylistRun: () => {
        if (!activePlaylistRun) {
          return;
        }

        setPlaylistRuntimeMessage(null);
        setActivePlaylistRun(resumeActivePlaylistRun(activePlaylistRun, Date.now()));
        setIsPlaylistRunPaused(false);
      },
      updatePlaylistRunProgress: (currentPositionSeconds) => {
        if (!activePlaylistRun || activePlaylistRun.currentSegment.phase !== 'item') {
          return;
        }

        const currentItem = getPlaylistRunCurrentItem(activePlaylistRun);
        if (!currentItem || !isAudioBackedPlaylistItem(currentItem)) {
          return;
        }

        setActivePlaylistRun(updatePlaylistRunAudioProgress(activePlaylistRun, currentPositionSeconds));
      },
      completePlaylistRunCurrentItem: (currentPositionSeconds) => {
        finalizePlaylistRunSegment('completed', currentPositionSeconds);
      },
      endPlaylistRunEarly: () => {
        if (!activePlaylistRun) {
          return;
        }

        finalizePlaylistRunSegment('ended early');
      },
      clearPlaylistRunOutcome: () => setPlaylistRunOutcome(null),
      reportPlaylistRuntimeIssue: (message) => {
        setPlaylistRuntimeMessage(message);
      },
      addManualLog: async (input): Promise<ManualLogSaveResult> => {
        const validation = validateManualLogInput(input);
        if (!validation.isValid) {
          return {
            ...validation,
            persisted: false,
          };
        }

        const queuedEntry = buildManualLogEntry(input, new Date());
        dispatch({
          type: 'ADD_SESSION_LOG',
          payload: queuedEntry,
        });
        mergeQueueEntry(updateQueue, {
          entityType: 'session-log',
          operation: 'upsert',
          recordId: queuedEntry.id,
          payload: queuedEntry,
        });

        if (!canAttemptBackendSync) {
          setSessionLogSyncError(buildQueuedSaveMessage(connectionMode, 'manual log'));
        } else {
          setSessionLogSyncError(null);
        }

        return {
          ...validation,
          persisted: true,
        };
      },
      canChangeSessionLogMeditationType: (entry) => canChangeSessionLogMeditationType(entry),
      updateSessionLogMeditationType: (entry, meditationType) => {
        if (!canChangeSessionLogMeditationType(entry)) {
          return {
            updated: false,
            feedbackMessage: 'Meditation type can be changed only for manual logs.',
          };
        }

        const latestEntry = latestSessionLogsRef.current.find((candidate) => candidate.id === entry.id);
        if (!latestEntry) {
          return {
            updated: false,
            feedbackMessage: 'That manual log is no longer available.',
          };
        }

        const updatedEntry = applySessionLogMeditationTypeUpdate(latestEntry, meditationType);
        const nextSessionLogs = mergeSessionLogs([updatedEntry], latestSessionLogsRef.current);
        dispatch({
          type: 'REPLACE_SESSION_LOGS',
          payload: nextSessionLogs,
        });
        mergeQueueEntry(updateQueue, {
          entityType: 'session-log',
          operation: 'upsert',
          recordId: updatedEntry.id,
          payload: updatedEntry,
        });

        if (!canAttemptBackendSync) {
          setSessionLogSyncError(buildQueuedSaveMessage(connectionMode, 'manual log change'));
        } else {
          setSessionLogSyncError(null);
        }

        return {
          updated: true,
          feedbackMessage: 'Meditation type updated for the manual log.',
        };
      },
      startSession: (settingsOverride) => {
        if (activePlaylistRun || activeCustomPlayRun) {
          return false;
        }

        const nextSettings = settingsOverride ?? state.settings;
        const validation = validateTimerSettings(nextSettings);
        if (!validation.isValid || !nextSettings.meditationType) {
          return false;
        }

        const nowMs = Date.now();
        const startedAt = new Date(nowMs).toISOString();
        const preparedLabels = [...new Set([nextSettings.intervalSound, nextSettings.endSound])]
          .filter((label) => label !== nextSettings.startSound);
        timerSoundPlayerRef.current.prepare(preparedLabels);
        activeSessionSoundStateRef.current.sessionId = startedAt;
        activeSessionSoundStateRef.current.startHandled = true;
        activeSessionSoundStateRef.current.lastIntervalCueCount = 0;
        handledSoundPlaybackMessageKeyRef.current = null;
        setTimerSoundPlaybackMessage(null);
        void attemptTimerSoundPlayback(
          timerSoundPlayerRef.current,
          handledSoundPlaybackMessageKeyRef,
          setTimerSoundPlaybackMessage,
          nextSettings.startSound,
          'start'
        );
        recordLastUsedMeditation(setLastUsedMeditation, {
          kind: 'timer',
          settings: nextSettings,
          usedAt: startedAt,
        });
        dispatch({ type: 'START_SESSION', nowMs, settings: nextSettings });
        return true;
      },
      pauseSession: () => {
        dispatch({ type: 'PAUSE_SESSION', nowMs: Date.now() });
      },
      resumeSession: () => {
        dispatch({ type: 'RESUME_SESSION', nowMs: Date.now() });
      },
      endSessionEarly: () => {
        pendingEndedSessionRef.current = state.activeSession;
        dispatch({ type: 'END_EARLY', nowMs: Date.now() });
      },
      clearOutcome: () => dispatch({ type: 'CLEAR_OUTCOME' }),
      clearTimerSoundPlaybackMessage: () => {
        handledSoundPlaybackMessageKeyRef.current = null;
        setTimerSoundPlaybackMessage(null);
      },
      clearCustomPlayRuntimeMessage: () => {
        handledSoundPlaybackMessageKeyRef.current = null;
        setCustomPlayRuntimeMessage(null);
      },
      clearPlaylistRuntimeMessage: () => {
        setPlaylistRuntimeMessage(null);
      },
      clearRecoveryMessage: () => setRecoveryMessage(null),
    }),
    [
      activeCustomPlayRun,
      activePlaylistRun,
      canAttemptBackendSync,
      connectionMode,
      customPlays,
      customPlayRunOutcome,
      customPlayRuntimeMessage,
      customPlaySyncError,
      finalizeCustomPlayRun,
      finalizePlaylistRunSegment,
      isPaused,
      isCustomPlaysLoading,
      isCustomPlaySyncing,
      isPlaylistsLoading,
      isPlaylistSyncing,
      isPlaylistRunPaused,
      isSessionLogsLoading,
      isSessionLogSyncing,
      isSettingsLoading,
      isSettingsSyncing,
      lastUsedMeditation,
      playlistRuntimeMessage,
      playlistRunOutcome,
      playlists,
      playlistSyncError,
      recoveryMessage,
      sessionLogSyncError,
      settingsSyncError,
      state,
      timerSoundPlaybackMessage,
      updateQueue,
    ]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
