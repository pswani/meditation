import type { Playlist } from '../types/playlist';
import { ApiClientError, requestJson } from './apiClient';
import { buildApiPath, buildApiUrl } from './apiConfig';

export const PLAYLISTS_COLLECTION_PATH = '/playlists';
export const PLAYLISTS_COLLECTION_ENDPOINT = buildApiPath(PLAYLISTS_COLLECTION_PATH);

interface PlaylistItemApiResponse {
  readonly id: string;
  readonly meditationType: Playlist['items'][number]['meditationType'];
  readonly durationMinutes: number;
}

interface PlaylistApiResponse {
  readonly id: string;
  readonly name: string;
  readonly items: readonly PlaylistItemApiResponse[];
  readonly favorite: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface PlaylistUpsertRequest {
  readonly id: string;
  readonly name: string;
  readonly items: readonly {
    readonly id: string;
    readonly meditationType: Playlist['items'][number]['meditationType'];
    readonly durationMinutes: number;
  }[];
  readonly favorite: boolean;
}

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
    typeof candidate.meditationType === 'string' &&
    typeof candidate.durationMinutes === 'number' &&
    candidate.durationMinutes > 0
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
      meditationType: item.meditationType,
      durationMinutes: item.durationMinutes,
    })),
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
    favorite: playlist.favorite,
    items: playlist.items.map((item) => ({
      id: item.id,
      meditationType: item.meditationType,
      durationMinutes: item.durationMinutes,
    })),
  };
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

export async function persistPlaylistToApi(playlist: Playlist, apiBaseUrl?: string): Promise<Playlist> {
  const payload = await requestJson<unknown, PlaylistUpsertRequest>(buildPlaylistDetailPath(playlist.id), {
    method: 'PUT',
    apiBaseUrl,
    body: buildPlaylistUpsertRequest(playlist),
  });

  return normalizePlaylistPayload(payload);
}

export async function deletePlaylistFromApi(playlistId: string, apiBaseUrl?: string): Promise<void> {
  const url = buildPlaylistDetailUrl(playlistId, apiBaseUrl);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch {
    throw new ApiClientError('Unable to reach the API right now.', url, {
      kind: 'network',
    });
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
}
