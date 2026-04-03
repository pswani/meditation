import type { ActiveCustomPlayRun, CustomPlay } from '../types/customPlay';
import type { LastUsedMeditation } from '../types/home';
import type { ActivePlaylistRun, Playlist } from '../types/playlist';
import type { SessionLog } from '../types/sessionLog';
import type { SankalpaGoal } from '../types/sankalpa';
import type { ActiveSession, TimerSettings } from '../types/timer';
import {
  normalizeTimerSettings,
} from './timerSettingsNormalization';
import {
  DEFAULT_END_SOUND_LABEL,
  DEFAULT_INTERVAL_SOUND_LABEL,
  DEFAULT_START_SOUND_LABEL,
  normalizeTimerSoundLabel,
} from './timerSound';

const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';
const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const CUSTOM_PLAYS_KEY = 'meditation.customPlays.v1';
const PLAYLISTS_KEY = 'meditation.playlists.v1';
const SANKALPAS_KEY = 'meditation.sankalpas.v1';
const ACTIVE_TIMER_STATE_KEY = 'meditation.activeTimerState.v1';
const ACTIVE_CUSTOM_PLAY_RUN_STATE_KEY = 'meditation.activeCustomPlayRunState.v1';
const ACTIVE_PLAYLIST_RUN_STATE_KEY = 'meditation.activePlaylistRunState.v1';
const LAST_USED_MEDITATION_KEY = 'meditation.lastUsedMeditation.v1';
const MEDITATION_TYPES = ['Vipassana', 'Ajapa', 'Tratak', 'Kriya', 'Sahaj'] as const;
const TIME_OF_DAY_BUCKETS = ['morning', 'afternoon', 'evening', 'night'] as const;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTimerSettings(value: unknown): value is TimerSettings {
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

function isMeditationType(value: unknown): value is CustomPlay['meditationType'] {
  return typeof value === 'string' && MEDITATION_TYPES.includes(value as (typeof MEDITATION_TYPES)[number]);
}

function isTimeOfDayBucket(value: unknown): value is SankalpaGoal['timeOfDayBucket'] {
  return typeof value === 'string' && TIME_OF_DAY_BUCKETS.includes(value as (typeof TIME_OF_DAY_BUCKETS)[number]);
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isFinitePositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isFiniteInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
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
  const hasValidCustomPlayFields =
    (typeof candidate.customPlayId === 'string' || typeof candidate.customPlayId === 'undefined') &&
    (typeof candidate.customPlayName === 'string' || typeof candidate.customPlayName === 'undefined') &&
    (typeof candidate.customPlayRecordingLabel === 'string' || typeof candidate.customPlayRecordingLabel === 'undefined');

  return hasValidCustomPlayFields;
}

function isSessionLog(value: unknown): value is SessionLog {
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

  if (timerMode === 'fixed' && (!isFinitePositiveNumber(intendedDurationSeconds) || candidate.completedDurationSeconds > intendedDurationSeconds)) {
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
    (candidate.source === 'auto log' || candidate.source === 'manual log') &&
    typeof candidate.startSound === 'string' &&
    typeof candidate.endSound === 'string' &&
    typeof candidate.intervalEnabled === 'boolean' &&
    isFiniteNonNegativeNumber(candidate.intervalMinutes) &&
    typeof candidate.intervalSound === 'string' &&
    isValidPlaylistFields(candidate) &&
    isValidCustomPlayFields(candidate)
  );
}

function isActiveSession(value: unknown): value is ActiveSession {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (
    !isValidIsoDate(candidate.startedAt) ||
    !isFiniteInteger(candidate.startedAtMs) ||
    (candidate.timerMode !== 'fixed' && candidate.timerMode !== 'open-ended') ||
    !isFiniteNonNegativeNumber(candidate.elapsedSeconds) ||
    typeof candidate.isPaused !== 'boolean' ||
    !(
      candidate.lastResumedAtMs === null ||
      (typeof candidate.lastResumedAtMs === 'number' && Number.isInteger(candidate.lastResumedAtMs))
    ) ||
    !(
      candidate.intendedDurationSeconds === null ||
      (typeof candidate.intendedDurationSeconds === 'number' && candidate.intendedDurationSeconds > 0)
    ) ||
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

  if (candidate.timerMode === 'open-ended' && candidate.intendedDurationSeconds !== null) {
    return false;
  }

  return candidate.lastResumedAtMs !== null || candidate.isPaused;
}

function isPlaylistRunItem(value: unknown): value is ActivePlaylistRun['items'][number] {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    isMeditationType(candidate.meditationType) &&
    isFinitePositiveNumber(candidate.durationMinutes)
  );
}

function isActivePlaylistRun(value: unknown): value is ActivePlaylistRun {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.runId !== 'string' ||
    typeof candidate.playlistId !== 'string' ||
    typeof candidate.playlistName !== 'string' ||
    !isValidIsoDate(candidate.runStartedAt) ||
    !Array.isArray(candidate.items) ||
    !isFiniteInteger(candidate.currentIndex) ||
    !isValidIsoDate(candidate.currentItemStartedAt) ||
    !isFiniteInteger(candidate.currentItemStartedAtMs) ||
    !isFiniteNonNegativeNumber(candidate.currentItemRemainingSeconds) ||
    !isFiniteInteger(candidate.currentItemEndAtMs) ||
    !isFiniteNonNegativeNumber(candidate.completedItems) ||
    !isFiniteNonNegativeNumber(candidate.completedDurationSeconds) ||
    !isFiniteNonNegativeNumber(candidate.totalIntendedDurationSeconds)
  ) {
    return false;
  }

  const validItems = candidate.items.every(isPlaylistRunItem);
  if (!validItems || candidate.items.length === 0) {
    return false;
  }

  if (candidate.currentIndex < 0 || candidate.currentIndex >= candidate.items.length) {
    return false;
  }

  return candidate.completedItems <= candidate.items.length;
}

