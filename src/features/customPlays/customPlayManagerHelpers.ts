import type { MediaAssetMetadata } from '../../types/mediaAsset';
import type { MediaAssetCatalogSource } from '../../utils/mediaAssetApi';

export function describeLinkedMedia(asset: MediaAssetMetadata): string {
  return asset.meditationType ? `${asset.label} · ${asset.meditationType}` : asset.label;
}

export function describeManagedLibrarySource(source: MediaAssetCatalogSource, count: number): string {
  if (source === 'backend') {
    return `${count} recording${count === 1 ? '' : 's'} available.`;
  }

  if (source === 'cached-backend') {
    return `${count} recording${count === 1 ? '' : 's'} shown from your last saved library snapshot.`;
  }

  return `${count} built-in recording option${count === 1 ? '' : 's'} shown while the recording library is unavailable.`;
}

export function customPlayStartBlockMessage(reason?: string): string {
  const messages: Record<string, string> = {
    'custom plays loading': 'Custom plays are still loading.',
    'timer session active': 'Finish the active timer before starting a custom play.',
    'playlist run active': 'Finish the active playlist run before starting a custom play.',
    'custom play run active': 'A custom play is already active. Resume it to continue.',
    'custom play not found': 'That custom play is no longer available.',
    'media unavailable': 'The linked recording is unavailable right now.',
  };

  return reason ? messages[reason] ?? 'Unable to start that custom play right now.' : 'Unable to start that custom play right now.';
}
