import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { CustomPlay } from '../../types/customPlay';
import type { ActivePlaylistRun, Playlist, PlaylistRunOutcome } from '../../types/playlist';
import type { SessionLog } from '../../types/sessionLog';
import type { ActiveSession, TimerSettings } from '../../types/timer';
import { createCustomPlay, updateCustomPlay, validateCustomPlayDraft } from '../../utils/customPlay';
import { isApiClientError } from '../../utils/apiClient';
import { buildManualLogCreateRequest, type ManualLogSaveResult, validateManualLogInput } from '../../utils/manualLog';
import { createPlaylist, updatePlaylist, validatePlaylistDraft } from '../../utils/playlist';
import { persistPlaylistsToApi } from '../../utils/playlistApi';
import { buildPlaylistItemLogEntry } from '../../utils/playlistLog';
import { evaluatePlaylistDelete, evaluatePlaylistRunStart } from '../../utils/playlistRunPolicy';
import { createManualSessionLogInApi, listSessionLogsFromApi, persistSessionLogToApi } from '../../utils/sessionLogApi';
import {
  loadActivePlaylistRunState,
  loadActiveTimerState,
  loadCustomPlays,
  loadPlaylists,
  loadSessionLogs,
  loadTimerSettings,
  saveActivePlaylistRunState,
  saveActiveTimerState,
  saveCustomPlays,
  saveSessionLogs,
  saveTimerSettings,
} from '../../utils/storage';
import {
  areTimerSettingsEqual,
  loadTimerSettingsFromApi,
  persistTimerSettingsToApi,
} from '../../utils/timerSettingsApi';
import { defaultTimerSettings } from './constants';
import { createInitialTimerState, timerReducer } from './timerReducer';
import { TimerContext, type TimerContextValue } from './timerContextObject';

interface TimerHydration {
  readonly activeSession: ActiveSession | null;
  readonly isPaused: boolean;
  readonly activePlaylistRun: ActivePlaylistRun | null;
  readonly isPlaylistRunPaused: boolean;
  readonly recoveryMessage: string | null;
}

interface TimerBootstrap {
  readonly settings: TimerSettings;
  readonly sessionLogs: ReturnType<typeof loadSessionLogs>;
  readonly customPlays: ReturnType<typeof loadCustomPlays>;
  readonly playlists: ReturnType<typeof loadPlaylists>;
  readonly hydration: TimerHydration;
  readonly skipInitialActiveTimerPersist: boolean;
  readonly skipInitialActivePlaylistPersist: boolean;
}

function serializeActiveTimerPersistence(activeSession: ActiveSession | null, isPaused: boolean): string {
  return activeSession
    ? JSON.stringify({
        activeSession,
        isPaused,
      })
    : 'null';
}

function serializeActivePlaylistPersistence(activePlaylistRun: ActivePlaylistRun | null, isPaused: boolean): string {
  return activePlaylistRun
    ? JSON.stringify({
        activePlaylistRun,
        isPaused,
      })
    : 'null';
}

function recoverActiveSession(
  storedActiveSession: ActiveSession | null,
  isPaused: boolean,
  nowMs: number
): { readonly activeSession: ActiveSession | null; readonly recoveryMessage: string | null } {
  if (!storedActiveSession) {
    return {
      activeSession: null,
      recoveryMessage: null,
    };
  }

  if (isPaused) {
    return {
      activeSession: storedActiveSession,
      recoveryMessage: 'Recovered an active timer from your previous app state.',
    };
  }

  const remainingSeconds = Math.ceil((storedActiveSession.endAtMs - nowMs) / 1000);
  if (remainingSeconds <= 0) {
    return {
      activeSession: null,
      recoveryMessage: 'Your previous active timer was cleared because it could not be safely resumed.',
    };
  }

  return {
    activeSession: {
      ...storedActiveSession,
      remainingSeconds,
    },
    recoveryMessage: 'Recovered an active timer from your previous app state.',
  };
}

