import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { CustomPlay } from '../../types/customPlay';
import type { Playlist } from '../../types/playlist';
import type { SessionLog } from '../../types/sessionLog';
import type { SyncQueueEntry } from '../../types/sync';
import type { TimerSettings } from '../../types/timer';
import { deleteCustomPlayFromApi, listCustomPlaysFromApi, persistCustomPlayToApi } from '../../utils/customPlayApi';
import { isBackendReachabilityError } from '../../utils/apiClient';
import { deletePlaylistFromApi, listPlaylistsFromApi, persistPlaylistToApi } from '../../utils/playlistApi';
import { listSessionLogsFromApi, persistSessionLogToApi } from '../../utils/sessionLogApi';
import {
  markFailedSyncQueueEntriesPending,
  markSyncQueueEntryFailed,
  markSyncQueueEntryInFlight,
  removeSyncQueueEntry,
  selectSyncQueueEntries,
} from '../../utils/syncQueue';
import { areTimerSettingsEqual, loadTimerSettingsFromApi, persistTimerSettingsToApi } from '../../utils/timerSettingsApi';
import { normalizeTimerSettings } from '../../utils/timerSettingsNormalization';
import type { SyncConnectionMode } from '../sync/syncContextObject';
import {
  applyQueuedCollectionMutations,
  areOrderedCollectionsEqual,
  buildQueueHydrationSignature,
  reconcileQueueBackedCollection,
} from './queueCollectionSync';
import type { TimerAction, TimerState } from './timerReducer';
import {
  applyQueuedTimerSettings,
  buildOfflineCacheMessage,
  buildQueuedSaveMessage,
  formatApiErrorMessage,
  isNetworkError,
  mergeCustomPlays,
  mergePlaylists,
  mergeQueueEntry,
  mergeSessionLogs,
  replaceQueueEntryPayload,
  selectLatestQueuedTimerSettingsEntry,
  TIMER_CONTEXT_SYNC_ENTITY_TYPES,
  type TimerBootstrap,
} from './timerProviderHelpers';
import { areCustomPlaysEqual } from '../../utils/customPlay';
import { arePlaylistsEqual } from '../../utils/playlist';
import { areSessionLogsEqual } from '../../utils/sessionLog';

export interface TimerSyncRefs {
  readonly latestSessionLogsRef: MutableRefObject<readonly SessionLog[]>;
  readonly latestCustomPlaysRef: MutableRefObject<CustomPlay[]>;
  readonly latestPlaylistsRef: MutableRefObject<Playlist[]>;
  readonly latestTimerSettingsRef: MutableRefObject<TimerSettings>;
  readonly latestSyncQueueRef: MutableRefObject<readonly SyncQueueEntry[]>;
  readonly isTimerProviderMountedRef: MutableRefObject<boolean>;
  readonly remoteSessionLogsHydratedRef: MutableRefObject<boolean>;
  readonly syncedSessionLogIdsRef: MutableRefObject<Set<string>>;
  readonly syncedCustomPlayIdsRef: MutableRefObject<Set<string>>;
  readonly deletedCustomPlayIdsRef: MutableRefObject<Set<string>>;
  readonly syncedPlaylistIdsRef: MutableRefObject<Set<string>>;
  readonly deletedPlaylistIdsRef: MutableRefObject<Set<string>>;
  readonly remoteSettingsHydratedRef: MutableRefObject<boolean>;
  readonly lastPersistedTimerSettingsRef: MutableRefObject<TimerSettings | null>;
  readonly isFlushingSyncQueueRef: MutableRefObject<boolean>;
  readonly completedCustomPlayHydrationKeyRef: MutableRefObject<string | null>;
  readonly inFlightCustomPlayHydrationKeyRef: MutableRefObject<string | null>;
  readonly completedPlaylistHydrationKeyRef: MutableRefObject<string | null>;
  readonly inFlightPlaylistHydrationKeyRef: MutableRefObject<string | null>;
  readonly completedSessionLogHydrationKeyRef: MutableRefObject<string | null>;
  readonly inFlightSessionLogHydrationKeyRef: MutableRefObject<string | null>;
  readonly completedTimerSettingsHydrationKeyRef: MutableRefObject<string | null>;
  readonly inFlightTimerSettingsHydrationKeyRef: MutableRefObject<string | null>;
}

