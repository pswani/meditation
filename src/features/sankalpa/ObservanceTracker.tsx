import type { SankalpaProgress } from '../../types/sankalpa';
import { sankalpaObservanceStatusLabels } from '../../utils/sankalpa';

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

export function ObservanceTracker({ progress, readOnly = false, onChangeStatus }: ObservanceTrackerProps) {
  if (progress.goal.goalType !== 'observance-based') {
    return null;
  }

  return (
    <div className="observance-tracker">
      <p className="section-subtitle">
        Observed: {progress.matchedObservanceCount} · Missed: {progress.missedObservanceCount} · Pending:{' '}
        {progress.pendingObservanceCount}
      </p>
      <ul className="summary-by-type-list observance-list">
        {progress.observanceDays.map((entry) => (
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
      {progress.observanceDays.some((entry) => entry.isFuture) ? (
        <p className="section-subtitle">Future dates unlock on their day so check-ins stay trustworthy.</p>
      ) : null}
    </div>
  );
}
