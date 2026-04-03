import type {
  ActivePlaylistRun,
  Playlist,
  PlaylistDeleteResult,
  PlaylistRunStartResult,
} from '../types/playlist';

interface EvaluatePlaylistRunStartParams {
  readonly playlistId: string;
  readonly playlists: readonly Playlist[];
  readonly isPlaylistsLoading: boolean;
  readonly activeTimerSession: boolean;
  readonly activeCustomPlayRun: boolean;
  readonly activePlaylistRun: ActivePlaylistRun | null;
}

export function evaluatePlaylistRunStart({
  playlistId,
  playlists,
  isPlaylistsLoading,
  activeTimerSession,
  activeCustomPlayRun,
  activePlaylistRun,
}: EvaluatePlaylistRunStartParams): PlaylistRunStartResult {
  if (isPlaylistsLoading) {
    return { started: false, reason: 'playlists loading' };
  }

  if (activeTimerSession) {
    return { started: false, reason: 'timer session active' };
  }

  if (activeCustomPlayRun) {
    return { started: false, reason: 'custom play run active' };
  }

  if (activePlaylistRun) {
    return { started: false, reason: 'playlist run active' };
  }

  const playlist = playlists.find((entry) => entry.id === playlistId);
  if (!playlist) {
    return { started: false, reason: 'playlist not found' };
  }

  if (playlist.items.length === 0) {
    return { started: false, reason: 'playlist has no items' };
  }

  return { started: true };
}

export function evaluatePlaylistDelete(playlistId: string, activePlaylistRun: ActivePlaylistRun | null): PlaylistDeleteResult {
  if (activePlaylistRun?.playlistId === playlistId) {
    return { deleted: false, reason: 'playlist run active' };
  }

  return { deleted: true };
}
