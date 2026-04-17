import type { SessionLog } from '../types/sessionLog';
import type { MeditationType } from '../types/timer';
import type { TimerMode } from '../types/timer';

export interface ManualLogInput {
  timerMode: TimerMode;
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

export interface ManualLogSaveResult extends ManualLogValidationResult {
  readonly persisted: boolean;
  readonly persistenceError?: string;
}

export interface ManualLogCreateRequest {
  readonly timerMode: TimerMode;
  readonly durationMinutes: number;
  readonly meditationType: MeditationType;
  readonly sessionTimestamp: string;
}

function parseManualTimestamp(timestamp: string): number | null {
  const parsedMs = new Date(timestamp).getTime();
  if (Number.isNaN(parsedMs)) {
    return null;
  }

  return parsedMs;
}

export function validateManualLogInput(input: ManualLogInput, now: Date = new Date()): ManualLogValidationResult {
  const errors: ManualLogValidationResult['errors'] = {};

  if (Number.isNaN(input.durationMinutes) || input.durationMinutes <= 0) {
    errors.durationMinutes = 'Duration must be greater than 0.';
  }

  if (!input.meditationType) {
    errors.meditationType = 'Meditation type is required.';
  }

  if (!input.sessionTimestamp) {
    errors.sessionTimestamp = 'Session timestamp is required.';
  } else {
    const parsedTimestamp = parseManualTimestamp(input.sessionTimestamp);
    if (parsedTimestamp === null) {
      errors.sessionTimestamp = 'Session timestamp must be a valid date and time.';
    } else if (parsedTimestamp > now.getTime()) {
      errors.sessionTimestamp = 'Session timestamp cannot be in the future.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildManualLogCreateRequest(input: ManualLogInput): ManualLogCreateRequest {
  const sessionTimestampMs = parseManualTimestamp(input.sessionTimestamp);
  if (sessionTimestampMs === null) {
    throw new Error('Manual log timestamp is invalid.');
  }

  if (!input.meditationType) {
    throw new Error('Manual log meditation type is invalid.');
  }

  return {
    timerMode: input.timerMode,
    durationMinutes: input.durationMinutes,
    meditationType: input.meditationType,
    sessionTimestamp: new Date(sessionTimestampMs).toISOString(),
  };
}

export function buildManualLogEntry(input: ManualLogInput, now: Date): SessionLog {
  const request = buildManualLogCreateRequest(input);
  const endedAtMs = new Date(request.sessionTimestamp).getTime();
  const durationSeconds = Math.round(request.durationMinutes * 60);
  const startedAtMs = endedAtMs - durationSeconds * 1000;

  return {
    id: `manual-log-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: new Date(startedAtMs).toISOString(),
    endedAt: new Date(endedAtMs).toISOString(),
    meditationType: request.meditationType,
    timerMode: request.timerMode,
    intendedDurationSeconds: request.timerMode === 'open-ended' ? null : durationSeconds,
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
