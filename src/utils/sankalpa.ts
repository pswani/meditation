import type { SessionLog } from '../types/sessionLog';
import type {
  SankalpaDraft,
  SankalpaGoal,
  SankalpaGoalType,
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

export const sankalpaGoalTypeLabels: Record<SankalpaGoalType, string> = {
  'duration-based': 'Duration goal',
  'session-count-based': 'Session-count goal',
};

export interface SankalpaProgressByStatus {
  readonly active: SankalpaProgress[];
  readonly completed: SankalpaProgress[];
  readonly expired: SankalpaProgress[];
  readonly archived: SankalpaProgress[];
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

export function getSankalpaGoalTypeLabel(goalType: SankalpaGoalType): string {
  return sankalpaGoalTypeLabels[goalType];
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
  if (draft.goalType === 'session-count-based' && Number.isFinite(draft.targetValue) && !Number.isInteger(draft.targetValue)) {
    errors.targetValue = 'Target session logs must be a whole number.';
  }

  if (!Number.isFinite(draft.days) || draft.days <= 0) {
    errors.days = 'Days must be greater than 0.';
  }
  if (Number.isFinite(draft.days) && !Number.isInteger(draft.days)) {
    errors.days = 'Days must be a whole number.';
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
    archived: false,
  };
}

export function createSankalpaDraftFromGoal(goal: SankalpaGoal): SankalpaDraft {
  return {
    goalType: goal.goalType,
    targetValue: goal.targetValue,
    days: goal.days,
    meditationType: goal.meditationType ?? '',
    timeOfDayBucket: goal.timeOfDayBucket ?? '',
  };
}

export function updateSankalpaGoal(existing: SankalpaGoal, draft: SankalpaDraft): SankalpaGoal {
  return {
    ...existing,
    goalType: draft.goalType as SankalpaGoal['goalType'],
    targetValue: draft.targetValue,
    days: draft.days,
    meditationType: draft.meditationType || undefined,
    timeOfDayBucket: draft.timeOfDayBucket || undefined,
    archived: false,
  };
}

export function archiveSankalpaGoal(goal: SankalpaGoal): SankalpaGoal {
  return {
    ...goal,
    archived: true,
  };
}

export function unarchiveSankalpaGoal(goal: SankalpaGoal): SankalpaGoal {
  return {
    ...goal,
    archived: false,
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
    goal.archived === true
      ? 'archived'
      : progressValue >= targetValue
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
    archived: progressList.filter((entry) => entry.status === 'archived'),
  };
}
