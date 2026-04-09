import type { ActiveCustomPlayRun, CustomPlay } from '../../types/customPlay';
import type { LastUsedMeditation } from '../../types/home';
import type { MediaAssetMetadata } from '../../types/mediaAsset';
import type { ActivePlaylistRun, Playlist } from '../../types/playlist';
import {
  isMeditationType as isReferenceMeditationType,
  isSessionLogSource,
  isTimeOfDayBucket as isReferenceTimeOfDayBucket,
} from '../../types/referenceData';
import type { SessionLog } from '../../types/sessionLog';
import type { SankalpaGoal } from '../../types/sankalpa';
import type { ActiveSession, TimerSettings } from '../../types/timer';
import type { SummarySnapshotData } from '../summary';
import { normalizeTimerSettings } from '../timerSettingsNormalization';
import {
  DEFAULT_END_SOUND_LABEL,
  DEFAULT_START_SOUND_LABEL,
  normalizeTimerSoundLabel,
} from '../timerSound';

export const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';
export const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
export const CUSTOM_PLAYS_KEY = 'meditation.customPlays.v1';
export const PLAYLISTS_KEY = 'meditation.playlists.v1';
export const SANKALPAS_KEY = 'meditation.sankalpas.v1';
export const ACTIVE_TIMER_STATE_KEY = 'meditation.activeTimerState.v1';
export const ACTIVE_CUSTOM_PLAY_RUN_STATE_KEY = 'meditation.activeCustomPlayRunState.v1';
export const ACTIVE_PLAYLIST_RUN_STATE_KEY = 'meditation.activePlaylistRunState.v1';
export const LAST_USED_MEDITATION_KEY = 'meditation.lastUsedMeditation.v1';
export const MEDIA_ASSET_CATALOG_CACHE_KEY = 'meditation.mediaAssetCatalogCache.v1';
export const SUMMARY_SNAPSHOT_CACHE_KEY = 'meditation.summarySnapshotCache.v1';

export function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

export function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function isFiniteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

export function isMeditationType(value: unknown): value is CustomPlay['meditationType'] {
  return isReferenceMeditationType(value);
}

export function isTimeOfDayBucket(value: unknown): value is SankalpaGoal['timeOfDayBucket'] {
  return isReferenceTimeOfDayBucket(value);
}

export function isTimerSettings(value: unknown): value is TimerSettings {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.timerMode === 'fixed' || candidate.timerMode === 'open-ended' || typeof candidate.timerMode === 'undefined') &&
    (typeof candidate.durationMinutes === 'number' || candidate.durationMinutes === null || typeof candidate.durationMinutes === 'undefined') &&
    (typeof candidate.lastFixedDurationMinutes === 'number' || typeof candidate.lastFixedDurationMinutes === 'undefined') &&
    typeof candidate.meditationType === 'string' &&
    typeof candidate.startSound === 'string' &&
    typeof candidate.endSound === 'string' &&
    typeof candidate.intervalEnabled === 'boolean' &&
    typeof candidate.intervalMinutes === 'number' &&
    (typeof candidate.intervalSound === 'string' || typeof candidate.intervalSound === 'undefined')
  );
}

function isValidPlaylistFields(candidate: Record<string, unknown>): boolean {
  const hasValidPlaylistFields =
    (typeof candidate.playlistId === 'string' || typeof candidate.playlistId === 'undefined') &&
    (typeof candidate.playlistName === 'string' || typeof candidate.playlistName === 'undefined') &&
    (typeof candidate.playlistRunId === 'string' || typeof candidate.playlistRunId === 'undefined') &&
    (typeof candidate.playlistRunStartedAt === 'string' || typeof candidate.playlistRunStartedAt === 'undefined') &&
    (typeof candidate.playlistItemPosition === 'number' || typeof candidate.playlistItemPosition === 'undefined') &&
    (typeof candidate.playlistItemCount === 'number' || typeof candidate.playlistItemCount === 'undefined');

  if (!hasValidPlaylistFields) {
    return false;
  }

  if (typeof candidate.playlistRunStartedAt === 'string' && !isValidIsoDate(candidate.playlistRunStartedAt)) {
    return false;
  }

  if (typeof candidate.playlistItemPosition === 'number' && (!Number.isInteger(candidate.playlistItemPosition) || candidate.playlistItemPosition <= 0)) {
    return false;
  }

  if (typeof candidate.playlistItemCount === 'number' && (!Number.isInteger(candidate.playlistItemCount) || candidate.playlistItemCount <= 0)) {
    return false;
  }

  if (
    typeof candidate.playlistItemPosition === 'number' &&
    typeof candidate.playlistItemCount === 'number' &&
    candidate.playlistItemPosition > candidate.playlistItemCount
  ) {
    return false;
  }

  return true;
}

