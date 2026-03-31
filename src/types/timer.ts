export type MeditationType = 'Vipassana' | 'Ajapa' | 'Tratak' | 'Kriya' | 'Sahaj';
export type TimerMode = 'fixed' | 'open-ended';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'ended early';

export interface TimerSettings {
  timerMode: TimerMode;
  durationMinutes: number | null;
  lastFixedDurationMinutes: number;
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
  readonly timerMode: TimerMode;
  readonly intendedDurationSeconds: number | null;
  readonly elapsedSeconds: number;
  readonly isPaused: boolean;
  readonly lastResumedAtMs: number | null;
  readonly meditationType: MeditationType;
  readonly startSound: string;
  readonly endSound: string;
  readonly intervalEnabled: boolean;
  readonly intervalMinutes: number;
  readonly intervalSound: string;
}

export interface TimerOutcome {
  readonly status: Extract<TimerStatus, 'completed' | 'ended early'>;
  readonly endedAt: string;
  readonly completedDurationSeconds: number;
  readonly timerMode: TimerMode;
}

export interface TimerValidationResult {
  readonly isValid: boolean;
  errors: {
    durationMinutes?: string;
    meditationType?: string;
    intervalMinutes?: string;
  };
}
