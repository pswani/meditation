import type { SessionLogStatus } from './sessionLog';
import type { MeditationType } from './timer';

export interface PlaylistItem {
  readonly id: string;
  readonly meditationType: MeditationType;
  readonly durationMinutes: number;
}

export interface Playlist {
  readonly id: string;
  readonly name: string;
  readonly items: readonly PlaylistItem[];
  readonly favorite: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PlaylistDraftItem {
  readonly id: string;
  meditationType: MeditationType | '';
  durationMinutes: number;
}

export interface PlaylistDraft {
  name: string;
  items: PlaylistDraftItem[];
}

export interface PlaylistValidationResult {
  readonly isValid: boolean;
  readonly errors: {
    name?: string;
    items?: string;
    itemErrors: Record<string, { meditationType?: string; durationMinutes?: string }>;
  };
}

export interface PlaylistSaveResult extends PlaylistValidationResult {
  readonly persisted: boolean;
  readonly persistenceError?: string;
}

export interface ActivePlaylistRun {
  readonly runId: string;
  readonly playlistId: string;
  readonly playlistName: string;
  readonly runStartedAt: string;
  readonly items: readonly PlaylistItem[];
  readonly currentIndex: number;
  readonly currentItemStartedAt: string;
  readonly currentItemStartedAtMs: number;
  readonly currentItemRemainingSeconds: number;
  readonly currentItemEndAtMs: number;
  readonly completedItems: number;
  readonly completedDurationSeconds: number;
  readonly totalIntendedDurationSeconds: number;
}

export interface PlaylistRunOutcome {
  readonly status: SessionLogStatus;
  readonly playlistName: string;
  readonly completedItems: number;
  readonly totalItems: number;
  readonly completedDurationSeconds: number;
  readonly endedAt: string;
}

export type PlaylistRunStartBlockReason =
  | 'playlists loading'
  | 'timer session active'
  | 'custom play run active'
  | 'playlist run active'
  | 'playlist not found'
  | 'playlist has no items';

export interface PlaylistRunStartResult {
  readonly started: boolean;
  readonly reason?: PlaylistRunStartBlockReason;
}

export type PlaylistDeleteBlockReason = 'playlist run active';

export interface PlaylistDeleteResult {
  readonly deleted: boolean;
  readonly reason?: PlaylistDeleteBlockReason;
  readonly persistenceError?: string;
}