function isActiveCustomPlayRun(value: unknown): value is ActiveCustomPlayRun {
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

function normalizeCustomPlay(value: unknown): CustomPlay | null {
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

function normalizePlaylistItem(value: unknown): Playlist['items'][number] | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string' ||
    !isMeditationType(candidate.meditationType) ||
    typeof candidate.durationMinutes !== 'number' ||
    candidate.durationMinutes <= 0
  ) {
    return null;
  }

  return {
    id: candidate.id,
    meditationType: candidate.meditationType,
    durationMinutes: candidate.durationMinutes,
  };
}

function normalizePlaylist(value: unknown): Playlist | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    typeof candidate.favorite !== 'boolean' ||
    typeof candidate.createdAt !== 'string' ||
    typeof candidate.updatedAt !== 'string' ||
    !Array.isArray(candidate.items)
  ) {
    return null;
  }

  const normalizedItems = candidate.items.map(normalizePlaylistItem).filter((entry): entry is Playlist['items'][number] => entry !== null);
  if (normalizedItems.length === 0) {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    items: normalizedItems,
    favorite: candidate.favorite,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

function normalizeSankalpa(value: unknown): SankalpaGoal | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== 'string' ||
    (candidate.goalType !== 'duration-based' && candidate.goalType !== 'session-count-based') ||
    typeof candidate.targetValue !== 'number' ||
    !Number.isFinite(candidate.targetValue) ||
    candidate.targetValue <= 0 ||
    typeof candidate.days !== 'number' ||
    !Number.isInteger(candidate.days) ||
    candidate.days <= 0 ||
    !isValidIsoDate(candidate.createdAt)
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

  if (candidate.goalType === 'session-count-based' && !Number.isInteger(candidate.targetValue)) {
    return null;
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
    createdAt: candidate.createdAt,
  };
}

function normalizeLastUsedMeditation(value: unknown): LastUsedMeditation | null {
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

export function loadTimerSettings(): TimerSettings | null {
  const raw = localStorage.getItem(TIMER_SETTINGS_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isTimerSettings(parsed)) {
      return null;
    }

    return normalizeTimerSettings(parsed);
  } catch {
    return null;
  }
}

export function saveTimerSettings(settings: TimerSettings): void {
  localStorage.setItem(TIMER_SETTINGS_KEY, JSON.stringify(settings));
}

