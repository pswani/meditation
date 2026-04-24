import type { CustomPlay } from '../../types/customPlay';
import type { LastUsedMeditation } from '../../types/home';
import type { PlaylistRunStartResult } from '../../types/playlist';

export function playlistStartBlockMessage(result: PlaylistRunStartResult): string {
  if (!result.reason) {
    return 'Unable to start playlist run right now.';
  }

  const reasonToMessage: Record<NonNullable<PlaylistRunStartResult['reason']>, string> = {
    'playlists loading': 'Playlists are still loading. Wait a moment and try again.',
    'timer session active': 'Finish or end the active timer session before starting a playlist run.',
    'custom play run active': 'Finish the active custom play before starting a playlist run.',
    'playlist run active': 'A playlist run is already active. Open it to continue.',
    'playlist not found': 'That playlist is no longer available.',
    'playlist has no items': 'Add at least one item before starting this playlist run.',
    'playlist item unavailable': 'A linked custom play or recording for this playlist is unavailable. Update the playlist and try again.',
  };

  return reasonToMessage[result.reason];
}

export function describeLastUsedMeditation(lastUsedMeditation: LastUsedMeditation): string {
  if (lastUsedMeditation.kind === 'playlist') {
    return `Playlist · ${lastUsedMeditation.playlistName}`;
  }

  if (lastUsedMeditation.kind === 'custom-play') {
    return `Custom play · ${lastUsedMeditation.customPlayName}`;
  }

  const durationLabel =
    lastUsedMeditation.settings.timerMode === 'open-ended'
      ? 'Open-ended'
      : `${lastUsedMeditation.settings.durationMinutes ?? lastUsedMeditation.settings.lastFixedDurationMinutes} min`;

  return `Timer · ${durationLabel} · ${lastUsedMeditation.settings.meditationType}`;
}

export function customPlayStartBlockMessage(reason?: string): string {
  const reasonToMessage: Record<string, string> = {
    'custom plays loading': 'Custom plays are still loading. Wait a moment and try again.',
    'timer session active': 'Finish or end the active timer session before starting a custom play.',
    'playlist run active': 'Finish the active playlist run before starting a custom play.',
    'custom play run active': 'A custom play is already active. Open it to continue.',
    'custom play not found': 'That custom play is no longer available.',
    'media unavailable': 'The linked recording is unavailable right now. Reconnect the custom play and try again.',
  };

  return reason ? reasonToMessage[reason] ?? 'Unable to start that custom play right now.' : 'Unable to start that custom play right now.';
}

export function selectFavoriteCustomPlays(customPlays: readonly CustomPlay[]): CustomPlay[] {
  return customPlays.filter((entry) => entry.favorite).slice(0, 3);
}
