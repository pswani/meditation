import type { SessionLog } from '../types/sessionLog';
import type {
  SankalpaDraft,
  SankalpaGoal,
  SankalpaGoalType,
  SankalpaObservanceDay,
  SankalpaObservanceRecord,
  SankalpaObservanceRecordStatus,
  SankalpaProgress,
  SankalpaStatus,
  SankalpaValidationResult,
  TimeOfDayBucket,
} from '../types/sankalpa';

export { timeOfDayBuckets } from '../types/referenceData';

const DAY_MS = 24 * 60 * 60 * 1000;
const OBSERVANCE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const timeOfDayBucketLabels: Record<TimeOfDayBucket, string> = {
  morning: 'Morning (5:00-11:59)',
  afternoon: 'Afternoon (12:00-16:59)',
  evening: 'Evening (17:00-20:59)',
  night: 'Night (21:00-4:59)',
};

export const sankalpaGoalTypeLabels: Record<SankalpaGoalType, string> = {
  'duration-based': 'Duration goal',
  'session-count-based': 'Session-count goal',
  'observance-based': 'Observance goal',
};

export const sankalpaObservanceStatusLabels: Record<SankalpaObservanceDay['status'], string> = {
  pending: 'Pending',
  observed: 'Observed',
  missed: 'Missed',
};

export interface SankalpaProgressByStatus {
  readonly active: SankalpaProgress[];
  readonly completed: SankalpaProgress[];
  readonly expired: SankalpaProgress[];
  readonly archived: SankalpaProgress[];
}

function padDatePart(value: number): string {
  return value.toString().padStart(2, '0');
}

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addLocalDays(date: Date, offsetDays: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays, date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
}

function parseObservanceDate(date: string): Date | null {
  if (!OBSERVANCE_DATE_PATTERN.test(date)) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = date.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function isValidObservanceDate(date: string): boolean {
  return parseObservanceDate(date) !== null;
}

export function isObservanceGoalType(goalType: SankalpaGoalType | '' | undefined): goalType is 'observance-based' {
  return goalType === 'observance-based';
}

export function normalizeObservanceRecords(
  records: readonly SankalpaObservanceRecord[] | undefined
): SankalpaObservanceRecord[] {
  if (!records) {
    return [];
  }

  const normalizedByDate = new Map<string, SankalpaObservanceRecordStatus>();
  for (const record of records) {
    if (!record || !isValidObservanceDate(record.date)) {
      continue;
    }
    if (record.status !== 'observed' && record.status !== 'missed') {
      continue;
    }

    normalizedByDate.set(record.date, record.status);
  }

  return [...normalizedByDate.entries()]
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, status]) => ({
      date,
      status,
    }));
}

function deriveObservanceWindow(goal: SankalpaGoal, now: Date) {
  const startDate = startOfLocalDay(new Date(goal.createdAt));
  const todayKey = formatLocalDate(startOfLocalDay(now));
  const lastScheduledDate = addLocalDays(startDate, Math.max(0, goal.days - 1));
  const recordsByDate = new Map(normalizeObservanceRecords(goal.observanceRecords).map((record) => [record.date, record.status]));

  let matchedObservanceCount = 0;
  let missedObservanceCount = 0;
  const observanceDays: SankalpaObservanceDay[] = Array.from({ length: goal.days }, (_, index) => {
    const currentDate = addLocalDays(startDate, index);
    const date = formatLocalDate(currentDate);
    const savedStatus = recordsByDate.get(date);
    if (savedStatus === 'observed') {
      matchedObservanceCount += 1;
    } else if (savedStatus === 'missed') {
      missedObservanceCount += 1;
    }

    return {
      date,
      status: savedStatus ?? 'pending',
      isFuture: date > todayKey,
    };
  });

  return {
    observanceDays,
    matchedObservanceCount,
    missedObservanceCount,
    pendingObservanceCount: observanceDays.length - matchedObservanceCount - missedObservanceCount,
    targetObservanceCount: Math.round(goal.targetValue),
    deadlineAt: endOfLocalDay(lastScheduledDate).toISOString(),
  };
}

