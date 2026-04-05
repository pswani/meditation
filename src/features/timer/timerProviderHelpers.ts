import type { MutableRefObject } from 'react';
import type { ActiveCustomPlayRun, CustomPlay } from '../../types/customPlay';
import type { LastUsedMeditation } from '../../types/home';
import type { ActivePlaylistRun, Playlist } from '../../types/playlist';
import type { SessionLog } from '../../types/sessionLog';
import type { SyncQueueEntry } from '../../types/sync';
import type { ActiveSession, TimerSettings } from '../../types/timer';
import { isApiClientError, isBackendReachabilityError } from '../../utils/apiClient';
import {
  loadActiveCustomPlayRunState,
  loadActivePlaylistRunState,
  loadActiveTimerState,
  loadCustomPlays,
  loadPlaylists,
  loadSessionLogs,
  loadTimerSettings,
  saveLastUsedMeditation,
} from '../../utils/storage';
import { enqueueSyncQueueEntry } from '../../utils/syncQueue';
import { normalizeTimerSettings } from '../../utils/timerSettingsNormalization';
import { defaultTimerSettings } from './constants';
import { mergeEntriesById } from './queueCollectionSync';
import {
  getPlaylistItemDurationSeconds,
  getPlaylistRunCurrentItem,
  isAudioBackedPlaylistItem,
} from '../../utils/playlistRuntime';
import {
  buildTimerSoundPlaybackMessage,
  type TimerSoundCue,
  type TimerSoundPlayer,
} from './timerSoundPlayback';
import { getActiveSessionElapsedSeconds } from './time';
import type { SyncConnectionMode } from '../sync/syncContextObject';

export interface TimerHydration {
  readonly activeSession: ActiveSession | null;
  readonly activeCustomPlayRun: ActiveCustomPlayRun | null;
  readonly activePlaylistRun: ActivePlaylistRun | null;
  readonly isPlaylistRunPaused: boolean;
  readonly recoveryMessage: string | null;
}

export interface TimerBootstrap {
  readonly settings: TimerSettings;
  readonly sessionLogs: ReturnType<typeof loadSessionLogs>;
  readonly customPlays: ReturnType<typeof loadCustomPlays>;
  readonly playlists: ReturnType<typeof loadPlaylists>;
  readonly hydration: TimerHydration;
  readonly skipInitialActiveTimerPersist: boolean;
  readonly skipInitialActiveCustomPlayPersist: boolean;
  readonly skipInitialActivePlaylistPersist: boolean;
}

export const TIMER_CONTEXT_SYNC_ENTITY_TYPES = ['timer-settings', 'session-log', 'custom-play', 'playlist'] as const;

export function serializeActiveTimerPersistence(activeSession: ActiveSession | null): string {
  return activeSession ? JSON.stringify(activeSession) : 'null';
}

export function serializeActiveCustomPlayPersistence(activeCustomPlayRun: ActiveCustomPlayRun | null): string {
  return activeCustomPlayRun ? JSON.stringify(activeCustomPlayRun) : 'null';
}

export function serializeActivePlaylistPersistence(activePlaylistRun: ActivePlaylistRun | null, isPaused: boolean): string {
  return activePlaylistRun
    ? JSON.stringify({
        activePlaylistRun,
        isPaused,
      })
    : 'null';
}

