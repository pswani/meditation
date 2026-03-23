import type { MeditationType } from './timer';

export type SessionLogStatus = 'completed' | 'ended early';

export interface SessionLog {
  readonly id: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly meditationType: MeditationType;
  readonly intendedDurationSeconds: number;
  readonly completedDurationSeconds: number;
  readonly status: SessionLogStatus;
  readonly source: 'auto log';
  readonly startSound: string;
  readonly endSound: string;
  readonly intervalEnabled: boolean;
  readonly intervalMinutes: number;
}
