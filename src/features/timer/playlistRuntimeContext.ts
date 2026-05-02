import { createContext, useContext } from 'react';
import type { LastUsedMeditation } from '../../types/home';
import type {
  ActivePlaylistRun,
  Playlist,
  PlaylistDeleteResult,
  PlaylistDraft,
  PlaylistRunOutcome,
  PlaylistRunStartResult,
  PlaylistSaveResult,
} from '../../types/playlist';

export interface PlaylistRuntimeContextValue {
  readonly playlists: readonly Playlist[];
  readonly lastUsedMeditation: LastUsedMeditation | null;
  readonly activePlaylistRun: ActivePlaylistRun | null;
  readonly playlistRunOutcome: PlaylistRunOutcome | null;
  readonly isPlaylistRunPaused: boolean;
  readonly isPlaylistsLoading: boolean;
  readonly isPlaylistSyncing: boolean;
  readonly playlistSyncError: string | null;
  readonly playlistRuntimeMessage: string | null;
  readonly savePlaylist: (draft: PlaylistDraft, editId?: string) => Promise<PlaylistSaveResult>;
  readonly deletePlaylist: (playlistId: string) => Promise<PlaylistDeleteResult>;
  readonly toggleFavoritePlaylist: (playlistId: string) => Promise<boolean>;
  readonly startPlaylistRun: (playlistId: string) => PlaylistRunStartResult;
  readonly clearLastUsedMeditation: () => void;
  readonly pausePlaylistRun: () => void;
  readonly resumePlaylistRun: () => void;
  readonly updatePlaylistRunProgress: (currentPositionSeconds: number) => void;
  readonly completePlaylistRunCurrentItem: (currentPositionSeconds?: number) => void;
  readonly endPlaylistRunEarly: () => void;
  readonly clearPlaylistRunOutcome: () => void;
  readonly reportPlaylistRuntimeIssue: (message: string | null) => void;
  readonly clearPlaylistRuntimeMessage: () => void;
}

export const PlaylistRuntimeContext = createContext<PlaylistRuntimeContextValue | null>(null);

export function usePlaylistRuntime(): PlaylistRuntimeContextValue {
  const ctx = useContext(PlaylistRuntimeContext);
  if (!ctx) {
    throw new Error('usePlaylistRuntime must be used inside TimerProvider');
  }
  return ctx;
}
