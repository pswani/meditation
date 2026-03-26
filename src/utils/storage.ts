import type { CustomPlay } from '../types/customPlay';
import type { ActivePlaylistRun, Playlist } from '../types/playlist';
import type { SessionLog } from '../types/sessionLog';
import type { SankalpaGoal } from '../types/sankalpa';
import type { ActiveSession, TimerSettings } from '../types/timer';

const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';
const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const CUSTOM_PLAYS_KEY = 'meditation.customPlays.v1';
const PLAYLISTS_KEY = 'meditation.playlists.v1';
const SANKALPAS_KEY = 'meditation.sankalpas.v1';
const ACTIVE_TIMER_STATE_KEY = 'meditation.activeTimerState.v1';
const ACTIVE_PLAYLIST_RUN_STATE_KEY = 'meditation.activePlaylistRunState.v1';
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
    typeof candidate.durationMinutes === 'number' &&
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

function isSessionLog(value: unknown): value is SessionLog {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (
    !isMeditationType(candidate.meditationType) ||
    !isValidIsoDate(candidate.startedAt) ||
    !isValidIsoDate(candidate.endedAt) ||
    !isFinitePositiveNumber(candidate.intendedDurationSeconds) ||
    !isFiniteNonNegativeNumber(candidate.completedDurationSeconds)
  ) {
    return false;
  }

  if (candidate.completedDurationSeconds > candidate.intendedDurationSeconds) {
    return false;
  }

  if (Date.parse(candidate.endedAt) < Date.parse(candidate.startedAt)) {
    return false;
  }

  return (
    typeof candidate.id === 'string' &&
    (candidate.status === 'completed' || candidate.status === 'ended early') &&
    (candidate.source === 'auto log' || candidate.source === 'manual log') &&
    typeof candidate.startSound === 'string' &&
    typeof candidate.endSound === 'string' &&
    typeof candidate.intervalEnabled === 'boolean' &&
    isFiniteNonNegativeNumber(candidate.intervalMinutes) &&
    typeof candidate.intervalSound === 'string' &&
    isValidPlaylistFields(candidate)
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
    !isFinitePositiveNumber(candidate.intendedDurationSeconds) ||
    !isFiniteNonNegativeNumber(candidate.remainingSeconds) ||
    !isMeditationType(candidate.meditationType) ||
    typeof candidate.startSound !== 'string' ||
    typeof candidate.endSound !== 'string' ||
    typeof candidate.intervalEnabled !== 'boolean' ||
    !isFiniteNonNegativeNumber(candidate.intervalMinutes) ||
    typeof candidate.intervalSound !== 'string' ||
    !isFiniteInteger(candidate.endAtMs)
  ) {
    return false;
  }

  return candidate.remainingSeconds <= candidate.intendedDurationSeconds;
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
    startSound: typeof candidate.startSound === 'string' ? candidate.startSound : 'None',
    endSound: typeof candidate.endSound === 'string' ? candidate.endSound : 'Temple Bell',
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

    return {
      ...parsed,
      intervalSound: parsed.intervalSound ?? 'Temple Bell',
    };
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
    return Array.isArray(parsed) ? parsed.filter(isSessionLog) : [];
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

interface StoredActiveTimerState {
  readonly activeSession: ActiveSession;
  readonly isPaused: boolean;
}

interface StoredActivePlaylistRunState {
  readonly activePlaylistRun: ActivePlaylistRun;
  readonly isPaused: boolean;
}

export function loadActiveTimerState(): StoredActiveTimerState | null {
  const raw = localStorage.getItem(ACTIVE_TIMER_STATE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObjectRecord(parsed)) {
      return null;
    }

    const candidate = parsed as Record<string, unknown>;
    if (!isActiveSession(candidate.activeSession) || typeof candidate.isPaused !== 'boolean') {
      return null;
    }

    return {
      activeSession: candidate.activeSession,
      isPaused: candidate.isPaused,
    };
  } catch {
    return null;
  }
}

export function saveActiveTimerState(activeSession: ActiveSession | null, isPaused: boolean): void {
  if (!activeSession) {
    localStorage.removeItem(ACTIVE_TIMER_STATE_KEY);
    return;
  }

  localStorage.setItem(
    ACTIVE_TIMER_STATE_KEY,
    JSON.stringify({
      activeSession,
      isPaused,
    } satisfies StoredActiveTimerState)
  );
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
