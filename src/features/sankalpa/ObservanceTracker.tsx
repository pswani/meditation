import type { SankalpaObservanceDay, SankalpaProgress, SankalpaRecurringWeekProgress } from '../../types/sankalpa';
import { isRecurringCadenceGoal, sankalpaObservanceStatusLabels } from '../../utils/sankalpa';

interface ObservanceTrackerProps {
  readonly progress: SankalpaProgress;
  readonly readOnly?: boolean;
  readonly onChangeStatus?: (date: string, status: 'pending' | 'observed' | 'missed') => void;
}

function formatObservanceDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatCompactDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function chunkObservanceDays(days: readonly SankalpaObservanceDay[]): SankalpaObservanceDay[][] {
  const chunks: SankalpaObservanceDay[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    chunks.push(days.slice(index, index + 7));
  }
  return chunks;
}

function buildWeekProgressFromDays(days: readonly SankalpaObservanceDay[], weekIndex: number): SankalpaRecurringWeekProgress {
  const qualifyingDayCount = days.filter((entry) => entry.status === 'observed').length;
  const missedDayCount = days.filter((entry) => entry.status === 'missed').length;
  const isUpcoming = days.every((entry) => entry.isFuture);
  const hasOpenDate = days.some((entry) => !entry.isFuture);
  const status: SankalpaRecurringWeekProgress['status'] =
    missedDayCount > 0
      ? 'active'
      : qualifyingDayCount === days.length
        ? 'met'
        : isUpcoming
          ? 'upcoming'
          : hasOpenDate
            ? 'active'
            : 'missed';

  return {
    weekIndex,
    startDate: days[0]?.date ?? '',
    endDate: days[days.length - 1]?.date ?? '',
    qualifyingDayCount,
    requiredQualifyingDayCount: days.length,
    status,
  };
}

function weekStatusLabel(status: SankalpaRecurringWeekProgress['status']): string {
  if (status === 'met') {
    return 'Met';
  }
  if (status === 'missed') {
    return 'Missed';
  }
  if (status === 'upcoming') {
    return 'Upcoming';
  }
  return 'Active';
}

function orderWeekGroups<T extends { week: SankalpaRecurringWeekProgress }>(groups: readonly T[]): T[] {
  const activeWeek = groups.find((group) => group.week.status === 'active');
  if (!activeWeek) {
    return [...groups];
  }

  return [
    activeWeek,
    ...groups.filter((group) => group.week.weekIndex !== activeWeek.week.weekIndex),
  ];
}

export function ObservanceTracker({ progress, readOnly = false, onChangeStatus }: ObservanceTrackerProps) {
  if (progress.goal.goalType !== 'observance-based') {
    return null;
  }

  const weeklyCadence = isRecurringCadenceGoal(progress.goal);
  const weekGroups = orderWeekGroups(
    chunkObservanceDays(progress.observanceDays).map((days, index) => ({
      week: weeklyCadence && progress.recurringWeeks[index]
        ? progress.recurringWeeks[index]
        : buildWeekProgressFromDays(days, index + 1),
      days,
    }))
  );

  return (
    <div className="observance-tracker">
      <p className="section-subtitle">
        {weeklyCadence
          ? `Weeks met: ${progress.metRecurringWeekCount} / ${progress.targetRecurringWeekCount} · Observed dates: ${progress.matchedObservanceCount} · Missed: ${progress.missedObservanceCount} · Pending: ${progress.pendingObservanceCount}`
          : `Observed: ${progress.matchedObservanceCount} · Missed: ${progress.missedObservanceCount} · Pending: ${progress.pendingObservanceCount}`}
      </p>
      <div className="observance-week-list">
        {weekGroups.map(({ week, days }, index) => (
          <details
            key={`${progress.goal.id}-observance-week-${week.weekIndex}`}
            className="observance-week"
            open={index === 0 || week.status === 'active'}
          >
            <summary>
              <span>
                Week {week.weekIndex} · {formatCompactDate(week.startDate)}-{formatCompactDate(week.endDate)}
              </span>
              <span className={`pill ${week.status === 'met' ? 'ok' : week.status === 'missed' ? 'warn' : 'active'}`}>
                {weekStatusLabel(week.status)}
              </span>
              <span className="observance-week-count">
                {week.qualifyingDayCount}/{week.requiredQualifyingDayCount} observed
              </span>
            </summary>
            <ul className="summary-by-type-list observance-list">
              {days.map((entry) => (
                <li key={entry.date} className="summary-by-type-row observance-row">
                  <span>{formatObservanceDate(entry.date)}</span>
                  <select
                    aria-label={`Observance status for ${entry.date}`}
                    value={entry.status}
                    disabled={readOnly || entry.isFuture || !onChangeStatus}
                    onChange={(event) => onChangeStatus?.(entry.date, event.target.value as 'pending' | 'observed' | 'missed')}
                  >
                    <option value="pending">{sankalpaObservanceStatusLabels.pending}</option>
                    <option value="observed">{sankalpaObservanceStatusLabels.observed}</option>
                    <option value="missed">{sankalpaObservanceStatusLabels.missed}</option>
                  </select>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
      {progress.observanceDays.some((entry) => entry.isFuture) ? (
        <p className="section-subtitle">Future dates unlock on their day so check-ins stay trustworthy.</p>
      ) : null}
    </div>
  );
}
