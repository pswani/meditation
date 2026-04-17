import type { MeditationType } from './timer';
export type { TimeOfDayBucket } from './referenceData';
import type { TimeOfDayBucket } from './referenceData';

export type SankalpaGoalType = 'duration-based' | 'session-count-based' | 'observance-based';
export type SankalpaStatus = 'active' | 'completed' | 'expired' | 'archived';
export type SankalpaObservanceRecordStatus = 'observed' | 'missed';
export type SankalpaObservanceDayStatus = SankalpaObservanceRecordStatus | 'pending';
export type SankalpaCadenceMode = 'cumulative' | 'weekly';
export type SankalpaRecurringWeekStatus = 'met' | 'active' | 'missed' | 'upcoming';

export interface SankalpaObservanceRecord {
  readonly date: string;
  readonly status: SankalpaObservanceRecordStatus;
}

export interface SankalpaObservanceDay {
  readonly date: string;
  readonly status: SankalpaObservanceDayStatus;
  readonly isFuture: boolean;
}

export interface SankalpaRecurringWeekProgress {
  readonly weekIndex: number;
  readonly startDate: string;
  readonly endDate: string;
  readonly qualifyingDayCount: number;
  readonly requiredQualifyingDayCount: number;
  readonly status: SankalpaRecurringWeekStatus;
}

export interface SankalpaGoal {
  readonly id: string;
  readonly goalType: SankalpaGoalType;
  readonly targetValue: number;
  readonly days: number;
  readonly qualifyingDaysPerWeek?: number;
  readonly meditationType?: MeditationType;
  readonly timeOfDayBucket?: TimeOfDayBucket;
  readonly observanceLabel?: string;
  readonly observanceRecords?: SankalpaObservanceRecord[];
  readonly createdAt: string;
  readonly archived?: boolean;
}

export interface SankalpaDraft {
  goalType: SankalpaGoalType | '';
  cadenceMode: SankalpaCadenceMode;
  targetValue: number;
  days: number;
  weeks: number;
  qualifyingDaysPerWeek: number;
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
    weeks?: string;
    qualifyingDaysPerWeek?: string;
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
  readonly metRecurringWeekCount: number;
  readonly targetRecurringWeekCount: number;
  readonly recurringWeeks: SankalpaRecurringWeekProgress[];
  readonly matchedObservanceCount: number;
  readonly missedObservanceCount: number;
  readonly pendingObservanceCount: number;
  readonly targetObservanceCount: number;
  readonly observanceDays: SankalpaObservanceDay[];
  readonly progressRatio: number;
}
