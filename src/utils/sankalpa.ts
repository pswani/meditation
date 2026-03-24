import type { SessionLog } from '../types/sessionLog';
import type {
  SankalpaDraft,
  SankalpaGoal,
  SankalpaProgress,
  SankalpaStatus,
  SankalpaValidationResult,
  TimeOfDayBucket,
} from '../types/sankalpa';

const DAY_MS = 24 * 60 * 60 * 1000;

export const timeOfDayBuckets: readonly TimeOfDayBucket[] = ['morning', 'afternoon', 'evening', 'night'];

export const timeOfDayBucketLabels: Record<TimeOfDayBucket, string> = {
  morning: 'Morning (5:00-11:59)',
  afternoon: 'Afternoon (12:00-16:59)',
  evening: 'Evening (17:00-20:59)',
  night: 'Night (21:00-4:59)',
};

export interface SankalpaProgressByStatus {
  readonly active: SankalpaProgress[];
  readonly completed: SankalpaProgress[];
  readonly expired: SankalpaProgress[];
}

export function createInitialSankalpaDraft(): SankalpaDraft {
  return {
    goalType: 'duration-based',
    targetValue: 120,
    days: 7,
    meditationType: '',
    timeOfDayBucket: '',
  };
}

export function validateSankalpaDraft(draft: SankalpaDraft): SankalpaValidationResult {
  const errors: {
    goalType?: string;
    targetValue?: string;
    days?: string;
  } = {};

  if (!draft.goalType) {
    errors.goalType = 'Goal type is required.';
  }

  if (!Number.isFinite(draft.targetValue) || draft.targetValue <= 0) {
    errors.targetValue = 'Target value must be greater than 0.';
  }

  if (!Number.isFinite(draft.days) || draft.days <= 0) {
    errors.days = 'Days must be greater than 0.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function createSankalpaGoal(draft: SankalpaDraft, now: Date): SankalpaGoal {
  return {
    id: `sankalpa-${now.getTime()}-${Math.round(Math.random() * 100000)}`,
    goalType: draft.goalType as SankalpaGoal['goalType'],
    targetValue: draft.targetValue,
    days: draft.days,
    meditationType: draft.meditationType || undefined,
    timeOfDayBucket: draft.timeOfDayBucket || undefined,
    createdAt: now.toISOString(),
  };
}

export function getTimeOfDayBucket(date: Date): TimeOfDayBucket {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'afternoon';
  }
  if (hour >= 17 && hour < 21) {
    return 'evening';
  }
  return 'night';
}

function sessionLogMatchesFilters(sessionLog: SessionLog, goal: SankalpaGoal): boolean {
  if (goal.meditationType && sessionLog.meditationType !== goal.meditationType) {
    return false;
  }

  if (goal.timeOfDayBucket) {
    const bucket = getTimeOfDayBucket(new Date(sessionLog.endedAt));
    if (bucket !== goal.timeOfDayBucket) {
      return false;
    }
  }

  return true;
}

function sessionLogInGoalWindow(sessionLog: SessionLog, goal: SankalpaGoal): boolean {
  const endedAtMs = Date.parse(sessionLog.endedAt);
  const createdAtMs = Date.parse(goal.createdAt);
  if (Number.isNaN(endedAtMs) || Number.isNaN(createdAtMs)) {
    return false;
  }

  const deadlineMs = createdAtMs + goal.days * DAY_MS;
  return endedAtMs >= createdAtMs && endedAtMs <= deadlineMs;
}

export function deriveSankalpaProgress(goal: SankalpaGoal, sessionLogs: readonly SessionLog[], now: Date): SankalpaProgress {
  const matchingSessionLogs = sessionLogs.filter(
    (sessionLog) => sessionLogInGoalWindow(sessionLog, goal) && sessionLogMatchesFilters(sessionLog, goal)
  );
  const matchedSessionCount = matchingSessionLogs.length;
  const matchedDurationSeconds = matchingSessionLogs.reduce((total, sessionLog) => total + sessionLog.completedDurationSeconds, 0);
  const targetSessionCount = goal.goalType === 'session-count-based' ? goal.targetValue : 0;
  const targetDurationSeconds = goal.goalType === 'duration-based' ? Math.round(goal.targetValue * 60) : 0;
  const targetValue = goal.goalType === 'duration-based' ? targetDurationSeconds : targetSessionCount;
  const progressValue = goal.goalType === 'duration-based' ? matchedDurationSeconds : matchedSessionCount;
  const goalCreatedAtMs = Date.parse(goal.createdAt);
  const deadlineMs = Number.isNaN(goalCreatedAtMs) ? now.getTime() : goalCreatedAtMs + goal.days * DAY_MS;
  const deadlineAt = new Date(deadlineMs).toISOString();

  const status: SankalpaStatus =
    progressValue >= targetValue
      ? 'completed'
      : now.getTime() > deadlineMs
        ? 'expired'
        : 'active';

  return {
    goal,
    status,
    deadlineAt,
    matchedSessionCount,
    matchedDurationSeconds,
    targetSessionCount,
    targetDurationSeconds,
    progressRatio: targetValue === 0 ? 0 : Math.min(progressValue / targetValue, 1),
  };
}

export function partitionSankalpaProgress(progressList: readonly SankalpaProgress[]): SankalpaProgressByStatus {
  return {
    active: progressList.filter((entry) => entry.status === 'active'),
    completed: progressList.filter((entry) => entry.status === 'completed'),
    expired: progressList.filter((entry) => entry.status === 'expired'),
  };
}
