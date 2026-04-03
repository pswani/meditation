import type { MeditationType } from './timer';

export interface CustomPlay {
  readonly id: string;
  readonly name: string;
  readonly meditationType: MeditationType;
  readonly durationMinutes: number;
  readonly startSound: string;
  readonly endSound: string;
  readonly mediaAssetId: string;
  readonly recordingLabel: string;
  readonly favorite: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CustomPlayDraft {
  name: string;
  meditationType: MeditationType | '';
  durationMinutes: number;
  startSound: string;
  endSound: string;
  mediaAssetId: string;
  recordingLabel: string;
}

export interface CustomPlayValidationResult {
  readonly isValid: boolean;
  readonly errors: {
    name?: string;
    meditationType?: string;
    durationMinutes?: string;
    mediaAssetId?: string;
  };
}

export interface CustomPlaySaveResult extends CustomPlayValidationResult {
  readonly persisted: boolean;
  readonly persistenceError?: string;
}

export interface ActiveCustomPlayRun {
  readonly runId: string;
  readonly customPlayId: string;
  readonly customPlayName: string;
  readonly meditationType: MeditationType;
  readonly recordingLabel: string;
  readonly mediaAssetId: string;
  readonly mediaLabel: string;
  readonly mediaFilePath: string;
  readonly durationSeconds: number;
  readonly startedAt: string;
  readonly startedAtMs: number;
  readonly currentPositionSeconds: number;
  readonly isPaused: boolean;
  readonly startSound: string;
  readonly endSound: string;
}

export interface CustomPlayRunOutcome {
  readonly status: 'completed' | 'ended early';
  readonly customPlayId: string;
  readonly customPlayName: string;
  readonly completedDurationSeconds: number;
  readonly endedAt: string;
}

export type CustomPlayRunStartBlockReason =
  | 'custom plays loading'
  | 'timer session active'
  | 'playlist run active'
  | 'custom play run active'
  | 'custom play not found'
  | 'media unavailable';

export interface CustomPlayRunStartResult {
  readonly started: boolean;
  readonly reason?: CustomPlayRunStartBlockReason;
}