function isValidCustomPlayFields(candidate: Record<string, unknown>): boolean {
  return (
    (typeof candidate.customPlayId === 'string' || typeof candidate.customPlayId === 'undefined') &&
    (typeof candidate.customPlayName === 'string' || typeof candidate.customPlayName === 'undefined') &&
    (typeof candidate.customPlayRecordingLabel === 'string' || typeof candidate.customPlayRecordingLabel === 'undefined')
  );
}

export function isMediaAssetMetadata(value: unknown): value is MediaAssetMetadata {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.label === 'string' &&
    (typeof candidate.meditationType === 'undefined' ||
      candidate.meditationType === null ||
      isMeditationType(candidate.meditationType)) &&
    typeof candidate.filePath === 'string' &&
    typeof candidate.relativePath === 'string' &&
    typeof candidate.durationSeconds === 'number' &&
    typeof candidate.mimeType === 'string' &&
    typeof candidate.sizeBytes === 'number' &&
    isValidIsoDate(candidate.updatedAt)
  );
}

export function isSummarySnapshotData(value: unknown): value is SummarySnapshotData {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const overall = candidate.overallSummary;
  const byType = candidate.byTypeSummary;
  const bySource = candidate.bySourceSummary;
  const byTimeOfDay = candidate.byTimeOfDaySummary;

  return (
    isObjectRecord(overall) &&
    typeof overall.totalSessionLogs === 'number' &&
    typeof overall.completedSessionLogs === 'number' &&
    typeof overall.endedEarlySessionLogs === 'number' &&
    typeof overall.totalDurationSeconds === 'number' &&
    typeof overall.averageDurationSeconds === 'number' &&
    typeof overall.autoLogs === 'number' &&
    typeof overall.manualLogs === 'number' &&
    Array.isArray(byType) &&
    byType.every(
      (entry) =>
        isObjectRecord(entry) &&
        isMeditationType(entry.meditationType) &&
        typeof entry.sessionLogs === 'number' &&
        typeof entry.totalDurationSeconds === 'number'
    ) &&
    Array.isArray(bySource) &&
    bySource.every(
      (entry) =>
        isObjectRecord(entry) &&
        isSessionLogSource(entry.source) &&
        typeof entry.sessionLogs === 'number' &&
        typeof entry.completedSessionLogs === 'number' &&
        typeof entry.endedEarlySessionLogs === 'number' &&
        typeof entry.totalDurationSeconds === 'number'
    ) &&
    Array.isArray(byTimeOfDay) &&
    byTimeOfDay.every(
      (entry) =>
        isObjectRecord(entry) &&
        isReferenceTimeOfDayBucket(entry.timeOfDayBucket) &&
        typeof entry.sessionLogs === 'number' &&
        typeof entry.completedSessionLogs === 'number' &&
        typeof entry.endedEarlySessionLogs === 'number' &&
        typeof entry.totalDurationSeconds === 'number'
    )
  );
}

