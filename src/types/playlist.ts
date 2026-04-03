import type { SessionLogStatus } from './sessionLog';
import type { MeditationType } from './timer';

export interface PlaylistItem {
  readonly id: string;
  readonly title: string;
  readonly meditationType: MeditationType;
  readonly durationMinutes: number;
  readonly customPlayId?: string;
}

export interface Playlist {
  readonly id: string;
  readonly name: string;
  readonly items: readonly PlaylistItem[];
  readonly smallGapSeconds: number;
  readonly favorite: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PlaylistDraftItem {
  readonly id: string;
  title: string;
  meditationType: MeditationType | '';
  durationMinutes: number;
  customPlayId: string;
}

export interface PlaylistDraft {
  name: string;
  smallGapSeconds: number;
  items: PlaylistDraftItem[];
}

export interface PlaylistValidationResult {
  readonly isValid: boolean;
  readonly errors: {
    name?: string;
    smallGapSeconds?: string;
    items?: string;
    itemErrors: Record<string, { meditationType?: string; durationMinutes?: string; customPlayId?: string }>;
  };
}

export interface PlaylistSaveResult extends PlaylistValidationResult {
  readonly persisted: boolean;
  readonly persistenceError?: string;
}

export interface ActivePlaylistRunItem {
  readonly id: string;
  readonly title: string;
  readonly meditationType: MeditationType;
  readonly durationMinutes: number;
  readonly customPlayId?: string;
  readonly customPlayName?: string;
  readonly customPlayRecordingLabel?: string;
  readonly mediaAssetId?: string;
  readonly mediaLabel?: string;
  readonly mediaFilePath?: string;
  readonly startSound: string;
  readonly endSound: string;
}

export interface ActivePlaylistRunItemSegment {
  readonly phase: 'item';
  readonly startedAt: string;
  readonly startedAtMs: number;
  readonly elapsedSeconds: number;
  readonly remainingSeconds: number;
  readonly endAtMs: number;
}

export interface ActivePlaylistRunGapSegment {
  readonly phase: 'gap';
  readonly startedAt: string;
  readonly startedAtMs: number;
  readonly remainingSeconds: number;
  readonly endAtMs: number;
}

export type ActivePlaylistRunSegment = ActivePlaylistRunItemSegment | ActivePlaylistRunGapSegment;

export interface ActivePlaylistRun {
  readonly runId: string;
  readonly playlistId: string;
  readonly playlistName: string;
  readonly runStartedAt: string;
  readonly items: readonly ActivePlaylistRunItem[];
  readonly smallGapSeconds: number;
  readonly currentIndex: number;
  readonly currentSegment: ActivePlaylistRunSegment;
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
  | 'playlist has no items'
  | 'playlist item unavailable';

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