export function loadSessionLogs(): SessionLog[] {
  const raw = localStorage.getItem(SESSION_LOGS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter(isSessionLog)
          .map((entry) => ({
            ...entry,
            timerMode: entry.timerMode ?? 'fixed',
            startSound: normalizeTimerSoundLabel(entry.startSound, DEFAULT_START_SOUND_LABEL),
            endSound: normalizeTimerSoundLabel(entry.endSound, DEFAULT_END_SOUND_LABEL),
            intervalSound: normalizeTimerSoundLabel(entry.intervalSound, DEFAULT_INTERVAL_SOUND_LABEL),
            customPlayId: entry.customPlayId ?? undefined,
            customPlayName: entry.customPlayName ?? undefined,
            customPlayRecordingLabel: entry.customPlayRecordingLabel ?? undefined,
          }))
      : [];
  } catch {
    return [];
  }
}

export function saveSessionLogs(logs: readonly SessionLog[]): void {
  localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify(logs));
}

export function loadCustomPlays(): CustomPlay[] {
  const raw = localStorage.getItem(CUSTOM_PLAYS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeCustomPlay).filter((entry): entry is CustomPlay => entry !== null) : [];
  } catch {
    return [];
  }
}

export function saveCustomPlays(customPlays: readonly CustomPlay[]): void {
  localStorage.setItem(CUSTOM_PLAYS_KEY, JSON.stringify(customPlays));
}

export function loadPlaylists(): Playlist[] {
  const raw = localStorage.getItem(PLAYLISTS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizePlaylist).filter((entry): entry is Playlist => entry !== null) : [];
  } catch {
    return [];
  }
}

export function savePlaylists(playlists: readonly Playlist[]): void {
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

export function loadSankalpas(): SankalpaGoal[] {
  const raw = localStorage.getItem(SANKALPAS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeSankalpa).filter((entry): entry is SankalpaGoal => entry !== null) : [];
  } catch {
    return [];
  }
}

export function saveSankalpas(sankalpas: readonly SankalpaGoal[]): void {
  localStorage.setItem(SANKALPAS_KEY, JSON.stringify(sankalpas));
}

export function loadLastUsedMeditation(): LastUsedMeditation | null {
  const raw = localStorage.getItem(LAST_USED_MEDITATION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return normalizeLastUsedMeditation(parsed);
  } catch {
    return null;
  }
}

export function saveLastUsedMeditation(lastUsedMeditation: LastUsedMeditation | null): void {
  if (!lastUsedMeditation) {
    localStorage.removeItem(LAST_USED_MEDITATION_KEY);
    return;
  }

  localStorage.setItem(LAST_USED_MEDITATION_KEY, JSON.stringify(lastUsedMeditation));
}

interface StoredActivePlaylistRunState {
  readonly activePlaylistRun: ActivePlaylistRun;
  readonly isPaused: boolean;
}

function normalizePersistedActiveSession(session: ActiveSession): ActiveSession {
  return {
    ...session,
    startSound: normalizeTimerSoundLabel(session.startSound, DEFAULT_START_SOUND_LABEL),
    endSound: normalizeTimerSoundLabel(session.endSound, DEFAULT_END_SOUND_LABEL),
    intervalSound: normalizeTimerSoundLabel(session.intervalSound, DEFAULT_INTERVAL_SOUND_LABEL),
    lastResumedAtMs: session.isPaused ? null : session.lastResumedAtMs,
  };
}

