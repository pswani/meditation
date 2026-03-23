export type MeditationType = 'Vipassana' | 'Ajapa' | 'Tratak' | 'Kriya' | 'Sahaj';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'ended early';

export interface TimerSettings {
  durationMinutes: number;
  meditationType: MeditationType | '';
  startSound: string;
  endSound: string;
  intervalEnabled: boolean;
  intervalMinutes: number;
  intervalSound: string;
}

export interface ActiveSession {
  readonly startedAt: string;
  readonly startedAtMs: number;
  readonly intendedDurationSeconds: number;
  readonly remainingSeconds: number;
  readonly meditationType: MeditationType;
  readonly startSound: string;
  readonly endSound: string;
  readonly intervalEnabled: boolean;
  readonly intervalMinutes: number;
  readonly intervalSound: string;
  readonly endAtMs: number;
}

export interface TimerOutcome {
  readonly status: Extract<TimerStatus, 'completed' | 'ended early'>;
  readonly endedAt: string;
  readonly completedDurationSeconds: number;
}

export interface TimerValidationResult {
  readonly isValid: boolean;
  errors: {
    durationMinutes?: string;
    meditationType?: string;
    intervalMinutes?: string;
  };
}
