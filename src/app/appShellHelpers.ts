export function buildSyncStatusMessage(
  connectionMode: 'offline' | 'backend-unreachable' | 'online',
  pendingCount: number,
  failedCount: number
): string | null {
  if (connectionMode === 'offline') {
    if (pendingCount > 0) {
      return `${pendingCount} change${pendingCount === 1 ? '' : 's'} will stay on this device and sync when the backend is reachable again.`;
    }

    return 'You are offline. Saved data already on this device remains available.';
  }

  if (connectionMode === 'backend-unreachable') {
    if (pendingCount > 0) {
      return `${pendingCount} change${pendingCount === 1 ? '' : 's'} will stay on this device until the backend is reachable again.`;
    }

    return 'The backend is unavailable right now. Saved data already on this device remains available.';
  }

  if (failedCount > 0) {
    return `${failedCount} change${failedCount === 1 ? '' : 's'} still need another sync attempt.`;
  }

  if (pendingCount > 0) {
    return `${pendingCount} change${pendingCount === 1 ? '' : 's'} waiting to sync with the backend.`;
  }

  return null;
}

export function buildCustomPlayMediaMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Playback is waiting for a device interaction. Tap Resume to continue this custom play.';
  }

  if (error instanceof DOMException && error.name === 'NotSupportedError') {
    return 'The linked recording could not be loaded on this device.';
  }

  if (error instanceof Error && error.message.toLowerCase().includes('network')) {
    return 'The linked recording could not be loaded because the media file is unavailable or not cached on this device right now.';
  }

  return 'The linked recording could not continue playing right now.';
}

export function buildPlaylistMediaMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Playback is waiting for a device interaction. Tap Resume to continue this playlist item.';
  }

  if (error instanceof DOMException && error.name === 'NotSupportedError') {
    return 'The linked playlist recording could not be loaded on this device.';
  }

  if (error instanceof Error && error.message.toLowerCase().includes('network')) {
    return 'The linked playlist recording could not be loaded because the media file is unavailable or not cached on this device right now.';
  }

  return 'The linked playlist recording could not continue playing right now.';
}
