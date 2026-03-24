import type { CustomPlay } from '../types/customPlay';
import type { Playlist } from '../types/playlist';
import type { SessionLog } from '../types/sessionLog';
import type { SankalpaGoal } from '../types/sankalpa';
import type { TimerSettings } from '../types/timer';

const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';
const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const CUSTOM_PLAYS_KEY = 'meditation.customPlays.v1';
const PLAYLISTS_KEY = 'meditation.playlists.v1';
const SANKALPAS_KEY = 'meditation.sankalpas.v1';
const MEDITATION_TYPES = ['Vipassana', 'Ajapa', 'Tratak', 'Kriya', 'Sahaj'] as const;

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

function isSessionLog(value: unknown): value is SessionLog {
  if (!isObjectRecord(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const hasValidPlaylistFields =
    (typeof candidate.playlistId === 'string' || typeof candidate.playlistId === 'undefined') &&
    (typeof candidate.playlistName === 'string' || typeof candidate.playlistName === 'undefined') &&
    (typeof candidate.playlistRunId === 'string' || typeof candidate.playlistRunId === 'undefined') &&
    (typeof candidate.playlistRunStartedAt === 'string' || typeof candidate.playlistRunStartedAt === 'undefined') &&
    (typeof candidate.playlistItemPosition === 'number' || typeof candidate.playlistItemPosition === 'undefined') &&
    (typeof candidate.playlistItemCount === 'number' || typeof candidate.playlistItemCount === 'undefined');

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.startedAt === 'string' &&
    typeof candidate.endedAt === 'string' &&
    typeof candidate.meditationType === 'string' &&
    typeof candidate.intendedDurationSeconds === 'number' &&
    typeof candidate.completedDurationSeconds === 'number' &&
    (candidate.status === 'completed' || candidate.status === 'ended early') &&
    (candidate.source === 'auto log' || candidate.source === 'manual log') &&
    typeof candidate.startSound === 'string' &&
    typeof candidate.endSound === 'string' &&
    typeof candidate.intervalEnabled === 'boolean' &&
    typeof candidate.intervalMinutes === 'number' &&
    typeof candidate.intervalSound === 'string' &&
    hasValidPlaylistFields
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
    startSound: typeof candidate.startSound === 'string' ? candidate.startSound : 'None',
    endSound: typeof candidate.endSound === 'string' ? candidate.endSound : 'Temple Bell',
    mediaAssetId: typeof candidate.mediaAssetId === 'string' ? candidate.mediaAssetId : '',
    mediaAssetLabel: typeof candidate.mediaAssetLabel === 'string' ? candidate.mediaAssetLabel : '',
    mediaAssetPath: typeof candidate.mediaAssetPath === 'string' ? candidate.mediaAssetPath : '',
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

export function saveSessionLogs(logs: SessionLog[]): void {
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

export function saveCustomPlays(customPlays: CustomPlay[]): void {
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

export function savePlaylists(playlists: Playlist[]): void {
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

export function loadSankalpas(): SankalpaGoal[] {
  const raw = localStorage.getItem(SANKALPAS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SankalpaGoal[]) : [];
  } catch {
    return [];
  }
}

export function saveSankalpas(sankalpas: SankalpaGoal[]): void {
  localStorage.setItem(SANKALPAS_KEY, JSON.stringify(sankalpas));
}
