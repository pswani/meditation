import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { meditationTypes } from '../features/timer/constants';
import { useTimer } from '../features/timer/useTimer';
import type { SankalpaGoal, SankalpaProgress, SankalpaValidationResult } from '../types/sankalpa';
import { formatDurationLabel } from '../utils/sessionLog';
import { deriveOverallSummary, deriveSummaryByType } from '../utils/summary';
import {
  createInitialSankalpaDraft,
  createSankalpaGoal,
  deriveSankalpaProgress,
  partitionSankalpaProgress,
  timeOfDayBuckets,
  timeOfDayBucketLabels,
  validateSankalpaDraft,
} from '../utils/sankalpa';
import { loadSankalpas, saveSankalpas } from '../utils/storage';

const initialErrors: SankalpaValidationResult['errors'] = {};

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
  const [draft, setDraft] = useState(() => createInitialSankalpaDraft());
  const [errors, setErrors] = useState<SankalpaValidationResult['errors']>(initialErrors);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [sankalpas, setSankalpas] = useState(() => loadSankalpas());

  useEffect(() => {
    saveSankalpas(sankalpas);
  }, [sankalpas]);

  const overallSummary = useMemo(() => deriveOverallSummary(sessionLogs), [sessionLogs]);
  const byTypeSummary = useMemo(() => deriveSummaryByType(sessionLogs), [sessionLogs]);
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

  return (
    <section className="page-card sankalpa-screen">
      <h2 className="page-title">Sankalpa</h2>
      <p className="page-description">
        Review summaries and track sankalpa progress with clear, bounded goals.
      </p>

      <section className="summary-panel">
        <h3 className="section-title">Summary</h3>
        {sessionLogs.length === 0 ? (
          <div className="empty-state">
            <p>No session log entries yet.</p>
            <p>Start sessions in Practice or add a manual log in History to unlock summaries.</p>
          </div>
        ) : (
          <>
            <div className="summary-grid">
              <article className="summary-card">
                <p className="summary-label">Total session logs</p>
                <p className="summary-value">{overallSummary.totalSessionLogs}</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Total completed duration</p>
                <p className="summary-value">{formatDurationLabel(overallSummary.totalDurationSeconds)}</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Average duration</p>
                <p className="summary-value">{formatDurationLabel(overallSummary.averageDurationSeconds)}</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Completed vs ended early</p>
                <p className="summary-value">
                  {overallSummary.completedSessionLogs} / {overallSummary.endedEarlySessionLogs}
                </p>
                <p className="section-subtitle">auto log: {overallSummary.autoLogs} · manual log: {overallSummary.manualLogs}</p>
              </article>
            </div>

            <div className="summary-by-type">
              <h4 className="section-title">By meditation type</h4>
              <ul className="summary-by-type-list">
                {byTypeSummary.map((entry) => (
                  <li key={entry.meditationType} className="summary-by-type-row">
                    <span>{entry.meditationType}</span>
                    <span>{entry.sessionLogs} session logs</span>
                    <span>{formatDurationLabel(entry.totalDurationSeconds)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      <section className="sankalpa-panel">
        <h3 className="section-title">Create Sankalpa</h3>
        <p className="section-subtitle">
          Counting rules: both <code>auto log</code> and <code>manual log</code> entries count. Session-count sankalpa goals count
          matching session log entries. Duration-based goals sum matching completed duration, including ended-early entries.
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
