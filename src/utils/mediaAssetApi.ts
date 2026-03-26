import type { MediaAssetMetadata } from '../types/mediaAsset';
import { buildApiPath, buildApiUrl } from './apiConfig';

export const CUSTOM_PLAY_MEDIA_DIRECTORY = '/media/custom-plays';
export const CUSTOM_PLAY_MEDIA_LIST_PATH = '/media/custom-plays';
export const CUSTOM_PLAY_MEDIA_LIST_ENDPOINT = buildApiPath(CUSTOM_PLAY_MEDIA_LIST_PATH);

export function buildCustomPlayMediaListUrl(apiBaseUrl?: string): string {
  return buildApiUrl(CUSTOM_PLAY_MEDIA_LIST_PATH, apiBaseUrl);
}

const localMediaAssetCatalog: readonly MediaAssetMetadata[] = [
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

export async function listCustomPlayMediaAssets(): Promise<MediaAssetMetadata[]> {
  return localMediaAssetCatalog.map((entry) => ({ ...entry }));
}

export function findCustomPlayMediaAssetById(assetId: string): MediaAssetMetadata | null {
  const match = localMediaAssetCatalog.find((entry) => entry.id === assetId);
  return match ? { ...match } : null;
}
