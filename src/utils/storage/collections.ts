import type { CustomPlay } from '../../types/customPlay';
import type { Playlist } from '../../types/playlist';
import type { SankalpaGoal } from '../../types/sankalpa';
import {
  CUSTOM_PLAYS_KEY,
  PLAYLISTS_KEY,
  SANKALPAS_KEY,
  normalizeCustomPlay,
  normalizePlaylist,
  normalizeSankalpa,
} from './shared';
import { safeSetItem } from './safeSetItem';
import { evictOldSessionLogs } from './sessionLogs';

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
  if (safeSetItem(CUSTOM_PLAYS_KEY, JSON.stringify(customPlays)) === 'quota-exceeded') {
    evictOldSessionLogs();
    safeSetItem(CUSTOM_PLAYS_KEY, JSON.stringify(customPlays));
  }
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
  if (safeSetItem(PLAYLISTS_KEY, JSON.stringify(playlists)) === 'quota-exceeded') {
    evictOldSessionLogs();
    safeSetItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  }
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
  if (safeSetItem(SANKALPAS_KEY, JSON.stringify(sankalpas)) === 'quota-exceeded') {
    evictOldSessionLogs();
    safeSetItem(SANKALPAS_KEY, JSON.stringify(sankalpas));
  }
}
