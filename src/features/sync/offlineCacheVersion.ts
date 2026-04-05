export const OFFLINE_APP_SERVICE_WORKER_FILENAME = '/offline-sw.js';
export const FALLBACK_OFFLINE_CACHE_VERSION = 'dev';

const configuredAppAssetVersion =
  typeof __APP_ASSET_VERSION__ !== 'undefined' && typeof __APP_ASSET_VERSION__ === 'string'
    ? __APP_ASSET_VERSION__
    : undefined;

export function normalizeOfflineCacheVersion(version: string | null | undefined): string {
  if (typeof version !== 'string') {
    return FALLBACK_OFFLINE_CACHE_VERSION;
  }

  const trimmedVersion = version.trim();
  return trimmedVersion.length > 0 ? trimmedVersion : FALLBACK_OFFLINE_CACHE_VERSION;
}

export function getOfflineAppAssetVersion(version: string | null | undefined = configuredAppAssetVersion): string {
  return normalizeOfflineCacheVersion(version);
}

export function getOfflineAppServiceWorkerPath(version: string = getOfflineAppAssetVersion()): string {
  return `${OFFLINE_APP_SERVICE_WORKER_FILENAME}?v=${encodeURIComponent(normalizeOfflineCacheVersion(version))}`;
}
