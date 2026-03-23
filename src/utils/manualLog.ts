import type { SessionLog } from '../types/sessionLog';
import type { MeditationType } from '../types/timer';

export interface ManualLogInput {
  durationMinutes: number;
  meditationType: MeditationType | '';
  sessionTimestamp: string;
}

export interface ManualLogValidationResult {
  readonly isValid: boolean;
  readonly errors: {
    durationMinutes?: string;
    meditationType?: string;
    sessionTimestamp?: string;
  };
}

export function validateManualLogInput(input: ManualLogInput): ManualLogValidationResult {
  const errors: ManualLogValidationResult['errors'] = {};

  if (Number.isNaN(input.durationMinutes) || input.durationMinutes <= 0) {
    errors.durationMinutes = 'Duration must be greater than 0.';
  }

  if (!input.meditationType) {
    errors.meditationType = 'Meditation type is required.';
  }

  if (!input.sessionTimestamp) {
    errors.sessionTimestamp = 'Session timestamp is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildManualLogEntry(input: ManualLogInput, now: Date): SessionLog {
  const startedAtMs = new Date(input.sessionTimestamp).getTime();
  const durationSeconds = Math.round(input.durationMinutes * 60);
  const endedAtMs = startedAtMs + durationSeconds * 1000;

  return {
    id: `manual-log-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date(startedAtMs).toISOString(),
    endedAt: new Date(endedAtMs).toISOString(),
    meditationType: input.meditationType as MeditationType,
    intendedDurationSeconds: durationSeconds,
    completedDurationSeconds: durationSeconds,
    status: 'completed',
    source: 'manual log',
    startSound: 'None',
    endSound: 'None',
    intervalEnabled: false,
    intervalMinutes: 0,
    intervalSound: 'None',
  };
}