export function createInitialSankalpaDraft(): SankalpaDraft {
  return {
    goalType: 'duration-based',
    targetValue: 120,
    days: 7,
    meditationType: '',
    timeOfDayBucket: '',
    observanceLabel: '',
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
    observanceLabel?: string;
  } = {};

  if (!draft.goalType) {
    errors.goalType = 'Goal type is required.';
  }

  if (!Number.isFinite(draft.days) || draft.days <= 0) {
    errors.days = 'Days must be greater than 0.';
  }
  if (Number.isFinite(draft.days) && !Number.isInteger(draft.days)) {
    errors.days = 'Days must be a whole number.';
  }

  if (isObservanceGoalType(draft.goalType)) {
    if (!draft.observanceLabel.trim()) {
      errors.observanceLabel = 'Observance is required.';
    }
  } else {
    if (!Number.isFinite(draft.targetValue) || draft.targetValue <= 0) {
      errors.targetValue = 'Target value must be greater than 0.';
    }
    if (draft.goalType === 'session-count-based' && Number.isFinite(draft.targetValue) && !Number.isInteger(draft.targetValue)) {
      errors.targetValue = 'Target session logs must be a whole number.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function createSankalpaGoal(draft: SankalpaDraft, now: Date): SankalpaGoal {
  const observanceGoal = isObservanceGoalType(draft.goalType);

  return {
    id: `sankalpa-${now.getTime()}-${Math.round(Math.random() * 100000)}`,
    goalType: draft.goalType as SankalpaGoal['goalType'],
    targetValue: observanceGoal ? draft.days : draft.targetValue,
    days: draft.days,
    meditationType: observanceGoal ? undefined : draft.meditationType || undefined,
    timeOfDayBucket: observanceGoal ? undefined : draft.timeOfDayBucket || undefined,
    observanceLabel: observanceGoal ? draft.observanceLabel.trim() : undefined,
    observanceRecords: observanceGoal ? [] : undefined,
    createdAt: now.toISOString(),
    archived: false,
  };
}

export function createSankalpaDraftFromGoal(goal: SankalpaGoal): SankalpaDraft {
  return {
    goalType: goal.goalType,
    targetValue: goal.goalType === 'observance-based' ? goal.days : goal.targetValue,
    days: goal.days,
    meditationType: goal.meditationType ?? '',
    timeOfDayBucket: goal.timeOfDayBucket ?? '',
    observanceLabel: goal.observanceLabel ?? '',
  };
}

export function updateSankalpaGoal(existing: SankalpaGoal, draft: SankalpaDraft): SankalpaGoal {
  const observanceGoal = isObservanceGoalType(draft.goalType);

  return {
    ...existing,
    goalType: draft.goalType as SankalpaGoal['goalType'],
    targetValue: observanceGoal ? draft.days : draft.targetValue,
    days: draft.days,
    meditationType: observanceGoal ? undefined : draft.meditationType || undefined,
    timeOfDayBucket: observanceGoal ? undefined : draft.timeOfDayBucket || undefined,
    observanceLabel: observanceGoal ? draft.observanceLabel.trim() : undefined,
    observanceRecords: observanceGoal ? normalizeObservanceRecords(existing.observanceRecords) : undefined,
    archived: false,
  };
}

export function setSankalpaObservanceStatus(
  goal: SankalpaGoal,
  date: string,
  status: SankalpaObservanceRecordStatus | 'pending'
): SankalpaGoal {
  if (!isObservanceGoalType(goal.goalType) || !isValidObservanceDate(date)) {
    return goal;
  }

  const nextRecords = normalizeObservanceRecords(goal.observanceRecords);
  const nextRecordIndex = nextRecords.findIndex((record) => record.date === date);
  if (status === 'pending') {
    if (nextRecordIndex === -1) {
      return goal;
    }

    nextRecords.splice(nextRecordIndex, 1);
  } else if (nextRecordIndex === -1) {
    nextRecords.push({ date, status });
  } else {
    nextRecords[nextRecordIndex] = {
      date,
      status,
    };
  }

  return {
    ...goal,
    observanceRecords: normalizeObservanceRecords(nextRecords),
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
  const matchingSessionLogs =
    goal.goalType === 'observance-based'
      ? []
      : sessionLogs.filter(
          (sessionLog) => sessionLogInGoalWindow(sessionLog, goal) && sessionLogMatchesFilters(sessionLog, goal)
        );

  const matchedSessionCount = matchingSessionLogs.length;
  const matchedDurationSeconds = matchingSessionLogs.reduce((total, sessionLog) => total + sessionLog.completedDurationSeconds, 0);
  const targetSessionCount = goal.goalType === 'session-count-based' ? goal.targetValue : 0;
  const targetDurationSeconds = goal.goalType === 'duration-based' ? Math.round(goal.targetValue * 60) : 0;
  const {
    observanceDays,
    matchedObservanceCount,
    missedObservanceCount,
    pendingObservanceCount,
    targetObservanceCount,
    deadlineAt,
  } = goal.goalType === 'observance-based'
    ? deriveObservanceWindow(goal, now)
    : {
        observanceDays: [],
        matchedObservanceCount: 0,
        missedObservanceCount: 0,
        pendingObservanceCount: 0,
        targetObservanceCount: 0,
        deadlineAt: new Date(
          (Number.isNaN(Date.parse(goal.createdAt)) ? now.getTime() : Date.parse(goal.createdAt)) + goal.days * DAY_MS
        ).toISOString(),
      };

  const targetValue =
    goal.goalType === 'duration-based'
      ? targetDurationSeconds
      : goal.goalType === 'session-count-based'
        ? targetSessionCount
        : targetObservanceCount;
  const progressValue =
    goal.goalType === 'duration-based'
      ? matchedDurationSeconds
      : goal.goalType === 'session-count-based'
        ? matchedSessionCount
        : matchedObservanceCount;

  const status: SankalpaStatus =
    goal.archived === true
      ? 'archived'
      : progressValue >= targetValue
        ? 'completed'
        : now.getTime() > Date.parse(deadlineAt)
          ? 'expired'
          : 'active';

  return {
    goal: {
      ...goal,
      observanceRecords: normalizeObservanceRecords(goal.observanceRecords),
    },
    status,
    deadlineAt,
    matchedSessionCount,
    matchedDurationSeconds,
    targetSessionCount,
    targetDurationSeconds,
    matchedObservanceCount,
    missedObservanceCount,
    pendingObservanceCount,
    targetObservanceCount,
    observanceDays,
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
