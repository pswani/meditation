import type { SessionLog } from '../types/sessionLog';
import type { SankalpaGoal, SankalpaProgress } from '../types/sankalpa';
import { deriveSankalpaProgress } from './sankalpa';

export interface TodayActivitySummary {
  readonly sessionLogCount: number;
  readonly completedCount: number;
  readonly endedEarlyCount: number;
  readonly totalDurationSeconds: number;
}

export function deriveTodayActivitySummary(
  sessionLogs: readonly SessionLog[],
  now: Date = new Date()
): TodayActivitySummary {
  const todayKey = now.toDateString();
  const todayLogs = sessionLogs.filter((entry) => new Date(entry.endedAt).toDateString() === todayKey);

  const completedCount = todayLogs.filter((entry) => entry.status === 'completed').length;

  return {
    sessionLogCount: todayLogs.length,
    completedCount,
    endedEarlyCount: todayLogs.length - completedCount,
    totalDurationSeconds: todayLogs.reduce((total, entry) => total + entry.completedDurationSeconds, 0),
  };
}

export function selectRecentSessionLogs(sessionLogs: readonly SessionLog[], limit = 5): SessionLog[] {
  return [...sessionLogs].slice(0, Math.max(0, limit));
}

export function selectTopActiveSankalpaProgress(
  goals: readonly SankalpaGoal[],
  sessionLogs: readonly SessionLog[],
  now: Date = new Date()
): SankalpaProgress | null {
  const active = goals
    .map((goal) => deriveSankalpaProgress(goal, sessionLogs, now))
    .filter((entry) => entry.status === 'active')
    .sort((left, right) => {
      const leftDeadline = Date.parse(left.deadlineAt);
      const rightDeadline = Date.parse(right.deadlineAt);
      if (leftDeadline !== rightDeadline) {
        return leftDeadline - rightDeadline;
      }

      return Date.parse(right.goal.createdAt) - Date.parse(left.goal.createdAt);
    });

  return active[0] ?? null;
}
