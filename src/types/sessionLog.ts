import type { MeditationType } from './timer';

export type SessionLogStatus = 'completed' | 'ended early';
export type SessionLogSource = 'auto log' | 'manual log';

export interface SessionLog {
  readonly id: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly meditationType: MeditationType;
  readonly intendedDurationSeconds: number;
  readonly completedDurationSeconds: number;
  readonly status: SessionLogStatus;
  readonly source: SessionLogSource;
  readonly startSound: string;
  readonly endSound: string;
  readonly intervalEnabled: boolean;
  readonly intervalMinutes: number;
  readonly intervalSound: string;
  readonly playlistId?: string;
  readonly playlistName?: string;
  readonly playlistItemPosition?: number;
  readonly playlistItemCount?: number;
}
