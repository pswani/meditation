import type { MeditationType } from './timer';
export type { TimeOfDayBucket } from './referenceData';
import type { TimeOfDayBucket } from './referenceData';

export type SankalpaGoalType = 'duration-based' | 'session-count-based' | 'observance-based';
export type SankalpaStatus = 'active' | 'completed' | 'expired' | 'archived';
export type SankalpaObservanceRecordStatus = 'observed' | 'missed';
export type SankalpaObservanceDayStatus = SankalpaObservanceRecordStatus | 'pending';

export interface SankalpaObservanceRecord {
  readonly date: string;
  readonly status: SankalpaObservanceRecordStatus;
}

export interface SankalpaObservanceDay {
  readonly date: string;
  readonly status: SankalpaObservanceDayStatus;
  readonly isFuture: boolean;
}

export interface SankalpaGoal {
  readonly id: string;
  readonly goalType: SankalpaGoalType;
  readonly targetValue: number;
  readonly days: number;
  readonly meditationType?: MeditationType;
  readonly timeOfDayBucket?: TimeOfDayBucket;
  readonly observanceLabel?: string;
  readonly observanceRecords?: SankalpaObservanceRecord[];
  readonly createdAt: string;
  readonly archived?: boolean;
}

export interface SankalpaDraft {
  goalType: SankalpaGoalType | '';
  targetValue: number;
  days: number;
  meditationType: MeditationType | '';
  timeOfDayBucket: TimeOfDayBucket | '';
  observanceLabel: string;
}

export interface SankalpaValidationResult {
  readonly isValid: boolean;
  readonly errors: {
    goalType?: string;
    targetValue?: string;
    days?: string;
    observanceLabel?: string;
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
  readonly matchedObservanceCount: number;
  readonly missedObservanceCount: number;
  readonly pendingObservanceCount: number;
  readonly targetObservanceCount: number;
  readonly observanceDays: SankalpaObservanceDay[];
  readonly progressRatio: number;
}
