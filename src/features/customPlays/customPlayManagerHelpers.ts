import type { MediaAssetMetadata } from '../../types/mediaAsset';
import type { MediaAssetCatalogSource } from '../../utils/mediaAssetApi';

export function describeLinkedMedia(asset: MediaAssetMetadata): string {
  return asset.meditationType ? `${asset.label} · ${asset.meditationType}` : asset.label;
}

export function describeManagedLibrarySource(source: MediaAssetCatalogSource, count: number): string {
  if (source === 'backend') {
    return `${count} managed media session${count === 1 ? '' : 's'} loaded from the backend library.`;
  }

  if (source === 'cached-backend') {
    return `${count} managed media session${count === 1 ? '' : 's'} restored from the last available backend library sync.`;
  }

  return `${count} built-in fallback media session${count === 1 ? '' : 's'} shown while the backend library is unavailable.`;
}

export function customPlayStartBlockMessage(reason?: string): string {
  const messages: Record<string, string> = {
    'custom plays loading': 'Custom plays are still loading from the backend.',
    'timer session active': 'Finish the active timer before starting a custom play.',
    'playlist run active': 'Finish the active playlist run before starting a custom play.',
    'custom play run active': 'A custom play is already active. Resume it to continue.',
    'custom play not found': 'That custom play is no longer available.',
    'media unavailable': 'The linked media session is unavailable right now.',
  };

  return reason ? messages[reason] ?? 'Unable to start that custom play right now.' : 'Unable to start that custom play right now.';
}