export function isSessionLog(value: unknown): value is SessionLog {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (
    !isMeditationType(candidate.meditationType) ||
    !isValidIsoDate(candidate.startedAt) ||
    !isValidIsoDate(candidate.endedAt) ||
    !isFiniteNonNegativeNumber(candidate.completedDurationSeconds)
  ) {
    return false;
  }

  const timerMode = candidate.timerMode === 'open-ended' ? 'open-ended' : 'fixed';
  const intendedDurationSeconds =
    typeof candidate.intendedDurationSeconds === 'number' ? candidate.intendedDurationSeconds : candidate.intendedDurationSeconds === null ? null : undefined;

  if (timerMode === 'fixed' && !isFinitePositiveNumber(intendedDurationSeconds)) {
    return false;
  }

  if (
    timerMode === 'fixed' &&
    candidate.status === 'ended early' &&
    isFinitePositiveNumber(intendedDurationSeconds) &&
    candidate.completedDurationSeconds > intendedDurationSeconds
  ) {
    return false;
  }

  if (timerMode === 'open-ended' && intendedDurationSeconds !== null && typeof intendedDurationSeconds !== 'undefined') {
    return false;
  }

  if (Date.parse(candidate.endedAt) < Date.parse(candidate.startedAt)) {
    return false;
  }

  return (
    typeof candidate.id === 'string' &&
    (candidate.timerMode === 'fixed' || candidate.timerMode === 'open-ended' || typeof candidate.timerMode === 'undefined') &&
    (candidate.status === 'completed' || candidate.status === 'ended early') &&
    isSessionLogSource(candidate.source) &&
    typeof candidate.startSound === 'string' &&
    typeof candidate.endSound === 'string' &&
    typeof candidate.intervalEnabled === 'boolean' &&
    isFiniteNonNegativeNumber(candidate.intervalMinutes) &&
    typeof candidate.intervalSound === 'string' &&
    isValidPlaylistFields(candidate) &&
    isValidCustomPlayFields(candidate)
  );
}

export function isActiveSession(value: unknown): value is ActiveSession {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (
    !isValidIsoDate(candidate.startedAt) ||
    !isFiniteInteger(candidate.startedAtMs) ||
    (candidate.timerMode !== 'fixed' && candidate.timerMode !== 'open-ended') ||
    (candidate.intendedDurationSeconds !== null && candidate.intendedDurationSeconds !== undefined && !isFinitePositiveNumber(candidate.intendedDurationSeconds)) ||
    !isFiniteNonNegativeNumber(candidate.elapsedSeconds) ||
    typeof candidate.isPaused !== 'boolean' ||
    (candidate.lastResumedAtMs !== null && candidate.lastResumedAtMs !== undefined && !isFiniteInteger(candidate.lastResumedAtMs)) ||
    !isMeditationType(candidate.meditationType) ||
    typeof candidate.startSound !== 'string' ||
    typeof candidate.endSound !== 'string' ||
    typeof candidate.intervalEnabled !== 'boolean' ||
    !isFiniteNonNegativeNumber(candidate.intervalMinutes) ||
    typeof candidate.intervalSound !== 'string'
  ) {
    return false;
  }

  if (candidate.timerMode === 'fixed' && candidate.intendedDurationSeconds === null) {
    return false;
  }

  return !(candidate.isPaused === false && candidate.lastResumedAtMs === null);
}

function isPlaylistRunItem(value: unknown): value is ActivePlaylistRun['items'][number] {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    isMeditationType(candidate.meditationType) &&
    isFinitePositiveNumber(candidate.durationMinutes) &&
    (typeof candidate.customPlayId === 'undefined' || typeof candidate.customPlayId === 'string') &&
    (typeof candidate.customPlayName === 'undefined' || typeof candidate.customPlayName === 'string') &&
    (typeof candidate.customPlayRecordingLabel === 'undefined' || typeof candidate.customPlayRecordingLabel === 'string') &&
    (typeof candidate.mediaAssetId === 'undefined' || typeof candidate.mediaAssetId === 'string') &&
    (typeof candidate.mediaLabel === 'undefined' || typeof candidate.mediaLabel === 'string') &&
    (typeof candidate.mediaFilePath === 'undefined' || typeof candidate.mediaFilePath === 'string') &&
    typeof candidate.startSound === 'string' &&
    typeof candidate.endSound === 'string'
  );
}

function isActivePlaylistRunSegment(value: unknown): value is ActivePlaylistRun['currentSegment'] {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (
    !isValidIsoDate(candidate.startedAt) ||
    !isFiniteInteger(candidate.startedAtMs) ||
    !isFiniteNonNegativeNumber(candidate.remainingSeconds) ||
    !isFiniteInteger(candidate.endAtMs)
  ) {
    return false;
  }

  if (candidate.phase === 'gap') {
    return true;
  }

  return candidate.phase === 'item' && isFiniteNonNegativeNumber(candidate.elapsedSeconds);
}

