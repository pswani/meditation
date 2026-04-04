import meditationTypesCatalog from '../data/meditationTypes.json';
import type { MediaAssetMetadata } from '../types/mediaAsset';
import type { MeditationType } from '../types/timer';
import sampleCustomPlayMediaCatalog from '../data/customPlayMediaCatalog.json';
import { ApiClientError, isApiClientError, requestJson } from './apiClient';
import { buildApiPath, buildApiUrl } from './apiConfig';
import { loadCachedMediaAssetCatalog, saveCachedMediaAssetCatalog } from './storage';

export const CUSTOM_PLAY_MEDIA_DIRECTORY = '/media/custom-plays';
export const CUSTOM_PLAY_MEDIA_LIST_PATH = '/media/custom-plays';
export const CUSTOM_PLAY_MEDIA_LIST_ENDPOINT = buildApiPath(CUSTOM_PLAY_MEDIA_LIST_PATH);

export function buildCustomPlayMediaListUrl(apiBaseUrl?: string): string {
  return buildApiUrl(CUSTOM_PLAY_MEDIA_LIST_PATH, apiBaseUrl);
}

export interface MediaAssetApiResponse {
  readonly id: string;
  readonly label: string;
  readonly meditationType?: string | null;
  readonly filePath: string;
  readonly relativePath?: string;
  readonly durationSeconds: number;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly updatedAt: string;
}

export type MediaAssetCatalogSource = 'backend' | 'cached-backend' | 'sample-fallback';
export type MediaAssetCatalogIssue = 'unavailable' | 'backend-error' | 'invalid-response';

export interface MediaAssetCatalogResult {
  readonly assets: MediaAssetMetadata[];
  readonly source: MediaAssetCatalogSource;
  readonly errorMessage: string | null;
  readonly errorKind: MediaAssetCatalogIssue | null;
}

const sampleMediaAssetCatalog = sampleCustomPlayMediaCatalog as readonly MediaAssetApiResponse[];
const supportedMeditationTypes = new Set(meditationTypesCatalog as readonly MeditationType[]);

const persistedMediaAssetCatalog = loadCachedMediaAssetCatalog();
let cachedMediaAssetCatalog: MediaAssetMetadata[] =
  persistedMediaAssetCatalog ?? sampleMediaAssetCatalog.map(normalizeMediaAssetResponse);
let cachedMediaAssetCatalogSource: MediaAssetCatalogSource = persistedMediaAssetCatalog ? 'cached-backend' : 'sample-fallback';

function normalizeMeditationType(value: string | null | undefined): MeditationType | null {
  return value && supportedMeditationTypes.has(value as MeditationType) ? (value as MeditationType) : null;
}

function normalizeMediaAssetResponse(entry: MediaAssetApiResponse): MediaAssetMetadata {
  const derivedRelativePath =
    entry.relativePath ?? (entry.filePath.startsWith('/media/') ? entry.filePath.slice('/media/'.length) : entry.filePath);

  return {
    id: entry.id,
    label: entry.label,
    meditationType: normalizeMeditationType(entry.meditationType),
    filePath: entry.filePath,
    relativePath: derivedRelativePath,
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
    (typeof candidate.meditationType === 'string' || candidate.meditationType === null || candidate.meditationType === undefined) &&
    typeof candidate.filePath === 'string' &&
    (typeof candidate.relativePath === 'string' || candidate.relativePath === undefined) &&
    typeof candidate.durationSeconds === 'number' &&
    typeof candidate.mimeType === 'string' &&
    typeof candidate.sizeBytes === 'number' &&
    typeof candidate.updatedAt === 'string'
  );
}

function normalizeMediaAssetApiPayload(payload: unknown): MediaAssetMetadata[] {
  if (!Array.isArray(payload)) {
    throw new ApiClientError('The media catalog response had an unexpected shape.', CUSTOM_PLAY_MEDIA_LIST_ENDPOINT, {
      kind: 'invalid-response',
    });
  }

  const normalizedAssets = payload.map((entry) => {
    if (!isMediaAssetApiResponse(entry)) {
      throw new ApiClientError('The media catalog response contained invalid records.', CUSTOM_PLAY_MEDIA_LIST_ENDPOINT, {
        kind: 'invalid-response',
      });
    }

    return normalizeMediaAssetResponse(entry);
  });

  return cloneMediaAssetCatalog(normalizedAssets);
}

