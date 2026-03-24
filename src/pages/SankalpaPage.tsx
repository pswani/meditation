import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { meditationTypes } from '../features/timer/constants';
import { useTimer } from '../features/timer/useTimer';
import type { SankalpaGoal, SankalpaProgress, SankalpaValidationResult } from '../types/sankalpa';
import { formatDurationLabel } from '../utils/sessionLog';
import {
  deriveDateInputForDayOffset,
  deriveDateRangeFromInputs,
  deriveSummarySnapshot,
  type SummaryDateRange,
} from '../utils/summary';
import {
  createInitialSankalpaDraft,
  createSankalpaGoal,
  deriveSankalpaProgress,
  partitionSankalpaProgress,
  timeOfDayBuckets,
  timeOfDayBucketLabels,
  validateSankalpaDraft,
} from '../utils/sankalpa';
import { listSankalpasFromApi, persistSankalpasToApi } from '../utils/sankalpaApi';

const initialErrors: SankalpaValidationResult['errors'] = {};
type SummaryRangePreset = 'all-time' | 'last-7-days' | 'last-30-days' | 'custom';

function describeSankalpa(goal: SankalpaGoal): string {
  if (goal.goalType === 'duration-based') {
    return `${goal.targetValue} min in ${goal.days} day${goal.days === 1 ? '' : 's'}`;
  }

  return `${goal.targetValue} session log${goal.targetValue === 1 ? '' : 's'} in ${goal.days} day${
    goal.days === 1 ? '' : 's'
  }`;
}

function progressDetail(progress: SankalpaProgress): string {
  if (progress.goal.goalType === 'duration-based') {
    return `${formatDurationLabel(progress.matchedDurationSeconds)} / ${formatDurationLabel(progress.targetDurationSeconds)}`;
  }

  return `${progress.matchedSessionCount} / ${progress.targetSessionCount} session logs`;
}

function remainingDetail(progress: SankalpaProgress): string {
  if (progress.goal.goalType === 'duration-based') {
    const remainingSeconds = Math.max(0, progress.targetDurationSeconds - progress.matchedDurationSeconds);
    return `${formatDurationLabel(remainingSeconds)} remaining`;
  }

  const remainingSessions = Math.max(0, progress.targetSessionCount - progress.matchedSessionCount);
  return `${remainingSessions} session log${remainingSessions === 1 ? '' : 's'} remaining`;
}

function filterDetail(goal: SankalpaGoal): string {
  const filters: string[] = [];
  if (goal.meditationType) {
    filters.push(`meditation type: ${goal.meditationType}`);
  }
  if (goal.timeOfDayBucket) {
    filters.push(`time of day: ${timeOfDayBucketLabels[goal.timeOfDayBucket]}`);
  }

  return filters.length > 0 ? filters.join(' · ') : 'No filters';
}

function formatDateInputLabel(dateInput: string): string {
  const parsed = deriveDateRangeFromInputs(dateInput, dateInput);
  if (!parsed?.startAtMs) {
    return dateInput;
  }

  return new Date(parsed.startAtMs).toLocaleDateString();
}

function describeSummaryRangeLabel(
  preset: SummaryRangePreset,
  range: SummaryDateRange,
  customStartDate: string,
  customEndDate: string
): string {
  if (preset === 'all-time') {
    return 'All time';
  }

  if (preset === 'last-7-days') {
    return 'Last 7 days';
  }

  if (preset === 'last-30-days') {
    return 'Last 30 days';
  }

  if (range.startAtMs === null || range.endAtMs === null) {
    return 'Custom range';
  }

  return `${formatDateInputLabel(customStartDate)} - ${formatDateInputLabel(customEndDate)}`;
}

interface SankalpaSectionProps {
  readonly title: string;
  readonly emptyText: string;
  readonly items: SankalpaProgress[];
}