export function isActivePlaylistRun(value: unknown): value is ActivePlaylistRun {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.runId === 'string' &&
    typeof candidate.playlistId === 'string' &&
    typeof candidate.playlistName === 'string' &&
    isValidIsoDate(candidate.runStartedAt) &&
    Array.isArray(candidate.items) &&
    candidate.items.every(isPlaylistRunItem) &&
    isFiniteNonNegativeNumber(candidate.smallGapSeconds) &&
    isFiniteInteger(candidate.currentIndex) &&
    isActivePlaylistRunSegment(candidate.currentSegment) &&
    isFiniteNonNegativeNumber(candidate.completedItems) &&
    isFiniteNonNegativeNumber(candidate.completedDurationSeconds) &&
    isFiniteNonNegativeNumber(candidate.totalIntendedDurationSeconds)
  );
}

export function isActiveCustomPlayRun(value: unknown): value is ActiveCustomPlayRun {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.runId === 'string' &&
    typeof candidate.customPlayId === 'string' &&
    typeof candidate.customPlayName === 'string' &&
    isMeditationType(candidate.meditationType) &&
    typeof candidate.recordingLabel === 'string' &&
    typeof candidate.mediaAssetId === 'string' &&
    typeof candidate.mediaLabel === 'string' &&
    typeof candidate.mediaFilePath === 'string' &&
    isFinitePositiveNumber(candidate.durationSeconds) &&
    isValidIsoDate(candidate.startedAt) &&
    isFiniteInteger(candidate.startedAtMs) &&
    isFiniteNonNegativeNumber(candidate.currentPositionSeconds) &&
    typeof candidate.isPaused === 'boolean' &&
    typeof candidate.startSound === 'string' &&
    typeof candidate.endSound === 'string'
  );
}

export function normalizeCustomPlay(value: unknown): CustomPlay | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    !isMeditationType(candidate.meditationType) ||
    typeof candidate.durationMinutes !== 'number' ||
    candidate.durationMinutes <= 0 ||
    typeof candidate.favorite !== 'boolean' ||
    typeof candidate.createdAt !== 'string' ||
    typeof candidate.updatedAt !== 'string'
  ) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    meditationType: candidate.meditationType,
    durationMinutes: candidate.durationMinutes,
    startSound: normalizeTimerSoundLabel(candidate.startSound as string | undefined, DEFAULT_START_SOUND_LABEL),
    endSound: normalizeTimerSoundLabel(candidate.endSound as string | undefined, DEFAULT_END_SOUND_LABEL),
    mediaAssetId: typeof candidate.mediaAssetId === 'string' ? candidate.mediaAssetId : '',
    recordingLabel: typeof candidate.recordingLabel === 'string' ? candidate.recordingLabel : '',
    favorite: candidate.favorite,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

export function normalizePlaylistItem(value: unknown): Playlist['items'][number] | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string' ||
    (typeof candidate.title !== 'string' && typeof candidate.title !== 'undefined') ||
    !isMeditationType(candidate.meditationType) ||
    typeof candidate.durationMinutes !== 'number' ||
    candidate.durationMinutes <= 0 ||
    (typeof candidate.customPlayId !== 'undefined' && typeof candidate.customPlayId !== 'string')
  ) {
    return null;
  }

  return {
    id: candidate.id,
    title:
      typeof candidate.title === 'string' && candidate.title.trim().length > 0
        ? candidate.title
        : candidate.meditationType,
    meditationType: candidate.meditationType,
    durationMinutes: candidate.durationMinutes,
    customPlayId: typeof candidate.customPlayId === 'string' && candidate.customPlayId.length > 0 ? candidate.customPlayId : undefined,
  };
}

export function normalizePlaylist(value: unknown): Playlist | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    (typeof candidate.smallGapSeconds !== 'number' && typeof candidate.smallGapSeconds !== 'undefined') ||
    typeof candidate.favorite !== 'boolean' ||
    typeof candidate.createdAt !== 'string' ||
    typeof candidate.updatedAt !== 'string' ||
    !Array.isArray(candidate.items)
  ) {
    return null;
  }

  const items = candidate.items
    .map(normalizePlaylistItem)
    .filter((entry): entry is Playlist['items'][number] => entry !== null);
  if (items.length === 0) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    items,
    smallGapSeconds:
      typeof candidate.smallGapSeconds === 'number' && Number.isInteger(candidate.smallGapSeconds) && candidate.smallGapSeconds >= 0
        ? candidate.smallGapSeconds
        : 0,
    favorite: candidate.favorite,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