function normalizeLegacyActiveTimerState(activeSession: Record<string, unknown>, isPaused: boolean): ActiveSession | null {
  const intendedDurationSeconds =
    typeof activeSession.intendedDurationSeconds === 'number' && activeSession.intendedDurationSeconds > 0
      ? activeSession.intendedDurationSeconds
      : null;
  const endAtMs = typeof activeSession.endAtMs === 'number' && Number.isInteger(activeSession.endAtMs) ? activeSession.endAtMs : null;
  const storedRemainingSeconds =
    typeof activeSession.remainingSeconds === 'number' && activeSession.remainingSeconds >= 0
      ? activeSession.remainingSeconds
      : null;

  if (
    !isValidIsoDate(activeSession.startedAt) ||
    typeof activeSession.startedAtMs !== 'number' ||
    !Number.isInteger(activeSession.startedAtMs) ||
    intendedDurationSeconds === null ||
    endAtMs === null ||
    storedRemainingSeconds === null ||
    !isMeditationType(activeSession.meditationType) ||
    typeof activeSession.startSound !== 'string' ||
    typeof activeSession.endSound !== 'string' ||
    typeof activeSession.intervalEnabled !== 'boolean' ||
    typeof activeSession.intervalMinutes !== 'number' ||
    activeSession.intervalMinutes < 0 ||
    typeof activeSession.intervalSound !== 'string'
  ) {
    return null;
  }

  const nowMs = Date.now();
  const elapsedSeconds = isPaused
    ? Math.max(0, intendedDurationSeconds - storedRemainingSeconds)
    : Math.max(0, intendedDurationSeconds - Math.max(0, Math.ceil((endAtMs - nowMs) / 1000)));

  return {
    startedAt: activeSession.startedAt,
    startedAtMs: activeSession.startedAtMs,
    timerMode: 'fixed',
    intendedDurationSeconds,
    elapsedSeconds,
    isPaused,
    lastResumedAtMs: isPaused ? null : nowMs,
    meditationType: activeSession.meditationType,
    startSound: normalizeTimerSoundLabel(activeSession.startSound, DEFAULT_START_SOUND_LABEL),
    endSound: normalizeTimerSoundLabel(activeSession.endSound, DEFAULT_END_SOUND_LABEL),
    intervalEnabled: activeSession.intervalEnabled,
    intervalMinutes: activeSession.intervalMinutes,
    intervalSound: normalizeTimerSoundLabel(activeSession.intervalSound, DEFAULT_INTERVAL_SOUND_LABEL),
  };
}

export function loadActiveTimerState(): ActiveSession | null {
  const raw = localStorage.getItem(ACTIVE_TIMER_STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isActiveSession(parsed)) {
      return normalizePersistedActiveSession(parsed);
    }

    if (!isObjectRecord(parsed) || !isObjectRecord(parsed.activeSession)) {
      return null;
    }

    if (isActiveSession(parsed.activeSession)) {
      return normalizePersistedActiveSession(parsed.activeSession);
    }

    if (typeof parsed.isPaused !== 'boolean') {
      return null;
    }

    return normalizeLegacyActiveTimerState(parsed.activeSession as Record<string, unknown>, parsed.isPaused);
  } catch {
    return null;
  }
}

export function saveActiveTimerState(activeSession: ActiveSession | null): void {
  if (!activeSession) {
    localStorage.removeItem(ACTIVE_TIMER_STATE_KEY);
    return;
  }

  localStorage.setItem(
    ACTIVE_TIMER_STATE_KEY,
    JSON.stringify(normalizePersistedActiveSession(activeSession))
  );
}

export function loadActiveCustomPlayRunState(): ActiveCustomPlayRun | null {
  const raw = localStorage.getItem(ACTIVE_CUSTOM_PLAY_RUN_STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isActiveCustomPlayRun(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveActiveCustomPlayRunState(activeCustomPlayRun: ActiveCustomPlayRun | null): void {
  if (!activeCustomPlayRun) {
    localStorage.removeItem(ACTIVE_CUSTOM_PLAY_RUN_STATE_KEY);
    return;
  }

  localStorage.setItem(ACTIVE_CUSTOM_PLAY_RUN_STATE_KEY, JSON.stringify(activeCustomPlayRun));
}

export function loadActivePlaylistRunState(): StoredActivePlaylistRunState | null {
  const raw = localStorage.getItem(ACTIVE_PLAYLIST_RUN_STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;
    if (!isActivePlaylistRun(candidate.activePlaylistRun) || typeof candidate.isPaused !== 'boolean') {
      return null;
    }

    return {
      activePlaylistRun: candidate.activePlaylistRun,
      isPaused: candidate.isPaused,
    };
  } catch {
    return null;
  }
}

export function saveActivePlaylistRunState(activePlaylistRun: ActivePlaylistRun | null, isPaused: boolean): void {
  if (!activePlaylistRun) {
    localStorage.removeItem(ACTIVE_PLAYLIST_RUN_STATE_KEY);
    return;
  }

  localStorage.setItem(
    ACTIVE_PLAYLIST_RUN_STATE_KEY,
    JSON.stringify({
      activePlaylistRun,
      isPaused,
    } satisfies StoredActivePlaylistRunState)
  );
}