function recoverActiveSession(
  storedActiveSession: ActiveSession | null,
  nowMs: number
): { readonly activeSession: ActiveSession | null; readonly recoveryMessage: string | null } {
  if (!storedActiveSession) {
    return {
      activeSession: null,
      recoveryMessage: null,
    };
  }

  const elapsedSeconds = getActiveSessionElapsedSeconds(storedActiveSession, nowMs);
  if (
    storedActiveSession.timerMode === 'fixed' &&
    storedActiveSession.intendedDurationSeconds !== null &&
    elapsedSeconds >= storedActiveSession.intendedDurationSeconds
  ) {
    return {
      activeSession: null,
      recoveryMessage: 'Your previous active timer was cleared because it could not be safely resumed.',
    };
  }

  if (storedActiveSession.isPaused) {
    return {
      activeSession: {
        ...storedActiveSession,
        elapsedSeconds,
        isPaused: true,
        lastResumedAtMs: null,
      },
      recoveryMessage: 'Recovered a paused timer from your previous app state.',
    };
  }

  return {
    activeSession: {
      ...storedActiveSession,
      elapsedSeconds,
      lastResumedAtMs: nowMs,
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

  const remainingSeconds = Math.ceil((storedActivePlaylistRun.currentSegment.endAtMs - nowMs) / 1000);
  if (remainingSeconds <= 0) {
    return {
      activePlaylistRun: null,
      recoveryMessage: 'Your previous playlist run was cleared because it could not be safely resumed.',
    };
  }

  if (storedActivePlaylistRun.currentSegment.phase === 'gap') {
    return {
      activePlaylistRun: {
        ...storedActivePlaylistRun,
        currentSegment: {
          ...storedActivePlaylistRun.currentSegment,
          remainingSeconds,
          endAtMs: nowMs + remainingSeconds * 1000,
        },
      },
      recoveryMessage: 'Recovered an active playlist run from your previous app state.',
    };
  }

  const currentItem = getPlaylistRunCurrentItem(storedActivePlaylistRun);
  const durationSeconds = currentItem ? getPlaylistItemDurationSeconds(currentItem) : remainingSeconds;

  if (currentItem && isAudioBackedPlaylistItem(currentItem)) {
    if (storedActivePlaylistRun.currentSegment.elapsedSeconds >= durationSeconds) {
      return {
        activePlaylistRun: null,
        recoveryMessage: 'Your previous playlist run was cleared because it could not be safely resumed.',
      };
    }

    return {
      activePlaylistRun: {
        ...storedActivePlaylistRun,
        currentSegment: {
          ...storedActivePlaylistRun.currentSegment,
          startedAt: new Date(nowMs - storedActivePlaylistRun.currentSegment.elapsedSeconds * 1000).toISOString(),
          startedAtMs: nowMs - storedActivePlaylistRun.currentSegment.elapsedSeconds * 1000,
          remainingSeconds: Math.max(0, durationSeconds - storedActivePlaylistRun.currentSegment.elapsedSeconds),
          endAtMs: nowMs + Math.max(0, durationSeconds - storedActivePlaylistRun.currentSegment.elapsedSeconds) * 1000,
        },
      },
      recoveryMessage: 'Recovered an active playlist run from your previous app state.',
    };
  }

  return {
    activePlaylistRun: {
      ...storedActivePlaylistRun,
      currentSegment: {
        ...storedActivePlaylistRun.currentSegment,
        elapsedSeconds: Math.max(0, durationSeconds - remainingSeconds),
        remainingSeconds,
        endAtMs: nowMs + remainingSeconds * 1000,
      },
    },
    recoveryMessage: 'Recovered an active playlist run from your previous app state.',
  };
}

function recoverActiveCustomPlayRun(
  storedActiveCustomPlayRun: ActiveCustomPlayRun | null
): { readonly activeCustomPlayRun: ActiveCustomPlayRun | null; readonly recoveryMessage: string | null } {
  if (!storedActiveCustomPlayRun) {
    return {
      activeCustomPlayRun: null,
      recoveryMessage: null,
    };
  }

  if (storedActiveCustomPlayRun.currentPositionSeconds >= storedActiveCustomPlayRun.durationSeconds) {
    return {
      activeCustomPlayRun: null,
      recoveryMessage: 'Your previous custom play was cleared because it could not be safely resumed.',
    };
  }

  return {
    activeCustomPlayRun: storedActiveCustomPlayRun,
    recoveryMessage: storedActiveCustomPlayRun.isPaused
      ? 'Recovered a paused custom play from your previous app state.'
      : 'Recovered an active custom play from your previous app state.',
  };
}

function createTimerHydration(
  storedTimerState: ReturnType<typeof loadActiveTimerState>,
  storedCustomPlayRunState: ReturnType<typeof loadActiveCustomPlayRunState>,
  storedPlaylistRunState: ReturnType<typeof loadActivePlaylistRunState>,
  nowMs: number
): TimerHydration {
  const recoveredActiveSession = recoverActiveSession(storedTimerState, nowMs);
  const recoveredCustomPlayRun = recoverActiveCustomPlayRun(storedCustomPlayRunState);
  const recoveredPlaylistRun = recoverActivePlaylistRun(
    storedPlaylistRunState?.activePlaylistRun ?? null,
    storedPlaylistRunState?.isPaused ?? false,
    nowMs
  );

  return {
    activeSession: recoveredActiveSession.activeSession,
    activeCustomPlayRun: recoveredCustomPlayRun.activeCustomPlayRun,
    activePlaylistRun: recoveredPlaylistRun.activePlaylistRun,
    isPlaylistRunPaused: recoveredPlaylistRun.activePlaylistRun ? (storedPlaylistRunState?.isPaused ?? false) : false,
    recoveryMessage:
      recoveredActiveSession.recoveryMessage ??
      recoveredCustomPlayRun.recoveryMessage ??
      recoveredPlaylistRun.recoveryMessage,
  };
}

export function createTimerBootstrap(nowMs: number): TimerBootstrap {
  const settings = loadTimerSettings() ?? defaultTimerSettings;
  const sessionLogs = loadSessionLogs();
  const customPlays = loadCustomPlays();
  const playlists = loadPlaylists();
  const storedTimerState = loadActiveTimerState();
  const storedCustomPlayRunState = loadActiveCustomPlayRunState();
  const storedPlaylistRunState = loadActivePlaylistRunState();
  const hydration = createTimerHydration(storedTimerState, storedCustomPlayRunState, storedPlaylistRunState, nowMs);

  return {
    settings,
    sessionLogs,
    customPlays,
    playlists,
    hydration,
    skipInitialActiveTimerPersist: serializeActiveTimerPersistence(hydration.activeSession) === serializeActiveTimerPersistence(storedTimerState),
    skipInitialActiveCustomPlayPersist:
      serializeActiveCustomPlayPersistence(hydration.activeCustomPlayRun) ===
      serializeActiveCustomPlayPersistence(storedCustomPlayRunState),
    skipInitialActivePlaylistPersist:
      serializeActivePlaylistPersistence(hydration.activePlaylistRun, hydration.isPlaylistRunPaused) ===
      serializeActivePlaylistPersistence(storedPlaylistRunState?.activePlaylistRun ?? null, storedPlaylistRunState?.isPaused ?? false),
  };
}

export function mergeSessionLogs(primary: readonly SessionLog[], secondary: readonly SessionLog[]) {
  return mergeEntriesById(primary, secondary, (left, right) => Date.parse(right.endedAt) - Date.parse(left.endedAt));
}

export function mergeCustomPlays(primary: readonly CustomPlay[], secondary: readonly CustomPlay[]) {
  return mergeEntriesById(primary, secondary, (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export function mergePlaylists(primary: readonly Playlist[], secondary: readonly Playlist[]) {
  return mergeEntriesById(primary, secondary, (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export function formatApiErrorMessage(error: unknown, fallbackMessage: string): string {
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

export function isNetworkError(error: unknown): boolean {
  return isBackendReachabilityError(error);
}

export function buildOfflineCacheMessage(
  connectionMode: SyncConnectionMode,
  entityLabel: string,
  hasLocalData: boolean
): string | null {
  if (!hasLocalData) {
    return null;
  }

  if (connectionMode === 'backend-unreachable') {
    return `Showing locally saved ${entityLabel} because the backend is unavailable right now.`;
  }

  return `Showing locally saved ${entityLabel} while you are offline.`;
}

export function buildQueuedSaveMessage(connectionMode: SyncConnectionMode, entityLabel: string): string {
  if (connectionMode === 'backend-unreachable') {
    return `Saved locally because the backend is unavailable. This ${entityLabel} will sync when the backend is reachable.`;
  }

  return `Saved locally while offline. This ${entityLabel} will sync when the backend is reachable.`;
}

export function buildQueuedDeleteMessage(connectionMode: SyncConnectionMode, entityLabel: string): string {
  if (connectionMode === 'backend-unreachable') {
    return `Removed locally because the backend is unavailable. This ${entityLabel} change will sync when the backend is reachable.`;
  }

  return `Removed locally while offline. This ${entityLabel} change will sync when the backend is reachable.`;
}

export function mergeQueueEntry(
  updateQueue: (updater: (current: readonly SyncQueueEntry[]) => readonly SyncQueueEntry[]) => void,
  nextEntry: Parameters<typeof enqueueSyncQueueEntry>[1]
) {
  updateQueue((current) => enqueueSyncQueueEntry(current, nextEntry));
}

export function applyQueuedTimerSettings(
  currentSettings: TimerSettings,
  queuedEntries: readonly SyncQueueEntry[]
): TimerSettings {
  const latestQueuedEntry = selectLatestQueuedTimerSettingsEntry(queuedEntries);

  return latestQueuedEntry ? normalizeTimerSettings(latestQueuedEntry.payload as TimerSettings) : currentSettings;
}

export function selectLatestQueuedTimerSettingsEntry(queueEntries: readonly SyncQueueEntry[]): SyncQueueEntry | null {
  const latestQueuedSettingsEntry = [...queueEntries]
    .reverse()
    .find((entry) => entry.entityType === 'timer-settings' && entry.operation === 'upsert');

  return latestQueuedSettingsEntry ?? null;
}

export function replaceQueueEntryPayload(
  updateQueue: (updater: (current: readonly SyncQueueEntry[]) => readonly SyncQueueEntry[]) => void,
  entryId: string,
  payload: unknown
) {
  updateQueue((current) => current.map((entry) => (entry.id === entryId ? { ...entry, payload } : entry)));
}

export function recordLastUsedMeditation(
  setLastUsedMeditation: (lastUsedMeditation: LastUsedMeditation | null) => void,
  nextLastUsedMeditation: LastUsedMeditation
) {
  setLastUsedMeditation(nextLastUsedMeditation);
  saveLastUsedMeditation(nextLastUsedMeditation);
}

export function clearLastUsedMeditationRecord(
  setLastUsedMeditation: (lastUsedMeditation: LastUsedMeditation | null) => void
) {
  setLastUsedMeditation(null);
  saveLastUsedMeditation(null);
}

export async function attemptTimerSoundPlayback(
  player: TimerSoundPlayer,
  handledMessageKeyRef: MutableRefObject<string | null>,
  setTimerSoundPlaybackMessage: (message: string | null) => void,
  label: string,
  cue: TimerSoundCue
) {
  const result = await player.play(label, cue);
  if (result.status !== 'failed') {
    return;
  }

  const messageKey = `${result.cue}:${result.label}:${result.reason}:${result.filePath ?? 'none'}`;
  if (handledMessageKeyRef.current === messageKey) {
    return;
  }

  handledMessageKeyRef.current = messageKey;
  setTimerSoundPlaybackMessage(buildTimerSoundPlaybackMessage(result));
}