export function normalizeSankalpa(value: unknown): SankalpaGoal | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const observanceRecords =
    Array.isArray(candidate.observanceRecords)
      ? candidate.observanceRecords
          .filter((entry): entry is Record<string, unknown> => isObjectRecord(entry))
          .filter(
            (entry) =>
              typeof entry.date === 'string' &&
              /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
              (entry.status === 'observed' || entry.status === 'missed')
          )
          .map((entry) => ({
            date: entry.date as string,
            status: entry.status as 'observed' | 'missed',
          }))
      : [];

  if (
    typeof candidate.id !== 'string' ||
    (candidate.goalType !== 'duration-based' &&
      candidate.goalType !== 'session-count-based' &&
      candidate.goalType !== 'observance-based') ||
    typeof candidate.targetValue !== 'number' ||
    !Number.isFinite(candidate.targetValue) ||
    candidate.targetValue <= 0 ||
    typeof candidate.days !== 'number' ||
    !Number.isInteger(candidate.days) ||
    candidate.days <= 0 ||
    !isValidIsoDate(candidate.createdAt) ||
    (typeof candidate.observanceLabel !== 'undefined' && typeof candidate.observanceLabel !== 'string') ||
    (typeof candidate.archived !== 'undefined' && typeof candidate.archived !== 'boolean')
  ) {
    return null;
  }

  if (
    typeof candidate.meditationType !== 'undefined' &&
    candidate.meditationType !== '' &&
    !isMeditationType(candidate.meditationType)
  ) {
    return null;
  }

  if (
    typeof candidate.timeOfDayBucket !== 'undefined' &&
    candidate.timeOfDayBucket !== '' &&
    !isTimeOfDayBucket(candidate.timeOfDayBucket)
  ) {
    return null;
  }

  if (
    (candidate.goalType === 'session-count-based' || candidate.goalType === 'observance-based') &&
    !Number.isInteger(candidate.targetValue)
  ) {
    return null;
  }

  if (candidate.goalType === 'observance-based') {
    if (
      typeof candidate.observanceLabel !== 'string' ||
      candidate.observanceLabel.trim().length === 0 ||
      candidate.targetValue !== candidate.days
    ) {
      return null;
    }
  }

  return {
    id: candidate.id,
    goalType: candidate.goalType,
    targetValue: candidate.targetValue,
    days: candidate.days,
    meditationType:
      typeof candidate.meditationType === 'string' && candidate.meditationType !== '' ? candidate.meditationType : undefined,
    timeOfDayBucket:
      typeof candidate.timeOfDayBucket === 'string' && candidate.timeOfDayBucket !== '' ? candidate.timeOfDayBucket : undefined,
    observanceLabel:
      typeof candidate.observanceLabel === 'string' && candidate.observanceLabel.trim().length > 0
        ? candidate.observanceLabel.trim()
        : undefined,
    observanceRecords: candidate.goalType === 'observance-based' ? observanceRecords : undefined,
    createdAt: candidate.createdAt,
    archived: candidate.archived === true,
  };
}

export function normalizeLastUsedMeditation(value: unknown): LastUsedMeditation | null {
  if (!isObjectRecord(value) || !isValidIsoDate(value.usedAt)) {
    return null;
  }

  if (value.kind === 'timer' && isTimerSettings(value.settings)) {
    return {
      kind: 'timer',
      settings: normalizeTimerSettings(value.settings),
      usedAt: value.usedAt,
    };
  }

  if (value.kind === 'playlist' && typeof value.playlistId === 'string' && typeof value.playlistName === 'string') {
    return {
      kind: 'playlist',
      playlistId: value.playlistId,
      playlistName: value.playlistName,
      usedAt: value.usedAt,
    };
  }

  if (value.kind === 'custom-play' && typeof value.customPlayId === 'string' && typeof value.customPlayName === 'string') {
    return {
      kind: 'custom-play',
      customPlayId: value.customPlayId,
      customPlayName: value.customPlayName,
      usedAt: value.usedAt,
    };
  }

  return null;
}
