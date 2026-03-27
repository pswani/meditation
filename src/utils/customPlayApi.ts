import type { CustomPlay } from '../types/customPlay';
import { ApiClientError, requestJson } from './apiClient';
import { buildApiPath, buildApiUrl } from './apiConfig';
import { buildSyncMutationHeaders, type SyncMutationRequestOptions } from './syncApi';

export const CUSTOM_PLAYS_COLLECTION_PATH = '/custom-plays';
export const CUSTOM_PLAYS_COLLECTION_ENDPOINT = buildApiPath(CUSTOM_PLAYS_COLLECTION_PATH);

interface CustomPlayApiResponse {
  readonly id: string;
  readonly name: string;
  readonly meditationType: CustomPlay['meditationType'];
  readonly durationMinutes: number;
  readonly startSound: string;
  readonly endSound: string;
  readonly mediaAssetId?: string | null;
  readonly recordingLabel?: string | null;
  readonly favorite: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface CustomPlayUpsertRequest {
  readonly id: string;
  readonly name: string;
  readonly meditationType: CustomPlay['meditationType'];
  readonly durationMinutes: number;
  readonly startSound: string;
  readonly endSound: string;
  readonly mediaAssetId?: string;
  readonly recordingLabel?: string;
  readonly favorite: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isCustomPlayApiResponse(value: unknown): value is CustomPlayApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.meditationType === 'string' &&
    typeof candidate.durationMinutes === 'number' &&
    typeof candidate.startSound === 'string' &&
    typeof candidate.endSound === 'string' &&
    (typeof candidate.mediaAssetId === 'string' || typeof candidate.mediaAssetId === 'undefined' || candidate.mediaAssetId === null) &&
    (typeof candidate.recordingLabel === 'string' ||
      typeof candidate.recordingLabel === 'undefined' ||
      candidate.recordingLabel === null) &&
    typeof candidate.favorite === 'boolean' &&
    isValidIsoDate(candidate.createdAt) &&
    isValidIsoDate(candidate.updatedAt)
  );
}

function normalizeCustomPlayPayload(payload: unknown): CustomPlay {
  if (!isCustomPlayApiResponse(payload)) {
    throw new Error('Custom play response is invalid.');
  }

  return {
    id: payload.id,
    name: payload.name,
    meditationType: payload.meditationType,
    durationMinutes: payload.durationMinutes,
    startSound: payload.startSound,
    endSound: payload.endSound,
    mediaAssetId: payload.mediaAssetId ?? '',
    recordingLabel: payload.recordingLabel ?? '',
    favorite: payload.favorite,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
}

function normalizeCustomPlayCollection(payload: unknown): CustomPlay[] {
  if (!Array.isArray(payload)) {
    throw new Error('Custom play collection response is invalid.');
  }

  return payload.map(normalizeCustomPlayPayload);
}

function buildCustomPlayUpsertRequest(customPlay: CustomPlay): CustomPlayUpsertRequest {
  return {
    id: customPlay.id,
    name: customPlay.name,
    meditationType: customPlay.meditationType,
    durationMinutes: customPlay.durationMinutes,
    startSound: customPlay.startSound,
    endSound: customPlay.endSound,
    mediaAssetId: customPlay.mediaAssetId,
    recordingLabel: customPlay.recordingLabel,
    favorite: customPlay.favorite,
    createdAt: customPlay.createdAt,
    updatedAt: customPlay.updatedAt,
  };
}

export function buildCustomPlayDetailPath(customPlayId: string): string {
  return `${CUSTOM_PLAYS_COLLECTION_PATH}/${customPlayId}`;
}

export function buildCustomPlayCollectionUrl(apiBaseUrl?: string): string {
  return buildApiUrl(CUSTOM_PLAYS_COLLECTION_PATH, apiBaseUrl);
}

export function buildCustomPlayDetailUrl(customPlayId: string, apiBaseUrl?: string): string {
  return buildApiUrl(buildCustomPlayDetailPath(customPlayId), apiBaseUrl);
}

export async function listCustomPlaysFromApi(apiBaseUrl?: string): Promise<CustomPlay[]> {
  const payload = await requestJson<unknown>(CUSTOM_PLAYS_COLLECTION_PATH, { apiBaseUrl });
  return normalizeCustomPlayCollection(payload);
}

export async function persistCustomPlayToApi(
  customPlay: CustomPlay,
  options: SyncMutationRequestOptions = {}
): Promise<CustomPlay> {
  const payload = await requestJson<unknown, CustomPlayUpsertRequest>(buildCustomPlayDetailPath(customPlay.id), {
    method: 'PUT',
    apiBaseUrl: options.apiBaseUrl,
    signal: options.signal,
    headers: buildSyncMutationHeaders(options.syncQueuedAt),
    body: buildCustomPlayUpsertRequest(customPlay),
  });

  return normalizeCustomPlayPayload(payload);
}

export async function deleteCustomPlayFromApi(
  customPlayId: string,
  options: SyncMutationRequestOptions = {}
): Promise<void> {
  const url = buildCustomPlayDetailUrl(customPlayId, options.apiBaseUrl);

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
