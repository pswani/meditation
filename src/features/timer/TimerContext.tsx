import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useSyncStatus } from '../sync/useSyncStatus';
import type { CustomPlay, CustomPlaySaveResult } from '../../types/customPlay';
import type { ActivePlaylistRun, Playlist, PlaylistRunOutcome, PlaylistSaveResult } from '../../types/playlist';
import type { SessionLog } from '../../types/sessionLog';
import type { SyncQueueEntry } from '../../types/sync';
import type { ActiveSession, TimerSettings } from '../../types/timer';
import { areCustomPlaysEqual, createCustomPlay, updateCustomPlay, validateCustomPlayDraft } from '../../utils/customPlay';
import { deleteCustomPlayFromApi, listCustomPlaysFromApi, persistCustomPlayToApi } from '../../utils/customPlayApi';
import { isApiClientError } from '../../utils/apiClient';
import { buildManualLogEntry, type ManualLogSaveResult, validateManualLogInput } from '../../utils/manualLog';
import { arePlaylistsEqual, createPlaylist, updatePlaylist, validatePlaylistDraft } from '../../utils/playlist';
import { deletePlaylistFromApi, listPlaylistsFromApi, persistPlaylistToApi } from '../../utils/playlistApi';
import { buildPlaylistItemLogEntry } from '../../utils/playlistLog';
import { evaluatePlaylistDelete, evaluatePlaylistRunStart } from '../../utils/playlistRunPolicy';
import { listSessionLogsFromApi, persistSessionLogToApi } from '../../utils/sessionLogApi';
import { areSessionLogsEqual } from '../../utils/sessionLog';
import {
  enqueueSyncQueueEntry,
  markFailedSyncQueueEntriesPending,
  markSyncQueueEntryFailed,
  markSyncQueueEntryInFlight,
  removeSyncQueueEntry,
  selectSyncQueueEntries,
} from '../../utils/syncQueue';
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
  savePlaylists,
  saveSessionLogs,
  saveTimerSettings,
} from '../../utils/storage';
import {
  areTimerSettingsEqual,
  loadTimerSettingsFromApi,
  persistTimerSettingsToApi,
} from '../../utils/timerSettingsApi';
import { defaultTimerSettings } from './constants';
import {
  applyQueuedCollectionMutations,
  areOrderedCollectionsEqual,
  buildQueueHydrationSignature,
  mergeEntriesById,
  reconcileQueueBackedCollection,
} from './queueCollectionSync';
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
  return mergeEntriesById(primary, secondary, (left, right) => Date.parse(right.endedAt) - Date.parse(left.endedAt));
}