function SankalpaSection({ title, emptyText, items }: SankalpaSectionProps) {
  return (
    <section className="sankalpa-section">
      <h3 className="section-title">{title}</h3>
      {items.length === 0 ? (
        <div className="empty-state">
          <p>{emptyText}</p>
        </div>
      ) : (
        <ul className="sankalpa-list">
          {items.map((progress) => (
            <li key={progress.goal.id} className="sankalpa-item">
              <div className="history-row">
                <strong>{describeSankalpa(progress.goal)}</strong>
                <span className={`pill ${progress.status === 'completed' ? 'ok' : progress.status === 'expired' ? 'warn' : 'active'}`}>
                  {progress.status}
                </span>
              </div>
              <p className="section-subtitle">
                Created: {new Date(progress.goal.createdAt).toLocaleDateString()} · Deadline:{' '}
                {new Date(progress.deadlineAt).toLocaleDateString()}
              </p>
              <p className="section-subtitle">Filters: {filterDetail(progress.goal)}</p>
              <div className="sankalpa-progress-track" aria-hidden="true">
                <span className="sankalpa-progress-fill" style={{ width: `${Math.min(100, progress.progressRatio * 100)}%` }} />
              </div>
              <p className="section-subtitle">
                Progress: {progressDetail(progress)} · {remainingDetail(progress)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function SankalpaPage() {
  const { sessionLogs } = useTimer();
  const todayDateInput = deriveDateInputForDayOffset(new Date(), 0);
  const last7StartInput = deriveDateInputForDayOffset(new Date(), -6);
  const last30StartInput = deriveDateInputForDayOffset(new Date(), -29);
  const [draft, setDraft] = useState(() => createInitialSankalpaDraft());
  const [errors, setErrors] = useState<SankalpaValidationResult['errors']>(initialErrors);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [sankalpas, setSankalpas] = useState(() => listSankalpasFromApi());
  const [summaryRangePreset, setSummaryRangePreset] = useState<SummaryRangePreset>('all-time');
  const [customStartDate, setCustomStartDate] = useState(last7StartInput);
  const [customEndDate, setCustomEndDate] = useState(todayDateInput);

  useEffect(() => {
    persistSankalpasToApi(sankalpas);
  }, [sankalpas]);

  const summaryRangeSelection = useMemo(() => {
    if (summaryRangePreset === 'all-time') {
      const range = { startAtMs: null, endAtMs: null };
      return {
        range,
        error: null as string | null,
        label: describeSummaryRangeLabel(summaryRangePreset, range, customStartDate, customEndDate),
      };
    }

    if (summaryRangePreset === 'last-7-days') {
      const range = deriveDateRangeFromInputs(last7StartInput, todayDateInput) ?? { startAtMs: null, endAtMs: null };
      return {
        range,
        error: null as string | null,
        label: describeSummaryRangeLabel(summaryRangePreset, range, customStartDate, customEndDate),
      };
    }

    if (summaryRangePreset === 'last-30-days') {
      const range = deriveDateRangeFromInputs(last30StartInput, todayDateInput) ?? { startAtMs: null, endAtMs: null };
      return {
        range,
        error: null as string | null,
        label: describeSummaryRangeLabel(summaryRangePreset, range, customStartDate, customEndDate),
      };
    }

    if (!customStartDate || !customEndDate) {
      return {
        range: null,
        error: 'Select both start and end dates for a custom range.',
        label: 'Custom range',
      };
    }

    const range = deriveDateRangeFromInputs(customStartDate, customEndDate);
    if (!range) {
      return {
        range: null,
        error: 'Custom date range is invalid. Ensure start is on or before end.',
        label: 'Custom range',
      };
    }

    return {
      range,
      error: null as string | null,
      label: describeSummaryRangeLabel(summaryRangePreset, range, customStartDate, customEndDate),
    };
  }, [customEndDate, customStartDate, last30StartInput, last7StartInput, summaryRangePreset, todayDateInput]);

  const summarySnapshot = useMemo(() => {
    if (!summaryRangeSelection.range) {
      return null;
    }

    return deriveSummarySnapshot(sessionLogs, summaryRangeSelection.range);
  }, [sessionLogs, summaryRangeSelection.range]);
  const progressByStatus = useMemo(() => {
    const now = new Date();
    const entries = sankalpas
      .map((goal) => deriveSankalpaProgress(goal, sessionLogs, now))
      .sort((left, right) => Date.parse(right.goal.createdAt) - Date.parse(left.goal.createdAt));
    return partitionSankalpaProgress(entries);
  }, [sankalpas, sessionLogs]);

  function onCreateSankalpa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateSankalpaDraft(draft);
    setErrors(validation.errors);

    if (!validation.isValid) {
      setSaveMessage(null);
      return;
    }

    const nextGoal = createSankalpaGoal(draft, new Date());
    setSankalpas((current) => [nextGoal, ...current]);
    setDraft(createInitialSankalpaDraft());
    setErrors(initialErrors);
    setSaveMessage('Sankalpa saved.');
  }

  const hasAnySessionLogs = sessionLogs.length > 0;

  return (
    <section className="page-card sankalpa-screen">
      <h2 className="page-title">Sankalpa</h2>
      <p className="page-description">
        Review summaries and track sankalpa progress with clear, bounded goals.
      </p>

      <section className="summary-panel">
        <h3 className="section-title">Summary</h3>
        <p className="section-subtitle">Date range applies to session log end time.</p>

        <div className="form-grid summary-range-grid">
          <label>
            <span>Summary range</span>
            <select
              value={summaryRangePreset}
              onChange={(event) => {
                const nextPreset = event.target.value as SummaryRangePreset;
                setSummaryRangePreset(nextPreset);
                if (nextPreset === 'custom' && (!customStartDate || !customEndDate)) {
                  setCustomStartDate(last7StartInput);
                  setCustomEndDate(todayDateInput);
                }
              }}
            >
              <option value="all-time">All time</option>
              <option value="last-7-days">Last 7 days</option>
              <option value="last-30-days">Last 30 days</option>
              <option value="custom">Custom range</option>
            </select>
          </label>

          {summaryRangePreset === 'custom' ? (
            <>
              <label>
                <span>Start date</span>
                <input type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} />
              </label>

              <label>
                <span>End date</span>
                <input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} />
              </label>
            </>
          ) : null}
        </div>

        <p className="section-subtitle">Showing: {summaryRangeSelection.label}</p>
        {summaryRangeSelection.error ? <small className="error-text">{summaryRangeSelection.error}</small> : null}

        {!hasAnySessionLogs ? (
          <div className="empty-state">
            <p>No session log entries yet.</p>
            <p>Start sessions in Practice or add a manual log in History to unlock summaries.</p>
          </div>
        ) : summaryRangeSelection.error || !summarySnapshot ? (
          <div className="empty-state">
            <p>Fix custom range to view summary.</p>
            <p>Choose a start date on or before the end date.</p>
          </div>
        ) : summarySnapshot.sessionLogs.length === 0 ? (
          <div className="empty-state">
            <p>No session log entries in this date range.</p>
            <p>Try a wider range to review your meditation summary.</p>
          </div>
        ) : (
          <>
            <div className="summary-grid">
              <article className="summary-card">
                <p className="summary-label">Total session logs</p>
                <p className="summary-value">{summarySnapshot.overallSummary.totalSessionLogs}</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Total completed duration</p>
                <p className="summary-value">{formatDurationLabel(summarySnapshot.overallSummary.totalDurationSeconds)}</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Average duration</p>
                <p className="summary-value">{formatDurationLabel(summarySnapshot.overallSummary.averageDurationSeconds)}</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Completed vs ended early</p>
                <p className="summary-value">
                  {summarySnapshot.overallSummary.completedSessionLogs} / {summarySnapshot.overallSummary.endedEarlySessionLogs}
                </p>
                <p className="section-subtitle">
                  auto log: {summarySnapshot.overallSummary.autoLogs} · manual log: {summarySnapshot.overallSummary.manualLogs}
                </p>
              </article>
            </div>

            <div className="summary-sections-grid">
              <div className="summary-by-type">
                <h4 className="section-title">By meditation type</h4>
                <ul className="summary-by-type-list">
                  {summarySnapshot.byTypeSummary.map((entry) => (
                    <li key={entry.meditationType} className="summary-by-type-row">
                      <span>{entry.meditationType}</span>
                      <span>{entry.sessionLogs} session logs</span>
                      <span>{formatDurationLabel(entry.totalDurationSeconds)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="summary-by-type">
                <h4 className="section-title">By source</h4>
                <ul className="summary-by-type-list">
                  {summarySnapshot.bySourceSummary.map((entry) => (
                    <li key={entry.source} className="summary-by-type-row">
                      <span>{entry.source}</span>
                      <span className="summary-detail">
                        {entry.sessionLogs} session logs · completed: {entry.completedSessionLogs} · ended early:{' '}
                        {entry.endedEarlySessionLogs}
                      </span>
                      <span>{formatDurationLabel(entry.totalDurationSeconds)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="summary-by-type">
                <h4 className="section-title">By time of day</h4>
                <ul className="summary-by-type-list">
                  {summarySnapshot.byTimeOfDaySummary.map((entry) => (
                    <li key={entry.timeOfDayBucket} className="summary-by-type-row">
                      <span>{timeOfDayBucketLabels[entry.timeOfDayBucket]}</span>
                      <span>{entry.sessionLogs} session logs</span>
                      <span>{formatDurationLabel(entry.totalDurationSeconds)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="sankalpa-panel">
        <h3 className="section-title">Create Sankalpa</h3>
        <p className="section-subtitle">
          Counting rules: both <code>auto log</code> and <code>manual log</code> entries count. Session-count sankalpa goals count
          matching session log entries. Duration-based goals sum matching completed duration, including ended-early entries.
          Matching also respects optional filters and the goal window from creation time through deadline.
        </p>

        {saveMessage ? (
          <div className="status-banner ok" role="status">
            <p>{saveMessage}</p>
          </div>
        ) : null}

        <form className="form-grid" onSubmit={onCreateSankalpa}>
          <label>
            <span>Goal type</span>
            <select
              value={draft.goalType}
              onChange={(event) => {
                setSaveMessage(null);
                setDraft((current) => ({
                  ...current,
                  goalType: event.target.value as typeof current.goalType,
                }));
              }}
            >
              <option value="duration-based">duration-based</option>
              <option value="session-count-based">session-count-based</option>
            </select>
            {errors.goalType ? <small className="error-text">{errors.goalType}</small> : null}
          </label>

          <label>
            <span>{draft.goalType === 'duration-based' ? 'Target duration (minutes)' : 'Target session logs'}</span>
            <input
              type="number"
              min={1}
              step={draft.goalType === 'session-count-based' ? 1 : 0.5}
              value={draft.targetValue}
              onChange={(event) => {
                setSaveMessage(null);
                setDraft((current) => ({
                  ...current,
                  targetValue: Number(event.target.value),
                }));
              }}
            />
            {errors.targetValue ? <small className="error-text">{errors.targetValue}</small> : null}
          </label>

          <label>
            <span>Days</span>
            <input
              type="number"
              min={1}
              step={1}
              value={draft.days}
              onChange={(event) => {
                setSaveMessage(null);
                setDraft((current) => ({
                  ...current,
                  days: Number(event.target.value),
                }));
              }}
            />
            {errors.days ? <small className="error-text">{errors.days}</small> : null}
          </label>

          <label>
            <span>Meditation type filter (optional)</span>
            <select
              value={draft.meditationType}
              onChange={(event) => {
                setSaveMessage(null);
                setDraft((current) => ({
                  ...current,
                  meditationType: event.target.value as typeof current.meditationType,
                }));
              }}
            >
              <option value="">Any meditation type</option>
              {meditationTypes.map((meditationType) => (
                <option key={meditationType} value={meditationType}>
                  {meditationType}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Time-of-day filter (optional)</span>
            <select
              value={draft.timeOfDayBucket}
              onChange={(event) => {
                setSaveMessage(null);
                setDraft((current) => ({
                  ...current,
                  timeOfDayBucket: event.target.value as typeof current.timeOfDayBucket,
                }));
              }}
            >
              <option value="">Any time of day</option>
              {timeOfDayBuckets.map((bucket) => (
                <option key={bucket} value={bucket}>
                  {timeOfDayBucketLabels[bucket]}
                </option>
              ))}
            </select>
          </label>

          <div className="timer-actions">
            <button type="submit">Create Sankalpa</button>
          </div>
        </form>
      </section>

      <SankalpaSection title="Active Sankalpas" emptyText="No active sankalpas. Create one above." items={progressByStatus.active} />
      <SankalpaSection
        title="Completed Sankalpas"
        emptyText="Completed sankalpas will appear here."
        items={progressByStatus.completed}
      />
      <SankalpaSection
        title="Expired Sankalpas"
        emptyText="Expired sankalpas will appear here if deadlines pass before completion."
        items={progressByStatus.expired}
      />
    </section>
  );
}
