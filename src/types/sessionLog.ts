import type { MeditationType, TimerMode } from './timer';
export type { SessionLogSource } from './referenceData';
import type { SessionLogSource } from './referenceData';

export type SessionLogStatus = 'completed' | 'ended early';

export interface SessionLog {
  readonly id: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly meditationType: MeditationType;
  readonly timerMode: TimerMode;
  readonly intendedDurationSeconds: number | null;
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
  readonly playlistRunId?: string;
  readonly playlistRunStartedAt?: string;
  readonly playlistItemPosition?: number;
  readonly playlistItemCount?: number;
  readonly customPlayId?: string;
  readonly customPlayName?: string;
  readonly customPlayRecordingLabel?: string;
}