function mergeCustomPlays(primary: readonly CustomPlay[], secondary: readonly CustomPlay[]) {
  return mergeEntriesById(primary, secondary, (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

function mergePlaylists(primary: readonly Playlist[], secondary: readonly Playlist[]) {
  return mergeEntriesById(primary, secondary, (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
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

const TIMER_CONTEXT_SYNC_ENTITY_TYPES = ['timer-settings', 'session-log', 'custom-play', 'playlist'] as const;

function isNetworkError(error: unknown): boolean {
  return isApiClientError(error) && error.kind === 'network';
}

function buildOfflineCacheMessage(entityLabel: string, hasLocalData: boolean): string | null {
  if (!hasLocalData) {
    return null;
  }

  return `Showing locally saved ${entityLabel} while you are offline.`;
}

function buildQueuedSaveMessage(entityLabel: string): string {
  return `Saved locally while offline. This ${entityLabel} will sync when the backend is reachable.`;
}

function buildQueuedDeleteMessage(entityLabel: string): string {
  return `Removed locally while offline. This ${entityLabel} change will sync when the backend is reachable.`;
}

function mergeQueueEntry(
  updateQueue: (updater: (current: readonly SyncQueueEntry[]) => readonly SyncQueueEntry[]) => void,
  entry: Parameters<typeof enqueueSyncQueueEntry>[1]
) {
  updateQueue((current) => enqueueSyncQueueEntry(current, entry));
}

function applyQueuedTimerSettings(
  settings: TimerSettings,
  queueEntries: readonly SyncQueueEntry[]
): TimerSettings {
  const latestQueuedSettingsEntry = [...queueEntries]
    .reverse()
    .find((entry) => entry.entityType === 'timer-settings' && entry.operation === 'upsert');

  return latestQueuedSettingsEntry ? (latestQueuedSettingsEntry.payload as TimerSettings) : settings;
}

export function TimerProvider({ children }: { readonly children: ReactNode }) {
  const { isOnline, queue, updateQueue } = useSyncStatus();
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
  const [isCustomPlaysLoading, setIsCustomPlaysLoading] = useState(true);
  const [isCustomPlaySyncing, setIsCustomPlaySyncing] = useState(false);
  const [customPlaySyncError, setCustomPlaySyncError] = useState<string | null>(null);
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(true);
  const [isPlaylistSyncing, setIsPlaylistSyncing] = useState(false);
  const [playlistSyncError, setPlaylistSyncError] = useState<string | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSettingsSyncing, setIsSettingsSyncing] = useState(false);
  const [settingsSyncError, setSettingsSyncError] = useState<string | null>(null);
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
    return () => {
      isTimerProviderMountedRef.current = false;
    };
  }, []);

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

    savePlaylists(playlists);
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
    const queuedCustomPlayEntries = selectSyncQueueEntries(latestSyncQueueRef.current, {
      entityTypes: ['custom-play'],
    });
    const hydrationKey = buildQueueHydrationSignature(isOnline, queuedCustomPlayEntries);

    if (
      completedCustomPlayHydrationKeyRef.current === hydrationKey ||
      inFlightCustomPlayHydrationKeyRef.current === hydrationKey
    ) {
      return;
    }

    inFlightCustomPlayHydrationKeyRef.current = hydrationKey;

    async function hydrateCustomPlays() {
      setIsCustomPlaysLoading(true);

      if (!isOnline) {
        if (!cancelled) {
          setCustomPlaySyncError(buildOfflineCacheMessage('custom plays', bootstrap.customPlays.length > 0));
          setIsCustomPlaySyncing(false);
          setIsCustomPlaysLoading(false);
        }
        return;
      }

      try {
        const remoteCustomPlays = await listCustomPlaysFromApi();
        if (cancelled) {
          return;
        }
        const reconciliation = reconcileQueueBackedCollection({
          remoteEntries: remoteCustomPlays,
          localEntries: latestCustomPlaysRef.current,
          queuedEntries: queuedCustomPlayEntries,
          deletedRecordIds: deletedCustomPlayIdsRef.current,
          syncedRecordIds: syncedCustomPlayIdsRef.current,
          mergeEntries: mergeCustomPlays,
        });

        for (const remotePlay of reconciliation.filteredRemoteEntries) {
          syncedCustomPlayIdsRef.current.add(remotePlay.id);
        }

        if (reconciliation.missingLocalEntries.length > 0) {
          for (const customPlay of reconciliation.missingLocalEntries) {
            mergeQueueEntry(updateQueue, {
              entityType: 'custom-play',
              operation: 'upsert',
              recordId: customPlay.id,
              payload: customPlay,
            });
          }
        }

        if (
          !areOrderedCollectionsEqual(reconciliation.nextEntries, latestCustomPlaysRef.current, areCustomPlaysEqual)
        ) {
          setCustomPlays(reconciliation.nextEntries);
        }

        if (!queuedCustomPlayEntries.some((entry) => entry.state === 'failed')) {
          setCustomPlaySyncError(null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCustomPlaySyncError(
          `${formatApiErrorMessage(error, 'Custom play loading failed.')} Showing the local custom play cache instead.`
        );
      } finally {
        if (!cancelled) {
          completedCustomPlayHydrationKeyRef.current = hydrationKey;
          setIsCustomPlaySyncing(false);
          setIsCustomPlaysLoading(false);
        }
        if (inFlightCustomPlayHydrationKeyRef.current === hydrationKey) {
          inFlightCustomPlayHydrationKeyRef.current = null;
        }
      }
    }

    void hydrateCustomPlays();

    return () => {
      cancelled = true;
      if (inFlightCustomPlayHydrationKeyRef.current === hydrationKey) {
        inFlightCustomPlayHydrationKeyRef.current = null;
      }
    };
  }, [bootstrap.customPlays, isOnline, updateQueue]);

  useEffect(() => {
    let cancelled = false;
    const queuedPlaylistEntries = selectSyncQueueEntries(latestSyncQueueRef.current, {
      entityTypes: ['playlist'],
    });
    const hydrationKey = buildQueueHydrationSignature(isOnline, queuedPlaylistEntries);

    if (completedPlaylistHydrationKeyRef.current === hydrationKey || inFlightPlaylistHydrationKeyRef.current === hydrationKey) {
      return;
    }

    inFlightPlaylistHydrationKeyRef.current = hydrationKey;

    async function hydratePlaylists() {
      setIsPlaylistsLoading(true);

      if (!isOnline) {
        if (!cancelled) {
          setPlaylistSyncError(buildOfflineCacheMessage('playlists', bootstrap.playlists.length > 0));
          setIsPlaylistSyncing(false);
          setIsPlaylistsLoading(false);
        }
        return;
      }

      try {
        const remotePlaylists = await listPlaylistsFromApi();
        if (cancelled) {
          return;
        }
        const reconciliation = reconcileQueueBackedCollection({
          remoteEntries: remotePlaylists,
          localEntries: latestPlaylistsRef.current,
          queuedEntries: queuedPlaylistEntries,
          deletedRecordIds: deletedPlaylistIdsRef.current,
          syncedRecordIds: syncedPlaylistIdsRef.current,
          mergeEntries: mergePlaylists,
        });

        for (const remotePlaylist of reconciliation.filteredRemoteEntries) {
          syncedPlaylistIdsRef.current.add(remotePlaylist.id);
        }

        if (reconciliation.missingLocalEntries.length > 0) {
          for (const playlist of reconciliation.missingLocalEntries) {
            mergeQueueEntry(updateQueue, {
              entityType: 'playlist',
              operation: 'upsert',
              recordId: playlist.id,
              payload: playlist,
            });
          }
        }

        if (!areOrderedCollectionsEqual(reconciliation.nextEntries, latestPlaylistsRef.current, arePlaylistsEqual)) {
          setPlaylists(reconciliation.nextEntries);
        }

        if (!queuedPlaylistEntries.some((entry) => entry.state === 'failed')) {
          setPlaylistSyncError(null);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPlaylistSyncError(
          `${formatApiErrorMessage(error, 'Playlist loading failed.')} Showing the local playlist cache instead.`
        );
      } finally {
        if (!cancelled) {
          completedPlaylistHydrationKeyRef.current = hydrationKey;
          setIsPlaylistSyncing(false);
          setIsPlaylistsLoading(false);
        }
        if (inFlightPlaylistHydrationKeyRef.current === hydrationKey) {
          inFlightPlaylistHydrationKeyRef.current = null;
        }
      }
    }

    void hydratePlaylists();

    return () => {
      cancelled = true;
      if (inFlightPlaylistHydrationKeyRef.current === hydrationKey) {
        inFlightPlaylistHydrationKeyRef.current = null;
      }
    };
  }, [bootstrap.playlists, isOnline, updateQueue]);

  useEffect(() => {
    let cancelled = false;
    const queuedSessionLogEntries = selectSyncQueueEntries(latestSyncQueueRef.current, {
      entityTypes: ['session-log'],
    });
    const hydrationKey = buildQueueHydrationSignature(isOnline, queuedSessionLogEntries);

    if (
      completedSessionLogHydrationKeyRef.current === hydrationKey ||
      inFlightSessionLogHydrationKeyRef.current === hydrationKey
    ) {
      return;
    }

    inFlightSessionLogHydrationKeyRef.current = hydrationKey;

    async function hydrateSessionLogs() {
      setIsSessionLogsLoading(true);

      if (!isOnline) {
        if (!cancelled) {
          syncedSessionLogIdsRef.current = new Set();
          setSessionLogSyncError(buildOfflineCacheMessage('session logs', bootstrap.sessionLogs.length > 0));
          remoteSessionLogsHydratedRef.current = true;
          setIsSessionLogsLoading(false);
        }
        return;
      }

      try {
        const remoteSessionLogs = await listSessionLogsFromApi();
        if (cancelled) {
          return;
        }

        syncedSessionLogIdsRef.current = new Set(remoteSessionLogs.map((entry) => entry.id));
        const mergedSessionLogs = applyQueuedCollectionMutations(
          mergeSessionLogs(remoteSessionLogs, latestSessionLogsRef.current),
          queuedSessionLogEntries
        );
        if (!areOrderedCollectionsEqual(mergedSessionLogs, latestSessionLogsRef.current, areSessionLogsEqual)) {
          dispatch({
            type: 'REPLACE_SESSION_LOGS',
            payload: mergedSessionLogs,
          });
        }
        if (!queuedSessionLogEntries.some((entry) => entry.state === 'failed')) {
          setSessionLogSyncError(null);
        }
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
          completedSessionLogHydrationKeyRef.current = hydrationKey;
          remoteSessionLogsHydratedRef.current = true;
          setIsSessionLogsLoading(false);
        }
        if (inFlightSessionLogHydrationKeyRef.current === hydrationKey) {
          inFlightSessionLogHydrationKeyRef.current = null;
        }
      }
    }

    void hydrateSessionLogs();

    return () => {
      cancelled = true;
      if (inFlightSessionLogHydrationKeyRef.current === hydrationKey) {
        inFlightSessionLogHydrationKeyRef.current = null;
      }
    };
  }, [bootstrap.sessionLogs, isOnline]);

  useEffect(() => {
    let cancelled = false;
    const queuedTimerSettingsEntries = selectSyncQueueEntries(latestSyncQueueRef.current, {
      entityTypes: ['timer-settings'],
    });
    const hydrationKey = buildQueueHydrationSignature(isOnline, queuedTimerSettingsEntries);

    if (
      completedTimerSettingsHydrationKeyRef.current === hydrationKey ||
      inFlightTimerSettingsHydrationKeyRef.current === hydrationKey
    ) {
      return;
    }

    inFlightTimerSettingsHydrationKeyRef.current = hydrationKey;

    async function hydrateTimerSettings() {
      setIsSettingsLoading(true);

      if (!isOnline) {
        if (!cancelled) {
          lastPersistedTimerSettingsRef.current = bootstrap.settings;
          setSettingsSyncError('Using locally saved timer settings while you are offline.');
          remoteSettingsHydratedRef.current = true;
          setIsSettingsLoading(false);
        }
        return;
      }

      try {
        const remoteSettings = await loadTimerSettingsFromApi();
        if (cancelled) {
          return;
        }

        lastPersistedTimerSettingsRef.current = remoteSettings;

        const shouldPromoteBootstrapSettings =
          !areTimerSettingsEqual(latestTimerSettingsRef.current, defaultTimerSettings) &&
          areTimerSettingsEqual(remoteSettings, defaultTimerSettings);
        const hasQueuedTimerSettings = queuedTimerSettingsEntries.length > 0;

        if (shouldPromoteBootstrapSettings || hasQueuedTimerSettings) {
          lastPersistedTimerSettingsRef.current = remoteSettings;
          const queuedSettings = applyQueuedTimerSettings(latestTimerSettingsRef.current, queuedTimerSettingsEntries);
          if (!areTimerSettingsEqual(queuedSettings, latestTimerSettingsRef.current)) {
            dispatch({ type: 'SET_SETTINGS', payload: queuedSettings });
          }
        } else {
          if (!areTimerSettingsEqual(remoteSettings, latestTimerSettingsRef.current)) {
            dispatch({ type: 'SET_SETTINGS', payload: remoteSettings });
          }
        }

        if (!queuedTimerSettingsEntries.some((entry) => entry.state === 'failed')) {
          setSettingsSyncError(null);
        }
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
          completedTimerSettingsHydrationKeyRef.current = hydrationKey;
          remoteSettingsHydratedRef.current = true;
          setIsSettingsLoading(false);
        }
        if (inFlightTimerSettingsHydrationKeyRef.current === hydrationKey) {
          inFlightTimerSettingsHydrationKeyRef.current = null;
        }
      }
    }

    void hydrateTimerSettings();

    return () => {
      cancelled = true;
      if (inFlightTimerSettingsHydrationKeyRef.current === hydrationKey) {
        inFlightTimerSettingsHydrationKeyRef.current = null;
      }
    };
  }, [bootstrap.settings, isOnline]);

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

    mergeQueueEntry(updateQueue, {
      entityType: 'timer-settings',
      operation: 'upsert',
      recordId: 'default',
      payload: state.settings,
    });

    if (!isOnline) {
      setSettingsSyncError(buildQueuedSaveMessage('timer settings'));
    }
  }, [isOnline, state.settings, state.validation.isValid, updateQueue]);

  useEffect(() => {
    if (!remoteSessionLogsHydratedRef.current) {
      return;
    }

    const unsyncedSessionLogs = state.sessionLogs.filter((entry) => !syncedSessionLogIdsRef.current.has(entry.id));

    if (unsyncedSessionLogs.length === 0) {
      return;
    }

    const queuedSessionLogIds = new Set(
      selectSyncQueueEntries(queue, {
        entityTypes: ['session-log'],
      }).map((entry) => entry.recordId)
    );

    for (const entry of unsyncedSessionLogs) {
      if (queuedSessionLogIds.has(entry.id)) {
        continue;
      }

      mergeQueueEntry(updateQueue, {
        entityType: 'session-log',
        operation: 'upsert',
        recordId: entry.id,
        payload: entry,
      });
    }

    if (!isOnline) {
      setSessionLogSyncError(buildQueuedSaveMessage('session log'));
    }
  }, [isOnline, queue, state.sessionLogs, updateQueue]);

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    updateQueue((currentQueue) => markFailedSyncQueueEntriesPending(currentQueue, TIMER_CONTEXT_SYNC_ENTITY_TYPES));
  }, [isOnline, updateQueue]);

  useEffect(() => {
    if (!isOnline || isFlushingSyncQueueRef.current) {
      return;
    }

    const pendingEntries = selectSyncQueueEntries(queue, {
      entityTypes: TIMER_CONTEXT_SYNC_ENTITY_TYPES,
      states: ['pending'],
    });

    if (pendingEntries.length === 0) {
      return;
    }

    isFlushingSyncQueueRef.current = true;

    async function flushSyncQueue() {
      for (const queueEntry of pendingEntries) {
        if (!isTimerProviderMountedRef.current) {
          return;
        }

        const attemptedAt = new Date().toISOString();
        updateQueue((currentQueue) => markSyncQueueEntryInFlight(currentQueue, queueEntry.id, attemptedAt));

        try {
          if (queueEntry.entityType === 'timer-settings' && queueEntry.operation === 'upsert') {
            setIsSettingsSyncing(true);
            const savedSettings = await persistTimerSettingsToApi(queueEntry.payload as TimerSettings, {
              syncQueuedAt: queueEntry.queuedAt,
            });
            lastPersistedTimerSettingsRef.current = savedSettings;
            setSettingsSyncError(null);
            setIsSettingsSyncing(false);
          }

          if (queueEntry.entityType === 'session-log' && queueEntry.operation === 'upsert') {
            setIsSessionLogSyncing(true);
            const savedEntry = await persistSessionLogToApi(queueEntry.payload as SessionLog, {
              syncQueuedAt: queueEntry.queuedAt,
            });
            syncedSessionLogIdsRef.current.add(savedEntry.id);
            const nextSessionLogs = mergeSessionLogs([savedEntry], latestSessionLogsRef.current);
            if (!areOrderedCollectionsEqual(nextSessionLogs, latestSessionLogsRef.current, areSessionLogsEqual)) {
              dispatch({ type: 'REPLACE_SESSION_LOGS', payload: nextSessionLogs });
            }
            setSessionLogSyncError(null);
            setIsSessionLogSyncing(false);
          }

          if (queueEntry.entityType === 'custom-play') {
            setIsCustomPlaySyncing(true);
            if (queueEntry.operation === 'delete') {
              const deleteResult = await deleteCustomPlayFromApi(queueEntry.recordId, {
                syncQueuedAt: queueEntry.queuedAt,
              });
              if (deleteResult.outcome === 'stale') {
                syncedCustomPlayIdsRef.current.add(deleteResult.currentCustomPlay.id);
                deletedCustomPlayIdsRef.current.delete(deleteResult.currentCustomPlay.id);
                setCustomPlays((current) => mergeCustomPlays([deleteResult.currentCustomPlay], current));
                setCustomPlaySyncError(
                  'A newer custom play version already exists in the backend, so this delete was not applied.'
                );
              } else {
                syncedCustomPlayIdsRef.current.delete(queueEntry.recordId);
                deletedCustomPlayIdsRef.current.add(queueEntry.recordId);
                setCustomPlaySyncError(null);
              }
            } else {
              const savedCustomPlay = await persistCustomPlayToApi(queueEntry.payload as CustomPlay, {
                syncQueuedAt: queueEntry.queuedAt,
              });
              syncedCustomPlayIdsRef.current.add(savedCustomPlay.id);
              deletedCustomPlayIdsRef.current.delete(savedCustomPlay.id);
              setCustomPlays((current) =>
                current.some((play) => play.id === savedCustomPlay.id)
                  ? current.map((play) => (play.id === savedCustomPlay.id ? savedCustomPlay : play))
                  : current
              );
              setCustomPlaySyncError(null);
            }
            setIsCustomPlaySyncing(false);
          }

          if (queueEntry.entityType === 'playlist') {
            setIsPlaylistSyncing(true);
            if (queueEntry.operation === 'delete') {
              const deleteResult = await deletePlaylistFromApi(queueEntry.recordId, {
                syncQueuedAt: queueEntry.queuedAt,
              });
              if (deleteResult.outcome === 'stale') {
                syncedPlaylistIdsRef.current.add(deleteResult.currentPlaylist.id);
                deletedPlaylistIdsRef.current.delete(deleteResult.currentPlaylist.id);
                setPlaylists((current) => mergePlaylists([deleteResult.currentPlaylist], current));
                setPlaylistSyncError(
                  'A newer playlist version already exists in the backend, so this delete was not applied.'
                );
              } else {
                syncedPlaylistIdsRef.current.delete(queueEntry.recordId);
                deletedPlaylistIdsRef.current.add(queueEntry.recordId);
                setPlaylistSyncError(null);
              }
            } else {
              const savedPlaylist = await persistPlaylistToApi(queueEntry.payload as Playlist, {
                syncQueuedAt: queueEntry.queuedAt,
              });
              syncedPlaylistIdsRef.current.add(savedPlaylist.id);
              deletedPlaylistIdsRef.current.delete(savedPlaylist.id);
              setPlaylists((current) =>
                current.some((playlist) => playlist.id === savedPlaylist.id)
                  ? current.map((playlist) => (playlist.id === savedPlaylist.id ? savedPlaylist : playlist))
                  : current
              );
              setPlaylistSyncError(null);
            }
            setIsPlaylistSyncing(false);
          }

          updateQueue((currentQueue) => removeSyncQueueEntry(currentQueue, queueEntry.id));
        } catch (error) {
          if (!isTimerProviderMountedRef.current) {
            return;
          }

          const failureMessage = formatApiErrorMessage(error, 'Sync failed.');
          updateQueue((currentQueue) => markSyncQueueEntryFailed(currentQueue, queueEntry.id, attemptedAt, failureMessage));

          if (queueEntry.entityType === 'timer-settings') {
            setSettingsSyncError(
              `${failureMessage} Local timer settings remain available in this browser.`
            );
            setIsSettingsSyncing(false);
          }

          if (queueEntry.entityType === 'session-log') {
            setSessionLogSyncError(`${failureMessage} The latest session log is still visible locally in this browser.`);
            setIsSessionLogSyncing(false);
          }

          if (queueEntry.entityType === 'custom-play') {
            setCustomPlaySyncError(`${failureMessage} The latest custom play state remains available locally.`);
            setIsCustomPlaySyncing(false);
          }

          if (queueEntry.entityType === 'playlist') {
            setPlaylistSyncError(`${failureMessage} The latest playlist state remains available locally.`);
            setIsPlaylistSyncing(false);
          }

          if (isNetworkError(error)) {
            break;
          }
        }
      }
    }

    void flushSyncQueue().finally(() => {
      if (isTimerProviderMountedRef.current) {
        isFlushingSyncQueueRef.current = false;
      }
    });
  }, [isOnline, queue, updateQueue]);

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
      isCustomPlaysLoading,
      isCustomPlaySyncing,
      customPlaySyncError,
      isPlaylistsLoading,
      isPlaylistSyncing,
      playlistSyncError,
      isSettingsLoading,
      isSettingsSyncing,
      settingsSyncError,
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

        if (!isOnline) {
          setCustomPlaySyncError(buildQueuedSaveMessage('custom play'));
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

        setCustomPlays((current) => current.filter((play) => play.id !== playId));
        mergeQueueEntry(updateQueue, {
          entityType: 'custom-play',
          operation: 'delete',
          recordId: playId,
          payload: null,
        });

        if (!isOnline) {
          setCustomPlaySyncError(buildQueuedDeleteMessage('custom play'));
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

        if (!isOnline) {
          setCustomPlaySyncError(buildQueuedSaveMessage('custom play'));
        } else {
          setCustomPlaySyncError(null);
        }
        return true;
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

        if (!isOnline) {
          setPlaylistSyncError(buildQueuedSaveMessage('playlist'));
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
        mergeQueueEntry(updateQueue, {
          entityType: 'playlist',
          operation: 'delete',
          recordId: playlistId,
          payload: null,
        });

        if (!isOnline) {
          setPlaylistSyncError(buildQueuedDeleteMessage('playlist'));
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

        if (!isOnline) {
          setPlaylistSyncError(buildQueuedSaveMessage('playlist'));
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

        if (!isOnline) {
          setSessionLogSyncError(buildQueuedSaveMessage('manual log'));
        } else {
          setSessionLogSyncError(null);
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
      customPlaySyncError,
      isOnline,
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
      playlistRunOutcome,
      playlists,
      playlistSyncError,
      recoveryMessage,
      sessionLogSyncError,
      settingsSyncError,
      state,
      updateQueue,
    ]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}
