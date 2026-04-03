import type { MeditationType } from './timer';

export type SankalpaGoalType = 'duration-based' | 'session-count-based';
export type TimeOfDayBucket = 'morning' | 'afternoon' | 'evening' | 'night';
export type SankalpaStatus = 'active' | 'completed' | 'expired' | 'archived';

export interface SankalpaGoal {
  readonly id: string;
  readonly goalType: SankalpaGoalType;
  readonly targetValue: number;
  readonly days: number;
  readonly meditationType?: MeditationType;
  readonly timeOfDayBucket?: TimeOfDayBucket;
  readonly createdAt: string;
  readonly archived?: boolean;
}

export interface SankalpaDraft {
  goalType: SankalpaGoalType | '';
  targetValue: number;
  days: number;
  meditationType: MeditationType | '';
  timeOfDayBucket: TimeOfDayBucket | '';
}

export interface SankalpaValidationResult {
  readonly isValid: boolean;
  readonly errors: {
    goalType?: string;
    targetValue?: string;
    days?: string;
  };
}

export interface SankalpaProgress {
  readonly goal: SankalpaGoal;
  readonly status: SankalpaStatus;
  readonly deadlineAt: string;
  readonly matchedSessionCount: number;
  readonly matchedDurationSeconds: number;
  readonly targetSessionCount: number;
  readonly targetDurationSeconds: number;
  readonly progressRatio: number;
}
