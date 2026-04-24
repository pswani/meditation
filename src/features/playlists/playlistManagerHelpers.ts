import type { PlaylistRunStartResult } from '../../types/playlist';

export const smallGapOptions = [0, 5, 10, 15, 30] as const;

export function formatGapLabel(seconds: number): string {
  return seconds <= 0 ? 'No gap between items' : `${seconds} second gap between items`;
}

export function playlistRunFeedbackMessage(result: PlaylistRunStartResult): string | null {
  if (!result.reason) {
    return null;
  }

  const reasonToMessage: Record<NonNullable<PlaylistRunStartResult['reason']>, string> = {
    'playlists loading': 'Playlists are still loading. Wait a moment and try again.',
    'timer session active': 'Finish or end the active timer session before starting a playlist run.',
    'custom play run active': 'Finish the active custom play before starting a playlist run.',
    'playlist run active': 'A playlist run is already active. Open it to continue before starting another.',
    'playlist not found': 'That playlist is no longer available. Refresh and try again.',
    'playlist has no items': 'Add at least one item before starting this playlist run.',
    'playlist item unavailable': 'A linked custom play or recording for this playlist is unavailable. Update the playlist and try again.',
  };

  return reasonToMessage[result.reason];
}