interface UseTimerSyncEffectsArgs {
  readonly bootstrap: TimerBootstrap;
  readonly state: TimerState;
  readonly queue: readonly SyncQueueEntry[];
  readonly connectionMode: SyncConnectionMode;
  readonly canAttemptBackendSync: boolean;
  readonly updateQueue: (updater: (current: readonly SyncQueueEntry[]) => readonly SyncQueueEntry[]) => void;
  readonly reportBackendReachable: () => void;
  readonly reportBackendUnreachable: (error?: unknown) => void;
  readonly refs: TimerSyncRefs;
  readonly dispatch: Dispatch<TimerAction>;
  readonly setCustomPlays: Dispatch<SetStateAction<CustomPlay[]>>;
  readonly setPlaylists: Dispatch<SetStateAction<Playlist[]>>;
  readonly setIsSessionLogsLoading: (value: boolean) => void;
  readonly setIsSessionLogSyncing: (value: boolean) => void;
  readonly setSessionLogSyncError: (value: string | null) => void;
  readonly setIsCustomPlaysLoading: (value: boolean) => void;
  readonly setIsCustomPlaySyncing: (value: boolean) => void;
  readonly setCustomPlaySyncError: (value: string | null) => void;
  readonly setIsPlaylistsLoading: (value: boolean) => void;
  readonly setIsPlaylistSyncing: (value: boolean) => void;
  readonly setPlaylistSyncError: (value: string | null) => void;
  readonly setIsSettingsLoading: (value: boolean) => void;
  readonly setIsSettingsSyncing: (value: boolean) => void;
  readonly setSettingsSyncError: (value: string | null) => void;
}

