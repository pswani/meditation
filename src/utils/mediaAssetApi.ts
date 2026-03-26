import type { MediaAssetMetadata } from '../types/mediaAsset';
import { ApiClientError, isApiClientError, requestJson } from './apiClient';
import { buildApiPath, buildApiUrl } from './apiConfig';

export const CUSTOM_PLAY_MEDIA_DIRECTORY = '/media/custom-plays';
export const CUSTOM_PLAY_MEDIA_LIST_PATH = '/media/custom-plays';
export const CUSTOM_PLAY_MEDIA_LIST_ENDPOINT = buildApiPath(CUSTOM_PLAY_MEDIA_LIST_PATH);

export function buildCustomPlayMediaListUrl(apiBaseUrl?: string): string {
  return buildApiUrl(CUSTOM_PLAY_MEDIA_LIST_PATH, apiBaseUrl);
}

export interface MediaAssetApiResponse {
  readonly id: string;
  readonly label: string;
  readonly filePath: string;
  readonly relativePath?: string;
  readonly durationSeconds: number;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly updatedAt: string;
}

export type MediaAssetCatalogSource = 'backend' | 'sample-fallback';

export interface MediaAssetCatalogResult {
  readonly assets: MediaAssetMetadata[];
  readonly source: MediaAssetCatalogSource;
  readonly errorMessage: string | null;
}

const sampleMediaAssetCatalog: readonly MediaAssetApiResponse[] = [
  {
    id: 'media-vipassana-sit-20',
    label: 'Vipassana Sit (20 min)',
    filePath: `${CUSTOM_PLAY_MEDIA_DIRECTORY}/vipassana-sit-20.mp3`,
    durationSeconds: 1200,
    mimeType: 'audio/mpeg',
    sizeBytes: 9_200_000,
    updatedAt: '2026-03-24T08:00:00.000Z',
  },
  {
    id: 'media-ajapa-breath-15',
    label: 'Ajapa Breath Cycle (15 min)',
    filePath: `${CUSTOM_PLAY_MEDIA_DIRECTORY}/ajapa-breath-15.mp3`,
    durationSeconds: 900,
    mimeType: 'audio/mpeg',
    sizeBytes: 6_900_000,
    updatedAt: '2026-03-24T08:00:00.000Z',
  },
  {
    id: 'media-tratak-focus-10',
    label: 'Tratak Focus Bellset (10 min)',
    filePath: `${CUSTOM_PLAY_MEDIA_DIRECTORY}/tratak-focus-10.mp3`,
    durationSeconds: 600,
    mimeType: 'audio/mpeg',
    sizeBytes: 4_500_000,
    updatedAt: '2026-03-24T08:00:00.000Z',
  },
];

let cachedMediaAssetCatalog: MediaAssetMetadata[] = sampleMediaAssetCatalog.map((entry) => ({ ...entry }));
let cachedMediaAssetCatalogSource: MediaAssetCatalogSource = 'sample-fallback';

function normalizeMediaAssetResponse(entry: MediaAssetApiResponse): MediaAssetMetadata {
  return {
    id: entry.id,
    label: entry.label,
    filePath: entry.filePath,
    durationSeconds: entry.durationSeconds,
    mimeType: entry.mimeType,
    sizeBytes: entry.sizeBytes,
    updatedAt: entry.updatedAt,
  };
}

function cloneMediaAssetCatalog(assets: readonly MediaAssetMetadata[]): MediaAssetMetadata[] {
  return assets.map((entry) => ({ ...entry }));
}

function isMediaAssetApiResponse(value: unknown): value is MediaAssetApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.filePath === 'string' &&
    typeof candidate.durationSeconds === 'number' &&
    typeof candidate.mimeType === 'string' &&
    typeof candidate.sizeBytes === 'number' &&
    typeof candidate.updatedAt === 'string'
  );
}

function normalizeMediaAssetApiPayload(payload: unknown): MediaAssetMetadata[] {
  if (!Array.isArray(payload)) {
    throw new ApiClientError('The media catalog response had an unexpected shape.', CUSTOM_PLAY_MEDIA_LIST_ENDPOINT);
  }

  const normalizedAssets = payload.map((entry) => {
    if (!isMediaAssetApiResponse(entry)) {
      throw new ApiClientError('The media catalog response contained invalid records.', CUSTOM_PLAY_MEDIA_LIST_ENDPOINT);
    }

    return normalizeMediaAssetResponse(entry);
  });

  return cloneMediaAssetCatalog(normalizedAssets);
}

function createFallbackResult(error: unknown): MediaAssetCatalogResult {
  const fallbackAssets = sampleMediaAssetCatalog.map(normalizeMediaAssetResponse);
  cachedMediaAssetCatalog = cloneMediaAssetCatalog(fallbackAssets);
  cachedMediaAssetCatalogSource = 'sample-fallback';

  if (isApiClientError(error) && error.status === 404) {
    return {
      assets: fallbackAssets,
      source: 'sample-fallback',
      errorMessage: 'Using built-in media session options because the backend media API is not available yet.',
    };
  }

  return {
    assets: fallbackAssets,
    source: 'sample-fallback',
    errorMessage: 'Using built-in media session options because the backend media API could not be reached.',
  };
}

export async function loadCustomPlayMediaAssets(apiBaseUrl?: string): Promise<MediaAssetCatalogResult> {
  try {
    const payload = await requestJson<unknown>(CUSTOM_PLAY_MEDIA_LIST_PATH, { apiBaseUrl });
    const assets = normalizeMediaAssetApiPayload(payload);
    cachedMediaAssetCatalog = cloneMediaAssetCatalog(assets);
    cachedMediaAssetCatalogSource = 'backend';

    return {
      assets,
      source: 'backend',
      errorMessage: null,
    };
  } catch (error) {
    return createFallbackResult(error);
  }
}

export async function listCustomPlayMediaAssets(apiBaseUrl?: string): Promise<MediaAssetMetadata[]> {
  const result = await loadCustomPlayMediaAssets(apiBaseUrl);
  return result.assets;
}

export function resetCustomPlayMediaAssetCatalogForTests(): void {
  cachedMediaAssetCatalog = sampleMediaAssetCatalog.map(normalizeMediaAssetResponse);
  cachedMediaAssetCatalogSource = 'sample-fallback';
}

export function findCustomPlayMediaAssetById(assetId: string): MediaAssetMetadata | null {
  const sourceCatalog =
    cachedMediaAssetCatalogSource === 'backend'
      ? cachedMediaAssetCatalog
      : sampleMediaAssetCatalog.map(normalizeMediaAssetResponse);
  const match = sourceCatalog.find((entry) => entry.id === assetId);
  return match ? { ...match } : null;
}
