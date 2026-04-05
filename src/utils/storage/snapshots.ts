import type { LastUsedMeditation } from '../../types/home';
import type { MediaAssetMetadata } from '../../types/mediaAsset';
import type { SummarySnapshotData } from '../summary';
import {
  LAST_USED_MEDITATION_KEY,
  MEDIA_ASSET_CATALOG_CACHE_KEY,
  SUMMARY_SNAPSHOT_CACHE_KEY,
  isMediaAssetMetadata,
  isSummarySnapshotData,
  normalizeLastUsedMeditation,
} from './shared';

function buildSummarySnapshotStorageKey(cacheKey: string): string {
  return `${SUMMARY_SNAPSHOT_CACHE_KEY}:${cacheKey}`;
}

export function loadCachedMediaAssetCatalog(): MediaAssetMetadata[] | null {
  const raw = localStorage.getItem(MEDIA_ASSET_CATALOG_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }

    const assets = parsed.filter(isMediaAssetMetadata);
    return assets.length > 0 ? assets : null;
  } catch {
    return null;
  }
}

export function saveCachedMediaAssetCatalog(assets: readonly MediaAssetMetadata[]): void {
  localStorage.setItem(MEDIA_ASSET_CATALOG_CACHE_KEY, JSON.stringify(assets));
}

export function loadCachedSummarySnapshot(cacheKey: string): SummarySnapshotData | null {
  const raw = localStorage.getItem(buildSummarySnapshotStorageKey(cacheKey));
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isSummarySnapshotData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCachedSummarySnapshot(cacheKey: string, snapshot: SummarySnapshotData): void {
  localStorage.setItem(buildSummarySnapshotStorageKey(cacheKey), JSON.stringify(snapshot));
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