export function useTimerSyncEffects({
  bootstrap,
  state,
  queue,
  connectionMode,
  canAttemptBackendSync,
  updateQueue,
  reportBackendReachable,
  reportBackendUnreachable,
  refs,
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
}: UseTimerSyncEffectsArgs) {
  useEffect(() => {
    let cancelled = false;
    const queuedCustomPlayEntries = selectSyncQueueEntries(refs.latestSyncQueueRef.current, {
      entityTypes: ['custom-play'],
    });
    const hydrationKey = buildQueueHydrationSignature(connectionMode, queuedCustomPlayEntries);

    if (
      refs.completedCustomPlayHydrationKeyRef.current === hydrationKey ||
      refs.inFlightCustomPlayHydrationKeyRef.current === hydrationKey
    ) {
      return;
    }

    refs.inFlightCustomPlayHydrationKeyRef.current = hydrationKey;

    async function hydrateCustomPlays() {
      setIsCustomPlaysLoading(true);

      if (!canAttemptBackendSync) {
        if (!cancelled) {
          setCustomPlaySyncError(buildOfflineCacheMessage(connectionMode, 'custom plays', bootstrap.customPlays.length > 0));
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
          localEntries: refs.latestCustomPlaysRef.current,
          queuedEntries: queuedCustomPlayEntries,
          deletedRecordIds: refs.deletedCustomPlayIdsRef.current,
          syncedRecordIds: refs.syncedCustomPlayIdsRef.current,
          mergeEntries: mergeCustomPlays,
        });

        for (const remotePlay of reconciliation.filteredRemoteEntries) {
          refs.syncedCustomPlayIdsRef.current.add(remotePlay.id);
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
          !areOrderedCollectionsEqual(reconciliation.nextEntries, refs.latestCustomPlaysRef.current, areCustomPlaysEqual)
        ) {
          setCustomPlays(reconciliation.nextEntries);
        }

        if (!queuedCustomPlayEntries.some((entry) => entry.state === 'failed')) {
          setCustomPlaySyncError(null);
        }
        reportBackendReachable();
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (isBackendReachabilityError(error)) {
          reportBackendUnreachable(error);
        }

        setCustomPlaySyncError(
          `${formatApiErrorMessage(error, 'Custom play loading failed.')} Showing the local custom play cache instead.`
        );
      } finally {
        if (!cancelled) {
          refs.completedCustomPlayHydrationKeyRef.current = hydrationKey;
          setIsCustomPlaySyncing(false);
          setIsCustomPlaysLoading(false);
        }
        if (refs.inFlightCustomPlayHydrationKeyRef.current === hydrationKey) {
          refs.inFlightCustomPlayHydrationKeyRef.current = null;
        }
      }
    }

    void hydrateCustomPlays();

    return () => {
      cancelled = true;
      if (refs.inFlightCustomPlayHydrationKeyRef.current === hydrationKey) {
        refs.inFlightCustomPlayHydrationKeyRef.current = null;
      }
    };
  }, [
    bootstrap.customPlays,
    canAttemptBackendSync,
    connectionMode,
    refs,
    reportBackendReachable,
    reportBackendUnreachable,
    setCustomPlays,
    setCustomPlaySyncError,
    setIsCustomPlaysLoading,
    setIsCustomPlaySyncing,
    updateQueue,
  ]);

  useEffect(() => {
    let cancelled = false;
    const queuedPlaylistEntries = selectSyncQueueEntries(refs.latestSyncQueueRef.current, {
      entityTypes: ['playlist'],
    });
    const hydrationKey = buildQueueHydrationSignature(connectionMode, queuedPlaylistEntries);

    if (refs.completedPlaylistHydrationKeyRef.current === hydrationKey || refs.inFlightPlaylistHydrationKeyRef.current === hydrationKey) {
      return;
    }

    refs.inFlightPlaylistHydrationKeyRef.current = hydrationKey;

    async function hydratePlaylists() {
      setIsPlaylistsLoading(true);

      if (!canAttemptBackendSync) {
        if (!cancelled) {
          setPlaylistSyncError(buildOfflineCacheMessage(connectionMode, 'playlists', bootstrap.playlists.length > 0));
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
          localEntries: refs.latestPlaylistsRef.current,
          queuedEntries: queuedPlaylistEntries,
          deletedRecordIds: refs.deletedPlaylistIdsRef.current,
          syncedRecordIds: refs.syncedPlaylistIdsRef.current,
          mergeEntries: mergePlaylists,
        });

        for (const remotePlaylist of reconciliation.filteredRemoteEntries) {
          refs.syncedPlaylistIdsRef.current.add(remotePlaylist.id);
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

        if (!areOrderedCollectionsEqual(reconciliation.nextEntries, refs.latestPlaylistsRef.current, arePlaylistsEqual)) {
          setPlaylists(reconciliation.nextEntries);
        }

        if (!queuedPlaylistEntries.some((entry) => entry.state === 'failed')) {
          setPlaylistSyncError(null);
        }
        reportBackendReachable();
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (isBackendReachabilityError(error)) {
          reportBackendUnreachable(error);
        }

        setPlaylistSyncError(
          `${formatApiErrorMessage(error, 'Playlist loading failed.')} Showing the local playlist cache instead.`
        );
      } finally {
        if (!cancelled) {
          refs.completedPlaylistHydrationKeyRef.current = hydrationKey;
          setIsPlaylistSyncing(false);
          setIsPlaylistsLoading(false);
        }
        if (refs.inFlightPlaylistHydrationKeyRef.current === hydrationKey) {
          refs.inFlightPlaylistHydrationKeyRef.current = null;
        }
      }
    }

    void hydratePlaylists();

    return () => {
      cancelled = true;
      if (refs.inFlightPlaylistHydrationKeyRef.current === hydrationKey) {
        refs.inFlightPlaylistHydrationKeyRef.current = null;
      }
    };
  }, [
    bootstrap.playlists,
    canAttemptBackendSync,
    connectionMode,
    refs,
    reportBackendReachable,
    reportBackendUnreachable,
    setIsPlaylistsLoading,
    setIsPlaylistSyncing,
    setPlaylistSyncError,
    setPlaylists,
    updateQueue,
  ]);

  useEffect(() => {
    let cancelled = false;
    const queuedSessionLogEntries = selectSyncQueueEntries(refs.latestSyncQueueRef.current, {
      entityTypes: ['session-log'],
    });
    const hydrationKey = buildQueueHydrationSignature(connectionMode, queuedSessionLogEntries);

    if (
      refs.completedSessionLogHydrationKeyRef.current === hydrationKey ||
      refs.inFlightSessionLogHydrationKeyRef.current === hydrationKey
    ) {
      return;
    }

    refs.inFlightSessionLogHydrationKeyRef.current = hydrationKey;

    async function hydrateSessionLogs() {
      setIsSessionLogsLoading(true);

      if (!canAttemptBackendSync) {
        if (!cancelled) {
          refs.syncedSessionLogIdsRef.current = new Set();
          setSessionLogSyncError(buildOfflineCacheMessage(connectionMode, 'session logs', bootstrap.sessionLogs.length > 0));
          refs.remoteSessionLogsHydratedRef.current = true;
          setIsSessionLogsLoading(false);
        }
        return;
      }

      try {
        const remoteSessionLogs = await listSessionLogsFromApi();
        if (cancelled) {
          return;
        }

        refs.syncedSessionLogIdsRef.current = new Set(remoteSessionLogs.map((entry) => entry.id));
        const mergedSessionLogs = applyQueuedCollectionMutations(
          mergeSessionLogs(remoteSessionLogs, refs.latestSessionLogsRef.current),
          queuedSessionLogEntries
        );
        if (!areOrderedCollectionsEqual(mergedSessionLogs, refs.latestSessionLogsRef.current, areSessionLogsEqual)) {
          dispatch({
            type: 'REPLACE_SESSION_LOGS',
            payload: mergedSessionLogs,
          });
        }
        if (!queuedSessionLogEntries.some((entry) => entry.state === 'failed')) {
          setSessionLogSyncError(null);
        }
        reportBackendReachable();
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (isBackendReachabilityError(error)) {
          reportBackendUnreachable(error);
        }

        refs.syncedSessionLogIdsRef.current = new Set();
        setSessionLogSyncError(
          `${formatApiErrorMessage(error, 'Session log loading failed.')} Showing the local session log cache instead.`
        );
      } finally {
        if (!cancelled) {
          refs.completedSessionLogHydrationKeyRef.current = hydrationKey;
          refs.remoteSessionLogsHydratedRef.current = true;
          setIsSessionLogsLoading(false);
        }
        if (refs.inFlightSessionLogHydrationKeyRef.current === hydrationKey) {
          refs.inFlightSessionLogHydrationKeyRef.current = null;
        }
      }
    }

    void hydrateSessionLogs();

    return () => {
      cancelled = true;
      if (refs.inFlightSessionLogHydrationKeyRef.current === hydrationKey) {
        refs.inFlightSessionLogHydrationKeyRef.current = null;
      }
    };
  }, [
    bootstrap.sessionLogs,
    canAttemptBackendSync,
    connectionMode,
    dispatch,
    refs,
    reportBackendReachable,
    reportBackendUnreachable,
    setIsSessionLogsLoading,
    setSessionLogSyncError,
  ]);

  useEffect(() => {
    let cancelled = false;
    const queuedTimerSettingsEntries = selectSyncQueueEntries(refs.latestSyncQueueRef.current, {
      entityTypes: ['timer-settings'],
    });
    const hydrationKey = buildQueueHydrationSignature(connectionMode, queuedTimerSettingsEntries);

    if (
      refs.completedTimerSettingsHydrationKeyRef.current === hydrationKey ||
      refs.inFlightTimerSettingsHydrationKeyRef.current === hydrationKey
    ) {
      return;
    }

    refs.inFlightTimerSettingsHydrationKeyRef.current = hydrationKey;

    async function hydrateTimerSettings() {
      setIsSettingsLoading(true);

      if (!canAttemptBackendSync) {
        if (!cancelled) {
          refs.lastPersistedTimerSettingsRef.current = bootstrap.settings;
          setSettingsSyncError(
            connectionMode === 'backend-unreachable'
              ? 'Using locally saved timer settings because the backend is unavailable right now.'
              : 'Using locally saved timer settings while you are offline.'
          );
          refs.remoteSettingsHydratedRef.current = true;
          setIsSettingsLoading(false);
        }
        return;
      }

      try {
        const remoteSettings = await loadTimerSettingsFromApi();
        if (cancelled) {
          return;
        }

        refs.lastPersistedTimerSettingsRef.current = remoteSettings;

        const hasQueuedTimerSettings = queuedTimerSettingsEntries.length > 0;

        if (hasQueuedTimerSettings) {
          refs.lastPersistedTimerSettingsRef.current = remoteSettings;
          const latestQueuedTimerSettingsEntry = selectLatestQueuedTimerSettingsEntry(queuedTimerSettingsEntries);
          const queuedSettings = applyQueuedTimerSettings(refs.latestTimerSettingsRef.current, queuedTimerSettingsEntries);
          if (
            latestQueuedTimerSettingsEntry &&
            !areTimerSettingsEqual(latestQueuedTimerSettingsEntry.payload as TimerSettings, queuedSettings)
          ) {
            replaceQueueEntryPayload(updateQueue, latestQueuedTimerSettingsEntry.id, queuedSettings);
          }
          if (!areTimerSettingsEqual(queuedSettings, refs.latestTimerSettingsRef.current)) {
            dispatch({ type: 'SET_SETTINGS', payload: queuedSettings });
          }
        } else if (!areTimerSettingsEqual(remoteSettings, refs.latestTimerSettingsRef.current)) {
          dispatch({ type: 'SET_SETTINGS', payload: remoteSettings });
        }

        if (!queuedTimerSettingsEntries.some((entry) => entry.state === 'failed')) {
          setSettingsSyncError(null);
        }
        reportBackendReachable();
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (isBackendReachabilityError(error)) {
          reportBackendUnreachable(error);
        }

        refs.lastPersistedTimerSettingsRef.current = refs.latestTimerSettingsRef.current;
        setSettingsSyncError(
          `${formatApiErrorMessage(error, 'Timer settings could not load from the backend.')} Using the local timer settings cache for now.`
        );
      } finally {
        if (!cancelled) {
          refs.completedTimerSettingsHydrationKeyRef.current = hydrationKey;
          refs.remoteSettingsHydratedRef.current = true;
          setIsSettingsLoading(false);
        }
        if (refs.inFlightTimerSettingsHydrationKeyRef.current === hydrationKey) {
          refs.inFlightTimerSettingsHydrationKeyRef.current = null;
        }
      }
    }

    void hydrateTimerSettings();

    return () => {
      cancelled = true;
      if (refs.inFlightTimerSettingsHydrationKeyRef.current === hydrationKey) {
        refs.inFlightTimerSettingsHydrationKeyRef.current = null;
      }
    };
  }, [
    bootstrap.settings,
    canAttemptBackendSync,
    connectionMode,
    dispatch,
    refs,
    reportBackendReachable,
    reportBackendUnreachable,
    setIsSettingsLoading,
    setSettingsSyncError,
    updateQueue,
  ]);

  useEffect(() => {
    if (!refs.remoteSettingsHydratedRef.current) {
      return;
    }

    if (!state.validation.isValid) {
      return;
    }

    if (refs.lastPersistedTimerSettingsRef.current && areTimerSettingsEqual(refs.lastPersistedTimerSettingsRef.current, state.settings)) {
      return;
    }

    const queuedTimerSettingsEntries = selectSyncQueueEntries(queue, {
      entityTypes: ['timer-settings'],
    });
    const latestQueuedTimerSettingsEntry = selectLatestQueuedTimerSettingsEntry(queuedTimerSettingsEntries);

    if (latestQueuedTimerSettingsEntry) {
      const normalizedQueuedSettings = normalizeTimerSettings(latestQueuedTimerSettingsEntry.payload as TimerSettings);

      if (!areTimerSettingsEqual(latestQueuedTimerSettingsEntry.payload as TimerSettings, normalizedQueuedSettings)) {
        replaceQueueEntryPayload(updateQueue, latestQueuedTimerSettingsEntry.id, normalizedQueuedSettings);
      }

      if (areTimerSettingsEqual(normalizedQueuedSettings, state.settings)) {
        return;
      }
    }

    mergeQueueEntry(updateQueue, {
      entityType: 'timer-settings',
      operation: 'upsert',
      recordId: 'default',
      payload: state.settings,
    });

    if (!canAttemptBackendSync) {
      setSettingsSyncError(buildQueuedSaveMessage(connectionMode, 'timer settings'));
    }
  }, [canAttemptBackendSync, connectionMode, queue, state.settings, state.validation.isValid, refs, setSettingsSyncError, updateQueue]);

  useEffect(() => {
    if (!refs.remoteSessionLogsHydratedRef.current) {
      return;
    }

    const unsyncedSessionLogs = state.sessionLogs.filter((entry) => !refs.syncedSessionLogIdsRef.current.has(entry.id));

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

    if (!canAttemptBackendSync) {
      setSessionLogSyncError(buildQueuedSaveMessage(connectionMode, 'session log'));
    }
  }, [canAttemptBackendSync, connectionMode, queue, refs, setSessionLogSyncError, state.sessionLogs, updateQueue]);

  useEffect(() => {
    if (!canAttemptBackendSync) {
      return;
    }

    updateQueue((currentQueue) => markFailedSyncQueueEntriesPending(currentQueue, TIMER_CONTEXT_SYNC_ENTITY_TYPES));
  }, [canAttemptBackendSync, updateQueue]);

  useEffect(() => {
    if (!canAttemptBackendSync || refs.isFlushingSyncQueueRef.current) {
      return;
    }

    const pendingEntries = selectSyncQueueEntries(queue, {
      entityTypes: TIMER_CONTEXT_SYNC_ENTITY_TYPES,
      states: ['pending'],
    });

    if (pendingEntries.length === 0) {
      return;
    }

    refs.isFlushingSyncQueueRef.current = true;

    async function flushSyncQueue() {
      for (const queueEntry of pendingEntries) {
        if (!refs.isTimerProviderMountedRef.current) {
          return;
        }

        const attemptedAt = new Date().toISOString();
        updateQueue((currentQueue) => markSyncQueueEntryInFlight(currentQueue, queueEntry.id, attemptedAt));

        try {
          if (queueEntry.entityType === 'timer-settings' && queueEntry.operation === 'upsert') {
            setIsSettingsSyncing(true);
            const queuedSettings = normalizeTimerSettings(queueEntry.payload as TimerSettings);
            const savedSettings = await persistTimerSettingsToApi(queuedSettings, {
              syncQueuedAt: queueEntry.queuedAt,
            });
            refs.lastPersistedTimerSettingsRef.current = savedSettings;
            reportBackendReachable();
            setSettingsSyncError(null);
            setIsSettingsSyncing(false);
          }

          if (queueEntry.entityType === 'session-log' && queueEntry.operation === 'upsert') {
            setIsSessionLogSyncing(true);
            const savedEntry = await persistSessionLogToApi(queueEntry.payload as SessionLog, {
              syncQueuedAt: queueEntry.queuedAt,
            });
            refs.syncedSessionLogIdsRef.current.add(savedEntry.id);
            reportBackendReachable();
            const nextSessionLogs = mergeSessionLogs([savedEntry], refs.latestSessionLogsRef.current);
            if (!areOrderedCollectionsEqual(nextSessionLogs, refs.latestSessionLogsRef.current, areSessionLogsEqual)) {
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
              reportBackendReachable();
              if (deleteResult.outcome === 'stale') {
                refs.syncedCustomPlayIdsRef.current.add(deleteResult.currentCustomPlay.id);
                refs.deletedCustomPlayIdsRef.current.delete(deleteResult.currentCustomPlay.id);
                setCustomPlays((current) => mergeCustomPlays([deleteResult.currentCustomPlay], current));
                setCustomPlaySyncError(
                  'A newer custom play version already exists in the backend, so this delete was not applied.'
                );
              } else {
                refs.syncedCustomPlayIdsRef.current.delete(queueEntry.recordId);
                refs.deletedCustomPlayIdsRef.current.add(queueEntry.recordId);
                setCustomPlaySyncError(null);
              }
            } else {
              const savedCustomPlay = await persistCustomPlayToApi(queueEntry.payload as CustomPlay, {
                syncQueuedAt: queueEntry.queuedAt,
              });
              reportBackendReachable();
              refs.syncedCustomPlayIdsRef.current.add(savedCustomPlay.id);
              refs.deletedCustomPlayIdsRef.current.delete(savedCustomPlay.id);
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
              reportBackendReachable();
              if (deleteResult.outcome === 'stale') {
                refs.syncedPlaylistIdsRef.current.add(deleteResult.currentPlaylist.id);
                refs.deletedPlaylistIdsRef.current.delete(deleteResult.currentPlaylist.id);
                setPlaylists((current) => mergePlaylists([deleteResult.currentPlaylist], current));
                setPlaylistSyncError(
                  'A newer playlist version already exists in the backend, so this delete was not applied.'
                );
              } else {
                refs.syncedPlaylistIdsRef.current.delete(queueEntry.recordId);
                refs.deletedPlaylistIdsRef.current.add(queueEntry.recordId);
                setPlaylistSyncError(null);
              }
            } else {
              const savedPlaylist = await persistPlaylistToApi(queueEntry.payload as Playlist, {
                syncQueuedAt: queueEntry.queuedAt,
              });
              reportBackendReachable();
              refs.syncedPlaylistIdsRef.current.add(savedPlaylist.id);
              refs.deletedPlaylistIdsRef.current.delete(savedPlaylist.id);
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
          if (!refs.isTimerProviderMountedRef.current) {
            return;
          }

          const failureMessage = formatApiErrorMessage(error, 'Sync failed.');
          updateQueue((currentQueue) => markSyncQueueEntryFailed(currentQueue, queueEntry.id, attemptedAt, failureMessage));

          if (queueEntry.entityType === 'timer-settings') {
            setSettingsSyncError(`${failureMessage} Local timer settings remain available in this browser.`);
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
      if (refs.isTimerProviderMountedRef.current) {
        refs.isFlushingSyncQueueRef.current = false;
      }
    });
  }, [
    canAttemptBackendSync,
    dispatch,
    queue,
    refs,
    reportBackendReachable,
    setCustomPlaySyncError,
    setIsCustomPlaySyncing,
    setIsPlaylistSyncing,
    setIsSessionLogSyncing,
    setIsSettingsSyncing,
    setPlaylistSyncError,
    setPlaylists,
    setSessionLogSyncError,
    setSettingsSyncError,
    setCustomPlays,
    updateQueue,
  ]);
}
