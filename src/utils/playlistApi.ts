import type { Playlist } from '../types/playlist';
import { ApiClientError, requestJson } from './apiClient';
import { buildApiPath, buildApiUrl } from './apiConfig';
import {
  buildSyncMutationHeaders,
  extractSyncDeleteCurrentRecord,
  type SyncMutationRequestOptions,
} from './syncApi';

export const PLAYLISTS_COLLECTION_PATH = '/playlists';
export const PLAYLISTS_COLLECTION_ENDPOINT = buildApiPath(PLAYLISTS_COLLECTION_PATH);

interface PlaylistItemApiResponse {
  readonly id: string;
  readonly title: string;
  readonly meditationType: Playlist['items'][number]['meditationType'];
  readonly durationMinutes: number;
  readonly customPlayId?: string | null;
}

interface PlaylistApiResponse {
  readonly id: string;
  readonly name: string;
  readonly items: readonly PlaylistItemApiResponse[];
  readonly smallGapSeconds: number;
  readonly favorite: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface PlaylistUpsertRequest {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly smallGapSeconds: number;
  readonly items: readonly {
    readonly id: string;
    readonly title: string;
    readonly meditationType: Playlist['items'][number]['meditationType'];
    readonly durationMinutes: number;
    readonly customPlayId?: string;
  }[];
  readonly favorite: boolean;
}

interface PlaylistDeleteApiResponse {
  readonly outcome: 'deleted' | 'stale';
  readonly currentRecord?: PlaylistApiResponse | null;
  readonly currentPlaylist?: PlaylistApiResponse | null;
}

export type PlaylistDeleteResult =
  | {
      readonly outcome: 'deleted';
    }
  | {
      readonly outcome: 'stale';
      readonly currentPlaylist: Playlist;
    };

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isPlaylistItemApiResponse(value: unknown): value is PlaylistItemApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    (typeof candidate.title === 'string' || typeof candidate.title === 'undefined' || candidate.title === null) &&
    typeof candidate.meditationType === 'string' &&
    typeof candidate.durationMinutes === 'number' &&
    candidate.durationMinutes > 0 &&
    (typeof candidate.customPlayId === 'string' || typeof candidate.customPlayId === 'undefined' || candidate.customPlayId === null)
  );
}

function isPlaylistApiResponse(value: unknown): value is PlaylistApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    Array.isArray(candidate.items) &&
    candidate.items.every(isPlaylistItemApiResponse) &&
    (typeof candidate.smallGapSeconds === 'number' || typeof candidate.smallGapSeconds === 'undefined' || candidate.smallGapSeconds === null) &&
    typeof candidate.favorite === 'boolean' &&
    isValidIsoDate(candidate.createdAt) &&
    isValidIsoDate(candidate.updatedAt)
  );
}

function normalizePlaylistPayload(payload: unknown): Playlist {
  if (!isPlaylistApiResponse(payload)) {
    throw new Error('Playlist response is invalid.');
  }

  return {
    id: payload.id,
    name: payload.name,
    items: payload.items.map((item) => ({
      id: item.id,
      title: item.title ?? item.meditationType,
      meditationType: item.meditationType,
      durationMinutes: item.durationMinutes,
      customPlayId: item.customPlayId ?? undefined,
    })),
    smallGapSeconds:
      typeof payload.smallGapSeconds === 'number' && Number.isInteger(payload.smallGapSeconds) && payload.smallGapSeconds >= 0
        ? payload.smallGapSeconds
        : 0,
    favorite: payload.favorite,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
}

function normalizePlaylistCollection(payload: unknown): Playlist[] {
  if (!Array.isArray(payload)) {
    throw new Error('Playlist collection response is invalid.');
  }

  return payload.map(normalizePlaylistPayload);
}

function buildPlaylistUpsertRequest(playlist: Playlist): PlaylistUpsertRequest {
  return {
    id: playlist.id,
    name: playlist.name,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
    smallGapSeconds: playlist.smallGapSeconds,
    favorite: playlist.favorite,
    items: playlist.items.map((item) => ({
      id: item.id,
      title: item.title,
      meditationType: item.meditationType,
      durationMinutes: item.durationMinutes,
      customPlayId: item.customPlayId,
    })),
  };
}

function normalizePlaylistDeleteResult(payload: unknown): PlaylistDeleteResult {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Playlist delete response is invalid.');
  }

  const candidate = payload as PlaylistDeleteApiResponse;
  if (candidate.outcome === 'deleted') {
    return { outcome: 'deleted' };
  }

  const currentRecord = extractSyncDeleteCurrentRecord(candidate as unknown as Record<string, unknown>, ['currentPlaylist']);
  if (candidate.outcome === 'stale' && currentRecord) {
    return {
      outcome: 'stale',
      currentPlaylist: normalizePlaylistPayload(currentRecord),
    };
  }

  throw new Error('Playlist delete response is invalid.');
}

export function buildPlaylistDetailPath(playlistId: string): string {
  return `${PLAYLISTS_COLLECTION_PATH}/${playlistId}`;
}

export function buildPlaylistDetailEndpoint(playlistId: string): string {
  return buildApiPath(buildPlaylistDetailPath(playlistId));
}

export function buildPlaylistCollectionUrl(apiBaseUrl?: string): string {
  return buildApiUrl(PLAYLISTS_COLLECTION_PATH, apiBaseUrl);
}

export function buildPlaylistDetailUrl(playlistId: string, apiBaseUrl?: string): string {
  return buildApiUrl(buildPlaylistDetailPath(playlistId), apiBaseUrl);
}

export async function listPlaylistsFromApi(apiBaseUrl?: string): Promise<Playlist[]> {
  const payload = await requestJson<unknown>(PLAYLISTS_COLLECTION_PATH, { apiBaseUrl });
  return normalizePlaylistCollection(payload);
}

export async function persistPlaylistToApi(
  playlist: Playlist,
  options: SyncMutationRequestOptions = {}
): Promise<Playlist> {
  const payload = await requestJson<unknown, PlaylistUpsertRequest>(buildPlaylistDetailPath(playlist.id), {
    method: 'PUT',
    apiBaseUrl: options.apiBaseUrl,
    signal: options.signal,
    headers: buildSyncMutationHeaders(options.syncQueuedAt),
    body: buildPlaylistUpsertRequest(playlist),
  });

  return normalizePlaylistPayload(payload);
}

export async function deletePlaylistFromApi(
  playlistId: string,
  options: SyncMutationRequestOptions = {}
): Promise<PlaylistDeleteResult> {
  const url = buildPlaylistDetailUrl(playlistId, options.apiBaseUrl);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...buildSyncMutationHeaders(options.syncQueuedAt),
      },
      signal: options.signal,
    });
  } catch {
    throw new ApiClientError('Unable to reach the API right now.', url, {
      kind: 'network',
    });
  }

  if (response.status === 204) {
    return {
      outcome: 'deleted',
    };
  }

  if (!response.ok) {
    let detail: string | null = null;

    try {
      const responseText = await response.text();
      detail = responseText.trim() ? responseText : null;
    } catch {
      detail = null;
    }

    throw new ApiClientError(`API request failed with status ${response.status}.`, url, {
      status: response.status,
      detail,
      kind: 'http',
    });
  }

  const payload = await response.json();
  return normalizePlaylistDeleteResult(payload);
}