function createFallbackResult(error: unknown): MediaAssetCatalogResult {
  const cachedAssets = loadCachedMediaAssetCatalog();
  if (cachedAssets && cachedAssets.length > 0) {
    cachedMediaAssetCatalog = cloneMediaAssetCatalog(cachedAssets);
    cachedMediaAssetCatalogSource = 'cached-backend';

    return {
      assets: cloneMediaAssetCatalog(cachedAssets),
      source: 'cached-backend',
      errorMessage: 'Showing the last available managed media library because the backend media API is unavailable.',
      errorKind: isApiClientError(error) && (error.kind === 'invalid-json' || error.kind === 'invalid-response')
        ? 'invalid-response'
        : isApiClientError(error) && error.status === 404
          ? 'unavailable'
          : isApiClientError(error) && error.kind === 'network'
            ? 'unavailable'
            : 'backend-error',
    };
  }

  const fallbackAssets = sampleMediaAssetCatalog.map(normalizeMediaAssetResponse);
  cachedMediaAssetCatalog = cloneMediaAssetCatalog(fallbackAssets);
  cachedMediaAssetCatalogSource = 'sample-fallback';

  if (isApiClientError(error) && error.status === 404) {
    return {
      assets: fallbackAssets,
      source: 'sample-fallback',
      errorMessage: 'Using built-in media session options because the backend media API is not available yet.',
      errorKind: 'unavailable',
    };
  }

  if (isApiClientError(error) && error.kind === 'network') {
    return {
      assets: fallbackAssets,
      source: 'sample-fallback',
      errorMessage: 'Using built-in media session options because the backend media API could not be reached.',
      errorKind: 'unavailable',
    };
  }

  if (isApiClientError(error) && (error.kind === 'invalid-json' || error.kind === 'invalid-response')) {
    return {
      assets: fallbackAssets,
      source: 'sample-fallback',
      errorMessage: 'Backend media session data is invalid. Showing built-in media session options instead.',
      errorKind: 'invalid-response',
    };
  }

  return {
    assets: fallbackAssets,
    source: 'sample-fallback',
    errorMessage: 'Backend media session loading failed. Showing built-in media session options instead.',
    errorKind: 'backend-error',
  };
}

export async function loadCustomPlayMediaAssets(apiBaseUrl?: string): Promise<MediaAssetCatalogResult> {
  try {
    const payload = await requestJson<unknown>(CUSTOM_PLAY_MEDIA_LIST_PATH, { apiBaseUrl });
    const assets = normalizeMediaAssetApiPayload(payload);
    cachedMediaAssetCatalog = cloneMediaAssetCatalog(assets);
    cachedMediaAssetCatalogSource = 'backend';
    saveCachedMediaAssetCatalog(assets);

    return {
      assets,
      source: 'backend',
      errorMessage: null,
      errorKind: null,
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
  const cachedAssets = loadCachedMediaAssetCatalog();
  cachedMediaAssetCatalog = cachedAssets ?? sampleMediaAssetCatalog.map(normalizeMediaAssetResponse);
  cachedMediaAssetCatalogSource = cachedAssets ? 'cached-backend' : 'sample-fallback';
}

export function findCustomPlayMediaAssetById(assetId: string): MediaAssetMetadata | null {
  const sourceCatalog =
    cachedMediaAssetCatalogSource === 'backend' || cachedMediaAssetCatalogSource === 'cached-backend'
      ? cachedMediaAssetCatalog
      : sampleMediaAssetCatalog.map(normalizeMediaAssetResponse);
  const match = sourceCatalog.find((entry) => entry.id === assetId);
  return match ? { ...match } : null;
}