function recoverActivePlaylistRun(
  storedActivePlaylistRun: ActivePlaylistRun | null,
  isPaused: boolean,
  nowMs: number
): { readonly activePlaylistRun: ActivePlaylistRun | null; readonly recoveryMessage: string | null } {
  if (!storedActivePlaylistRun) {
    return {
      activePlaylistRun: null,
      recoveryMessage: null,
    };
  }

  if (isPaused) {
    return {
      activePlaylistRun: storedActivePlaylistRun,
      recoveryMessage: 'Recovered an active playlist run from your previous app state.',
    };
  }

  const remainingSeconds = Math.ceil((storedActivePlaylistRun.currentItemEndAtMs - nowMs) / 1000);
  if (remainingSeconds <= 0) {
    return {
      activePlaylistRun: null,
      recoveryMessage: 'Your previous playlist run was cleared because it could not be safely resumed.',
    };
  }

  return {
    activePlaylistRun: {
      ...storedActivePlaylistRun,
      currentItemRemainingSeconds: remainingSeconds,
    },
    recoveryMessage: 'Recovered an active playlist run from your previous app state.',
  };
}

function createTimerHydration(
  storedTimerState: ReturnType<typeof loadActiveTimerState>,
  storedPlaylistRunState: ReturnType<typeof loadActivePlaylistRunState>,
  nowMs: number
): TimerHydration {
  const timerRecovery = recoverActiveSession(storedTimerState?.activeSession ?? null, storedTimerState?.isPaused ?? false, nowMs);
  const playlistRecovery = recoverActivePlaylistRun(
    storedPlaylistRunState?.activePlaylistRun ?? null,
    storedPlaylistRunState?.isPaused ?? false,
    nowMs
  );

  return {
    activeSession: timerRecovery.activeSession,
    isPaused: timerRecovery.activeSession ? (storedTimerState?.isPaused ?? false) : false,
    activePlaylistRun: playlistRecovery.activePlaylistRun,
    isPlaylistRunPaused: playlistRecovery.activePlaylistRun ? (storedPlaylistRunState?.isPaused ?? false) : false,
    recoveryMessage: timerRecovery.recoveryMessage ?? playlistRecovery.recoveryMessage,
  };
}

function createTimerBootstrap(nowMs: number): TimerBootstrap {
  const settings = loadTimerSettings() ?? defaultTimerSettings;
  const sessionLogs = loadSessionLogs();
  const customPlays = loadCustomPlays();
  const playlists = loadPlaylists();
  const storedTimerState = loadActiveTimerState();
  const storedPlaylistRunState = loadActivePlaylistRunState();
  const hydration = createTimerHydration(storedTimerState, storedPlaylistRunState, nowMs);

  return {
    settings,
    sessionLogs,
    customPlays,
    playlists,
    hydration,
    skipInitialActiveTimerPersist:
      serializeActiveTimerPersistence(hydration.activeSession, hydration.isPaused) ===
      serializeActiveTimerPersistence(storedTimerState?.activeSession ?? null, storedTimerState?.isPaused ?? false),
    skipInitialActivePlaylistPersist:
      serializeActivePlaylistPersistence(hydration.activePlaylistRun, hydration.isPlaylistRunPaused) ===
      serializeActivePlaylistPersistence(
        storedPlaylistRunState?.activePlaylistRun ?? null,
        storedPlaylistRunState?.isPaused ?? false
      ),
  };
}

function mergeSessionLogs(primary: readonly SessionLog[], secondary: readonly SessionLog[]) {
  const entriesById = new Map<string, SessionLog>();

  for (const entry of primary) {
    entriesById.set(entry.id, entry);
  }

  for (const entry of secondary) {
    if (!entriesById.has(entry.id)) {
      entriesById.set(entry.id, entry);
    }
  }

  return [...entriesById.values()].sort((left, right) => Date.parse(right.endedAt) - Date.parse(left.endedAt));
}

function formatApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (isApiClientError(error)) {
    if (error.kind === 'network') {
      return 'The backend could not be reached right now.';
    }

    if (error.detail && error.detail.trim().length > 0) {
      return error.detail.trim();
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

function areSessionLogCollectionsEqual(left: readonly SessionLog[], right: readonly SessionLog[]) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function TimerProvider({ children }: { readonly children: ReactNode }) {
  const [bootstrap] = useState<TimerBootstrap>(() => createTimerBootstrap(Date.now()));
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
  const [isPaused, setIsPaused] = useState(bootstrap.hydration.isPaused);
  const [customPlays, setCustomPlays] = useState<CustomPlay[]>(bootstrap.customPlays);
  const [playlists, setPlaylists] = useState<Playlist[]>(bootstrap.playlists);
  const [activePlaylistRun, setActivePlaylistRun] = useState<ActivePlaylistRun | null>(bootstrap.hydration.activePlaylistRun);
  const [playlistRunOutcome, setPlaylistRunOutcome] = useState<PlaylistRunOutcome | null>(null);
  const [isPlaylistRunPaused, setIsPlaylistRunPaused] = useState(bootstrap.hydration.isPlaylistRunPaused);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(bootstrap.hydration.recoveryMessage);
  const [isSessionLogsLoading, setIsSessionLogsLoading] = useState(true);
  const [isSessionLogSyncing, setIsSessionLogSyncing] = useState(false);
  const [sessionLogSyncError, setSessionLogSyncError] = useState<string | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSettingsSyncing, setIsSettingsSyncing] = useState(false);
  const [settingsSyncError, setSettingsSyncError] = useState<string | null>(null);
  const latestSessionLogsRef = useRef(state.sessionLogs);
  const latestTimerSettingsRef = useRef(state.settings);
  const skipInitialTimerSettingsPersistRef = useRef(true);
  const skipInitialSessionLogsPersistRef = useRef(true);
  const skipInitialCustomPlaysPersistRef = useRef(true);
  const skipInitialPlaylistsPersistRef = useRef(true);
  const skipInitialActiveTimerPersistRef = useRef(bootstrap.skipInitialActiveTimerPersist);
  const skipInitialActivePlaylistPersistRef = useRef(bootstrap.skipInitialActivePlaylistPersist);
  const remoteSessionLogsHydratedRef = useRef(false);
  const syncedSessionLogIdsRef = useRef<Set<string>>(new Set());
  const remoteSettingsHydratedRef = useRef(false);
  const lastPersistedTimerSettingsRef = useRef<TimerSettings | null>(null);
  const activeSessionStartedAt = state.activeSession?.startedAt ?? null;
  const activeSessionStartedAtMs = state.activeSession?.startedAtMs ?? null;
  const activeSessionIntendedDurationSeconds = state.activeSession?.intendedDurationSeconds ?? null;
  const activeSessionMeditationType = state.activeSession?.meditationType ?? null;
  const activeSessionStartSound = state.activeSession?.startSound ?? null;
  const activeSessionEndSound = state.activeSession?.endSound ?? null;
  const activeSessionIntervalEnabled = state.activeSession?.intervalEnabled ?? null;
  const activeSessionIntervalMinutes = state.activeSession?.intervalMinutes ?? null;
  const activeSessionIntervalSound = state.activeSession?.intervalSound ?? null;
  const activeSessionRemainingSeconds = state.activeSession?.remainingSeconds ?? null;
  const activeSessionEndAtMs = state.activeSession?.endAtMs ?? null;
  const isRecoveredRunningTimer =
    !isPaused &&
    activeSessionStartedAt !== null &&
    bootstrap.hydration.activeSession?.startedAt === activeSessionStartedAt &&
    bootstrap.hydration.activeSession?.endAtMs === activeSessionEndAtMs;
  const persistedTimerRemainingSeconds = activeSessionStartedAt
    ? isPaused || isRecoveredRunningTimer
      ? activeSessionRemainingSeconds
      : activeSessionIntendedDurationSeconds
    : null;
  const activeTimerPersistence = useMemo(
    () =>
      activeSessionStartedAt &&
      activeSessionStartedAtMs !== null &&
      activeSessionIntendedDurationSeconds !== null &&
      activeSessionMeditationType !== null &&
      activeSessionStartSound !== null &&
      activeSessionEndSound !== null &&
      activeSessionIntervalEnabled !== null &&
      activeSessionIntervalMinutes !== null &&
      activeSessionIntervalSound !== null &&
      activeSessionEndAtMs !== null &&
      persistedTimerRemainingSeconds !== null
        ? {
            activeSession: {
              startedAt: activeSessionStartedAt,
              startedAtMs: activeSessionStartedAtMs,
              intendedDurationSeconds: activeSessionIntendedDurationSeconds,
              remainingSeconds: persistedTimerRemainingSeconds,
              meditationType: activeSessionMeditationType,
              startSound: activeSessionStartSound,
              endSound: activeSessionEndSound,
              intervalEnabled: activeSessionIntervalEnabled,
              intervalMinutes: activeSessionIntervalMinutes,
              intervalSound: activeSessionIntervalSound,
              endAtMs: activeSessionEndAtMs,
            } satisfies ActiveSession,
            isPaused,
          }
        : null,
    [
      isPaused,
      activeSessionStartedAt,
      activeSessionStartedAtMs,
      activeSessionIntendedDurationSeconds,
      activeSessionMeditationType,
      activeSessionStartSound,
      activeSessionEndSound,
      activeSessionIntervalEnabled,
      activeSessionIntervalMinutes,
      activeSessionIntervalSound,
      persistedTimerRemainingSeconds,
      activeSessionEndAtMs,
    ]
  );
  const activePlaylistRunId = activePlaylistRun?.runId ?? null;
  const activePlaylistId = activePlaylistRun?.playlistId ?? null;
  const activePlaylistName = activePlaylistRun?.playlistName ?? null;
  const activePlaylistRunStartedAt = activePlaylistRun?.runStartedAt ?? null;
  const activePlaylistItems = activePlaylistRun?.items ?? null;
  const activePlaylistCurrentIndex = activePlaylistRun?.currentIndex ?? null;
  const activePlaylistCurrentItemStartedAt = activePlaylistRun?.currentItemStartedAt ?? null;
  const activePlaylistCurrentItemStartedAtMs = activePlaylistRun?.currentItemStartedAtMs ?? null;
  const activePlaylistCurrentItemRemainingSeconds = activePlaylistRun?.currentItemRemainingSeconds ?? null;
  const activePlaylistCurrentItemEndAtMs = activePlaylistRun?.currentItemEndAtMs ?? null;
  const activePlaylistCompletedItems = activePlaylistRun?.completedItems ?? null;
  const activePlaylistCompletedDurationSeconds = activePlaylistRun?.completedDurationSeconds ?? null;
  const activePlaylistTotalIntendedDurationSeconds = activePlaylistRun?.totalIntendedDurationSeconds ?? null;
  const isRecoveredRunningPlaylist =
    !isPlaylistRunPaused &&
    activePlaylistRunId !== null &&
    bootstrap.hydration.activePlaylistRun?.runId === activePlaylistRunId &&
    bootstrap.hydration.activePlaylistRun?.currentItemEndAtMs === activePlaylistCurrentItemEndAtMs;
  const persistedPlaylistRemainingSeconds = activePlaylistRunId
    ? isPlaylistRunPaused || isRecoveredRunningPlaylist
      ? activePlaylistCurrentItemRemainingSeconds
      : Math.round(((activePlaylistItems?.[activePlaylistCurrentIndex ?? 0]?.durationMinutes) ?? 0) * 60)
    : null;
  const activePlaylistPersistence = useMemo(
    () =>
      activePlaylistRunId &&
      activePlaylistId !== null &&
      activePlaylistName !== null &&
      activePlaylistRunStartedAt !== null &&
      activePlaylistItems !== null &&
      activePlaylistCurrentIndex !== null &&
      activePlaylistCurrentItemStartedAt !== null &&
      activePlaylistCurrentItemStartedAtMs !== null &&
      persistedPlaylistRemainingSeconds !== null &&
      activePlaylistCurrentItemEndAtMs !== null &&
      activePlaylistCompletedItems !== null &&
      activePlaylistCompletedDurationSeconds !== null &&
      activePlaylistTotalIntendedDurationSeconds !== null
        ? {
            activePlaylistRun: {
              runId: activePlaylistRunId,
              playlistId: activePlaylistId,
              playlistName: activePlaylistName,
              runStartedAt: activePlaylistRunStartedAt,
              items: activePlaylistItems,
              currentIndex: activePlaylistCurrentIndex,
              currentItemStartedAt: activePlaylistCurrentItemStartedAt,
              currentItemStartedAtMs: activePlaylistCurrentItemStartedAtMs,
              currentItemRemainingSeconds: persistedPlaylistRemainingSeconds,
              currentItemEndAtMs: activePlaylistCurrentItemEndAtMs,
              completedItems: activePlaylistCompletedItems,
              completedDurationSeconds: activePlaylistCompletedDurationSeconds,
              totalIntendedDurationSeconds: activePlaylistTotalIntendedDurationSeconds,
            } satisfies ActivePlaylistRun,
            isPaused: isPlaylistRunPaused,
          }
        : null,
    [
      activePlaylistRunId,
      activePlaylistId,
      activePlaylistName,
      activePlaylistRunStartedAt,
      activePlaylistItems,
      activePlaylistCurrentIndex,
      activePlaylistCurrentItemStartedAt,
      activePlaylistCurrentItemStartedAtMs,
      persistedPlaylistRemainingSeconds,
      activePlaylistCurrentItemEndAtMs,
      activePlaylistCompletedItems,
      activePlaylistCompletedDurationSeconds,
      activePlaylistTotalIntendedDurationSeconds,
      isPlaylistRunPaused,
    ]
  );

  useEffect(() => {
    latestSessionLogsRef.current = state.sessionLogs;
  }, [state.sessionLogs]);

  useEffect(() => {
    latestTimerSettingsRef.current = state.settings;
  }, [state.settings]);

  useEffect(() => {
    if (!state.activeSession) {
      setIsPaused(false);
    }
  }, [state.activeSession]);

  useEffect(() => {
    if (!activePlaylistRun) {
      setIsPlaylistRunPaused(false);
    }
  }, [activePlaylistRun]);

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

    void persistPlaylistsToApi(playlists);
  }, [playlists]);

  useEffect(() => {
    if (skipInitialActiveTimerPersistRef.current) {
      skipInitialActiveTimerPersistRef.current = false;
      return;
    }

    saveActiveTimerState(activeTimerPersistence?.activeSession ?? null, activeTimerPersistence?.isPaused ?? false);
  }, [activeTimerPersistence]);

  useEffect(() => {
    if (skipInitialActivePlaylistPersistRef.current) {
      skipInitialActivePlaylistPersistRef.current = false;
      return;
    }

    saveActivePlaylistRunState(
      activePlaylistPersistence?.activePlaylistRun ?? null,
      activePlaylistPersistence?.isPaused ?? false
    );
  }, [activePlaylistPersistence]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSessionLogs() {
      setIsSessionLogsLoading(true);

      try {
        const remoteSessionLogs = await listSessionLogsFromApi();
        if (cancelled) {
          return;
        }

        syncedSessionLogIdsRef.current = new Set(remoteSessionLogs.map((entry) => entry.id));
        const mergedSessionLogs = mergeSessionLogs(remoteSessionLogs, latestSessionLogsRef.current);
        if (!areSessionLogCollectionsEqual(mergedSessionLogs, latestSessionLogsRef.current)) {
          dispatch({
            type: 'REPLACE_SESSION_LOGS',
            payload: mergedSessionLogs,
          });
        }
        setSessionLogSyncError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        syncedSessionLogIdsRef.current = new Set();
        setSessionLogSyncError(
          `${formatApiErrorMessage(error, 'Session log loading failed.')} Showing the local session log cache instead.`
        );
      } finally {
        if (!cancelled) {
          remoteSessionLogsHydratedRef.current = true;
          setIsSessionLogsLoading(false);
        }
      }
    }

    void hydrateSessionLogs();

    return () => {
      cancelled = true;
    };
  }, [bootstrap.sessionLogs]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateTimerSettings() {
      setIsSettingsLoading(true);

      try {
        const remoteSettings = await loadTimerSettingsFromApi();
        if (cancelled) {
          return;
        }

        lastPersistedTimerSettingsRef.current = remoteSettings;

        const shouldPromoteBootstrapSettings =
          !areTimerSettingsEqual(latestTimerSettingsRef.current, defaultTimerSettings) &&
          areTimerSettingsEqual(remoteSettings, defaultTimerSettings);

        if (shouldPromoteBootstrapSettings) {
          lastPersistedTimerSettingsRef.current = latestTimerSettingsRef.current;
          void persistTimerSettingsToApi(latestTimerSettingsRef.current).catch((error) => {
            if (cancelled) {
              return;
            }

            setSettingsSyncError(
              `${formatApiErrorMessage(error, 'Timer settings could not be saved to the backend.')} Using the local timer settings cache for now.`
            );
          });
        } else {
          if (!areTimerSettingsEqual(remoteSettings, latestTimerSettingsRef.current)) {
            dispatch({ type: 'SET_SETTINGS', payload: remoteSettings });
          }
        }

        setSettingsSyncError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        lastPersistedTimerSettingsRef.current = latestTimerSettingsRef.current;
        setSettingsSyncError(
          `${formatApiErrorMessage(error, 'Timer settings could not load from the backend.')} Using the local timer settings cache for now.`
        );
      } finally {
        if (!cancelled) {
          remoteSettingsHydratedRef.current = true;
          setIsSettingsLoading(false);
        }
      }
    }

    void hydrateTimerSettings();

    return () => {
      cancelled = true;
    };
  }, [bootstrap.settings]);

  useEffect(() => {
    if (!remoteSettingsHydratedRef.current) {
      return;
    }

    if (!state.validation.isValid) {
      return;
    }

    if (lastPersistedTimerSettingsRef.current && areTimerSettingsEqual(lastPersistedTimerSettingsRef.current, state.settings)) {
      return;
    }

    let cancelled = false;

    async function persistSettings() {
      setIsSettingsSyncing(true);

      try {
        setSettingsSyncError(null);
        const savedSettings = await persistTimerSettingsToApi(state.settings);
        if (cancelled) {
          return;
        }

        lastPersistedTimerSettingsRef.current = savedSettings;
        setSettingsSyncError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSettingsSyncError(
          `${formatApiErrorMessage(error, 'Timer settings could not be saved to the backend.')} Local timer settings remain available in this browser.`
        );
      } finally {
        if (!cancelled) {
          setIsSettingsSyncing(false);
        }
      }
    }

    void persistSettings();

    return () => {
      cancelled = true;
    };
  }, [state.settings, state.validation.isValid]);

  useEffect(() => {
    if (!remoteSessionLogsHydratedRef.current) {
      return;
    }

    const unsyncedSessionLogs = state.sessionLogs.filter((entry) => !syncedSessionLogIdsRef.current.has(entry.id));

    if (unsyncedSessionLogs.length === 0) {
      setIsSessionLogSyncing(false);
      return;
    }

    let cancelled = false;

    async function syncSessionLogs() {
      setIsSessionLogSyncing(true);

      try {
        for (const entry of unsyncedSessionLogs) {
          const savedEntry = await persistSessionLogToApi(entry);
          if (cancelled) {
            return;
          }

          syncedSessionLogIdsRef.current.add(savedEntry.id);
        }

        setSessionLogSyncError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSessionLogSyncError(
          `${formatApiErrorMessage(error, 'Session log sync failed.')} The latest session log is still visible locally in this browser.`
        );
      } finally {
        if (!cancelled) {
          setIsSessionLogSyncing(false);
        }
      }
    }

    void syncSessionLogs();

    return () => {
      cancelled = true;
    };
  }, [state.sessionLogs]);

  useEffect(() => {
    if (!state.activeSession || isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      dispatch({ type: 'SYNC_TICK', nowMs: Date.now() });
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [state.activeSession, isPaused]);

  useEffect(() => {
    if (!activePlaylistRun || isPlaylistRunPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      const nowMs = Date.now();
      const currentItem = activePlaylistRun.items[activePlaylistRun.currentIndex];
      if (!currentItem) {
        return;
      }

      const remainingSeconds = Math.max(0, Math.ceil((activePlaylistRun.currentItemEndAtMs - nowMs) / 1000));

      if (remainingSeconds > 0) {
        if (remainingSeconds !== activePlaylistRun.currentItemRemainingSeconds) {
          setActivePlaylistRun({
            ...activePlaylistRun,
            currentItemRemainingSeconds: remainingSeconds,
          });
        }
        return;
      }

      const intendedDurationSeconds = Math.round(currentItem.durationMinutes * 60);
      const completedLog = buildPlaylistItemLogEntry({
        playlistId: activePlaylistRun.playlistId,
        playlistName: activePlaylistRun.playlistName,
        playlistRunId: activePlaylistRun.runId,
        playlistRunStartedAt: activePlaylistRun.runStartedAt,
        item: currentItem,
        itemPosition: activePlaylistRun.currentIndex + 1,
        itemCount: activePlaylistRun.items.length,
        startedAt: activePlaylistRun.currentItemStartedAt,
        endedAt: new Date(nowMs),
        completedDurationSeconds: intendedDurationSeconds,
        status: 'completed',
      });

      dispatch({ type: 'ADD_SESSION_LOG', payload: completedLog });

      const completedItems = activePlaylistRun.completedItems + 1;
      const completedDurationSeconds = activePlaylistRun.completedDurationSeconds + intendedDurationSeconds;
      const nextIndex = activePlaylistRun.currentIndex + 1;

      if (nextIndex >= activePlaylistRun.items.length) {
        setActivePlaylistRun(null);
        setIsPlaylistRunPaused(false);
        setPlaylistRunOutcome({
          status: 'completed',
          playlistName: activePlaylistRun.playlistName,
          completedItems,
          totalItems: activePlaylistRun.items.length,
          completedDurationSeconds,
          endedAt: new Date(nowMs).toISOString(),
        });
        return;
      }

      const nextItem = activePlaylistRun.items[nextIndex];
      if (!nextItem) {
        return;
      }
      const nextDurationSeconds = Math.round(nextItem.durationMinutes * 60);

      setActivePlaylistRun({
        ...activePlaylistRun,
        currentIndex: nextIndex,
        currentItemStartedAt: new Date(nowMs).toISOString(),
        currentItemStartedAtMs: nowMs,
        currentItemRemainingSeconds: nextDurationSeconds,
        currentItemEndAtMs: nowMs + nextDurationSeconds * 1000,
        completedItems,
        completedDurationSeconds,
      });
    }, 500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activePlaylistRun, isPlaylistRunPaused]);

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
      activePlaylistRun,
      playlistRunOutcome,
      isPaused,
      isPlaylistRunPaused,
      recoveryMessage,
      isSessionLogsLoading,
      isSessionLogSyncing,
      sessionLogSyncError,
      isSettingsLoading,
      isSettingsSyncing,
      settingsSyncError,
      setSettings: (settings) => dispatch({ type: 'SET_SETTINGS', payload: settings }),
      saveCustomPlay: (draft, editId) => {
        const validation = validateCustomPlayDraft(draft);
        if (!validation.isValid) {
          return validation;
        }

        setCustomPlays((current) => {
          if (editId) {
            return current.map((play) => (play.id === editId ? updateCustomPlay(play, draft, new Date()) : play));
          }

          return [createCustomPlay(draft, new Date()), ...current];
        });

        return validation;
      },
      deleteCustomPlay: (playId) =>
        setCustomPlays((current) => current.filter((play) => play.id !== playId)),
      toggleFavoriteCustomPlay: (playId) =>
        setCustomPlays((current) =>
          current.map((play) =>
            play.id === playId
              ? {
                  ...play,
                  favorite: !play.favorite,
                  updatedAt: new Date().toISOString(),
                }
              : play
          )
        ),
      savePlaylist: (draft, editId) => {
        const validation = validatePlaylistDraft(draft);
        if (!validation.isValid) {
          return validation;
        }

        setPlaylists((current) => {
          if (editId) {
            return current.map((playlist) => (playlist.id === editId ? updatePlaylist(playlist, draft, new Date()) : playlist));
          }

          return [createPlaylist(draft, new Date()), ...current];
        });

        return validation;
      },
      deletePlaylist: (playlistId) => {
        const result = evaluatePlaylistDelete(playlistId, activePlaylistRun);
        if (!result.deleted) {
          return result;
        }

        setPlaylists((current) => current.filter((playlist) => playlist.id !== playlistId));
        return result;
      },
      toggleFavoritePlaylist: (playlistId) =>
        setPlaylists((current) =>
          current.map((playlist) =>
            playlist.id === playlistId
              ? {
                  ...playlist,
                  favorite: !playlist.favorite,
                  updatedAt: new Date().toISOString(),
                }
              : playlist
          )
        ),
      startPlaylistRun: (playlistId) => {
        const startResult = evaluatePlaylistRunStart({
          playlistId,
          playlists,
          activeTimerSession: Boolean(state.activeSession),
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
        const firstItem = playlist.items[0];
        if (!firstItem) {
          return {
            started: false,
            reason: 'playlist has no items',
          };
        }
        const firstDurationSeconds = Math.round(firstItem.durationMinutes * 60);

        setPlaylistRunOutcome(null);
        setIsPlaylistRunPaused(false);
        setActivePlaylistRun({
          runId: `${playlist.id}-${nowMs}`,
          playlistId: playlist.id,
          playlistName: playlist.name,
          runStartedAt,
          items: playlist.items,
          currentIndex: 0,
          currentItemStartedAt: runStartedAt,
          currentItemStartedAtMs: nowMs,
          currentItemRemainingSeconds: firstDurationSeconds,
          currentItemEndAtMs: nowMs + firstDurationSeconds * 1000,
          completedItems: 0,
          completedDurationSeconds: 0,
          totalIntendedDurationSeconds: Math.round(
            playlist.items.reduce((total, item) => total + item.durationMinutes, 0) * 60
          ),
        });

        return startResult;
      },
      pausePlaylistRun: () => {
        if (!activePlaylistRun) {
          return;
        }

        const nowMs = Date.now();
        const remainingSeconds = Math.max(0, Math.ceil((activePlaylistRun.currentItemEndAtMs - nowMs) / 1000));

        setActivePlaylistRun({
          ...activePlaylistRun,
          currentItemRemainingSeconds: remainingSeconds,
          currentItemEndAtMs: nowMs + remainingSeconds * 1000,
        });
        setIsPlaylistRunPaused(true);
      },
      resumePlaylistRun: () => {
        if (!activePlaylistRun) {
          return;
        }

        const nowMs = Date.now();
        setActivePlaylistRun({
          ...activePlaylistRun,
          currentItemEndAtMs: nowMs + activePlaylistRun.currentItemRemainingSeconds * 1000,
        });
        setIsPlaylistRunPaused(false);
      },
      endPlaylistRunEarly: () => {
        if (!activePlaylistRun) {
          return;
        }

        const nowMs = Date.now();
        const currentItem = activePlaylistRun.items[activePlaylistRun.currentIndex];
        if (!currentItem) {
          return;
        }

        const remainingSeconds = Math.max(0, Math.ceil((activePlaylistRun.currentItemEndAtMs - nowMs) / 1000));
        const intendedDurationSeconds = Math.round(currentItem.durationMinutes * 60);
        const completedCurrentItemSeconds = intendedDurationSeconds - remainingSeconds;

        const endedEarlyLog = buildPlaylistItemLogEntry({
          playlistId: activePlaylistRun.playlistId,
          playlistName: activePlaylistRun.playlistName,
          playlistRunId: activePlaylistRun.runId,
          playlistRunStartedAt: activePlaylistRun.runStartedAt,
          item: currentItem,
          itemPosition: activePlaylistRun.currentIndex + 1,
          itemCount: activePlaylistRun.items.length,
          startedAt: activePlaylistRun.currentItemStartedAt,
          endedAt: new Date(nowMs),
          completedDurationSeconds: completedCurrentItemSeconds,
          status: 'ended early',
        });

        dispatch({ type: 'ADD_SESSION_LOG', payload: endedEarlyLog });

        setPlaylistRunOutcome({
          status: 'ended early',
          playlistName: activePlaylistRun.playlistName,
          completedItems: activePlaylistRun.completedItems,
          totalItems: activePlaylistRun.items.length,
          completedDurationSeconds: activePlaylistRun.completedDurationSeconds + completedCurrentItemSeconds,
          endedAt: new Date(nowMs).toISOString(),
        });
        setActivePlaylistRun(null);
        setIsPlaylistRunPaused(false);
      },
      clearPlaylistRunOutcome: () => setPlaylistRunOutcome(null),
      addManualLog: async (input): Promise<ManualLogSaveResult> => {
        const validation = validateManualLogInput(input);
        if (!validation.isValid) {
          return {
            ...validation,
            persisted: false,
          };
        }

        try {
          const savedEntry = await createManualSessionLogInApi(buildManualLogCreateRequest(input));
          syncedSessionLogIdsRef.current.add(savedEntry.id);
          dispatch({
            type: 'ADD_SESSION_LOG',
            payload: savedEntry,
          });
          setSessionLogSyncError(null);
        } catch (error) {
          const persistenceError = `${formatApiErrorMessage(
            error,
            'Manual log saving failed.'
          )} The entry was not saved to the backend.`;
          setSessionLogSyncError(persistenceError);

          return {
            ...validation,
            persisted: false,
            persistenceError,
          };
        }

        return {
          ...validation,
          persisted: true,
        };
      },
      startSession: () => {
        if (activePlaylistRun) {
          return false;
        }

        if (!state.validation.isValid || !state.settings.meditationType) {
          dispatch({ type: 'SET_SETTINGS', payload: state.settings });
          return false;
        }

        dispatch({ type: 'START_SESSION', nowMs: Date.now() });
        setIsPaused(false);
        return true;
      },
      pauseSession: () => {
        dispatch({ type: 'PAUSE_SESSION', nowMs: Date.now() });
        setIsPaused(true);
      },
      resumeSession: () => {
        dispatch({ type: 'RESUME_SESSION', nowMs: Date.now() });
        setIsPaused(false);
      },
      endSessionEarly: () => {
        dispatch({ type: 'END_EARLY', nowMs: Date.now() });
        setIsPaused(false);
      },
      clearOutcome: () => dispatch({ type: 'CLEAR_OUTCOME' }),
      clearRecoveryMessage: () => setRecoveryMessage(null),
    }),
    [
      activePlaylistRun,
      customPlays,
      isPaused,
      isPlaylistRunPaused,
      isSessionLogsLoading,
      isSessionLogSyncing,
      isSettingsLoading,
      isSettingsSyncing,
      playlistRunOutcome,
      playlists,
      recoveryMessage,
      sessionLogSyncError,
      settingsSyncError,
      state,
    ]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
