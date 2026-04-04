import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useSyncStatus } from '../features/sync/useSyncStatus';
import { useSankalpaProgress } from '../features/sankalpa/useSankalpaProgress';
import { meditationTypes } from '../features/timer/constants';
import { useTimer } from '../features/timer/useTimer';
import type { SankalpaGoal, SankalpaProgress, SankalpaValidationResult } from '../types/sankalpa';
import { isApiClientError } from '../utils/apiClient';
import { formatDurationLabel } from '../utils/sessionLog';
import {
  deriveDateInputForDayOffset,
  deriveDateRangeFromInputs,
  deriveSummarySnapshot,
  type SummarySnapshotData,
  type SummaryDateRange,
} from '../utils/summary';
import { loadSummaryFromApi } from '../utils/summaryApi';
import {
  archiveSankalpaGoal,
  createInitialSankalpaDraft,
  createSankalpaDraftFromGoal,
  createSankalpaGoal,
  getSankalpaGoalTypeLabel,
  partitionSankalpaProgress,
  timeOfDayBuckets,
  timeOfDayBucketLabels,
  unarchiveSankalpaGoal,
  updateSankalpaGoal,
  validateSankalpaDraft,
} from '../utils/sankalpa';
import { getUserTimeZone } from '../utils/timeZone';

const initialErrors: SankalpaValidationResult['errors'] = {};
type SummaryRangePreset = 'all-time' | 'last-7-days' | 'last-30-days' | 'custom';
type SaveMessageTone = 'ok' | 'warn' | 'error';
type SankalpaSaveAction = 'create' | 'edit' | 'archive' | 'unarchive' | 'delete';

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

function formatSummaryLoadMessage(error: unknown): string {
  if (isApiClientError(error)) {
    if (error.kind === 'network') {
      return 'Showing a locally derived summary because the backend summary service could not be reached.';
    }

    if (error.detail && error.detail.trim().length > 0) {
      return `Showing a locally derived summary because the backend summary service returned: ${error.detail.trim()}`;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return `Showing a locally derived summary because the backend summary service returned: ${error.message.trim()}`;
  }

  return 'Showing a locally derived summary because the backend summary service is unavailable right now.';
}

function formatOfflineSummaryMessage(): string {
  return 'Showing a locally derived summary while you are offline.';
}

interface SankalpaSectionProps {
  readonly title: string;
  readonly emptyText: string;
  readonly items: SankalpaProgress[];
  readonly pendingArchiveGoalId: string | null;
  readonly pendingDeleteGoalId: string | null;
  readonly onEditGoal?: (goal: SankalpaGoal) => void;
  readonly onStartArchive?: (goalId: string) => void;
  readonly onCancelArchive?: () => void;
  readonly onConfirmArchive?: (goal: SankalpaGoal) => void;
  readonly onUnarchiveGoal?: (goal: SankalpaGoal) => void;
  readonly onStartDelete?: (goalId: string) => void;
  readonly onCancelDelete?: () => void;
  readonly onConfirmDelete?: (goal: SankalpaGoal) => void;
}

function SankalpaSection({
  title,
  emptyText,
  items,
  pendingArchiveGoalId,
  pendingDeleteGoalId,
  onEditGoal,
  onStartArchive,
  onCancelArchive,
  onConfirmArchive,
  onUnarchiveGoal,
  onStartDelete,
  onCancelDelete,
  onConfirmDelete,
}: SankalpaSectionProps) {
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
              {onEditGoal || onStartArchive || onUnarchiveGoal || onStartDelete ? (
                <div className="timer-actions">
                  {onEditGoal ? (
                    <button type="button" className="secondary" onClick={() => onEditGoal(progress.goal)}>
                      Edit
                    </button>
                  ) : null}
                  {onStartArchive ? (
                    <button type="button" className="secondary" onClick={() => onStartArchive(progress.goal.id)}>
                      Archive
                    </button>
                  ) : null}
                  {onUnarchiveGoal ? (
                    <button type="button" className="secondary" onClick={() => onUnarchiveGoal(progress.goal)}>
                      Unarchive
                    </button>
                  ) : null}
                  {onStartDelete ? (
                    <button type="button" className="secondary" onClick={() => onStartDelete(progress.goal.id)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              ) : null}
              {pendingArchiveGoalId === progress.goal.id && onCancelArchive && onConfirmArchive ? (
                <div className="confirm-sheet" role="dialog" aria-label={`Archive ${title} confirmation`}>
                  <p>Archive this sankalpa and move it out of the active goal lists?</p>
                  <div className="timer-actions">
                    <button type="button" className="secondary" onClick={onCancelArchive}>
                      Keep Goal
                    </button>
                    <button type="button" onClick={() => onConfirmArchive(progress.goal)}>
                      Archive Sankalpa
                    </button>
                  </div>
                </div>
              ) : null}
              {pendingDeleteGoalId === progress.goal.id && onCancelDelete && onConfirmDelete ? (
                <div className="confirm-sheet" role="dialog" aria-label={`Delete ${title} confirmation`}>
                  <p>Delete this archived sankalpa permanently? This cannot be undone.</p>
                  <div className="timer-actions">
                    <button type="button" className="secondary" onClick={onCancelDelete}>
                      Keep Archived Goal
                    </button>
                    <button type="button" onClick={() => onConfirmDelete(progress.goal)}>
                      Delete Sankalpa
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function buildSankalpaSaveMessage(action: SankalpaSaveAction, tone: SaveMessageTone): string {
  if (tone === 'warn') {
    if (action === 'create') {
      return 'Sankalpa created locally because the backend could not be reached.';
    }
    if (action === 'edit') {
      return 'Sankalpa changes saved locally because the backend could not be reached.';
    }
    if (action === 'archive') {
      return 'Sankalpa archived locally because the backend could not be reached.';
    }
    if (action === 'unarchive') {
      return 'Sankalpa restored locally because the backend could not be reached.';
    }
    return 'Sankalpa deleted locally because the backend could not be reached.';
  }

  if (action === 'create') {
    return 'Sankalpa created.';
  }
  if (action === 'edit') {
    return 'Sankalpa updated.';
  }
  if (action === 'archive') {
    return 'Sankalpa archived.';
  }
  if (action === 'unarchive') {
    return 'Sankalpa restored.';
  }
  return 'Sankalpa deleted.';
}

export default function SankalpaPage() {
  const { sessionLogs } = useTimer();
  const { isOnline } = useSyncStatus();
  const userTimeZone = useMemo(() => getUserTimeZone(), []);
  const summaryDateDefaults = useMemo(() => {
    const today = new Date();
    return {
      todayDateInput: deriveDateInputForDayOffset(today, 0),
      last7StartInput: deriveDateInputForDayOffset(today, -6),
      last30StartInput: deriveDateInputForDayOffset(today, -29),
    };
  }, []);
  const [draft, setDraft] = useState(() => createInitialSankalpaDraft());
  const [errors, setErrors] = useState<SankalpaValidationResult['errors']>(initialErrors);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveMessageTone, setSaveMessageTone] = useState<SaveMessageTone>('ok');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [pendingArchiveGoalId, setPendingArchiveGoalId] = useState<string | null>(null);
  const [pendingDeleteGoalId, setPendingDeleteGoalId] = useState<string | null>(null);
  const [summaryRangePreset, setSummaryRangePreset] = useState<SummaryRangePreset>('all-time');
  const [customStartDate, setCustomStartDate] = useState(summaryDateDefaults.last7StartInput);
  const [customEndDate, setCustomEndDate] = useState(summaryDateDefaults.todayDateInput);
  const [showInactiveSummaryCategories, setShowInactiveSummaryCategories] = useState(false);
  const [remoteSummarySnapshot, setRemoteSummarySnapshot] = useState<SummarySnapshotData | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryLoadMessage, setSummaryLoadMessage] = useState<string | null>(null);
  const {
    progressEntries: sankalpaProgressEntries,
    isLoading: isSankalpaLoading,
    syncMessage: sankalpaSyncMessage,
    saveSankalpa,
    deleteSankalpa,
  } =
    useSankalpaProgress(sessionLogs);

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
      const range =
        deriveDateRangeFromInputs(summaryDateDefaults.last7StartInput, summaryDateDefaults.todayDateInput) ?? {
          startAtMs: null,
          endAtMs: null,
        };
      return {
        range,
        error: null as string | null,
        label: describeSummaryRangeLabel(summaryRangePreset, range, customStartDate, customEndDate),
      };
    }

    if (summaryRangePreset === 'last-30-days') {
      const range =
        deriveDateRangeFromInputs(summaryDateDefaults.last30StartInput, summaryDateDefaults.todayDateInput) ?? {
          startAtMs: null,
          endAtMs: null,
        };
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
  }, [customEndDate, customStartDate, summaryDateDefaults, summaryRangePreset]);

  const summarySnapshot = useMemo(() => {
    if (!summaryRangeSelection.range) {
      return null;
    }

    return deriveSummarySnapshot(sessionLogs, summaryRangeSelection.range);
  }, [sessionLogs, summaryRangeSelection.range]);
  const effectiveSummarySnapshot = remoteSummarySnapshot ?? summarySnapshot;

  useEffect(() => {
    if (!summaryRangeSelection.range) {
      setRemoteSummarySnapshot(null);
      setIsSummaryLoading(false);
      setSummaryLoadMessage(null);
      return;
    }

    if (!isOnline) {
      setRemoteSummarySnapshot(null);
      setIsSummaryLoading(false);
      setSummaryLoadMessage(formatOfflineSummaryMessage());
      return;
    }

    const controller = new AbortController();
    setIsSummaryLoading(true);
    setSummaryLoadMessage(null);

    loadSummaryFromApi(
      {
        startAt:
          summaryRangeSelection.range.startAtMs === null ? undefined : new Date(summaryRangeSelection.range.startAtMs).toISOString(),
        endAt: summaryRangeSelection.range.endAtMs === null ? undefined : new Date(summaryRangeSelection.range.endAtMs).toISOString(),
        timeZone: userTimeZone,
      },
      undefined,
      controller.signal
    )
      .then((nextSummarySnapshot) => {
        setRemoteSummarySnapshot(nextSummarySnapshot);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setRemoteSummarySnapshot(null);
        setSummaryLoadMessage(formatSummaryLoadMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSummaryLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [isOnline, sessionLogs, summaryRangeSelection.range, userTimeZone]);

  const inactiveSummaryCategoriesCount = useMemo(() => {
    if (!effectiveSummarySnapshot) {
      return 0;
    }

    const byTypeInactiveCount = effectiveSummarySnapshot.byTypeSummary.filter((entry) => entry.sessionLogs === 0).length;
    const byTimeOfDayInactiveCount = effectiveSummarySnapshot.byTimeOfDaySummary.filter((entry) => entry.sessionLogs === 0).length;
    return byTypeInactiveCount + byTimeOfDayInactiveCount;
  }, [effectiveSummarySnapshot]);
  const byTypeSummaryRows = useMemo(() => {
    if (!effectiveSummarySnapshot) {
      return [];
    }

    if (showInactiveSummaryCategories) {
      return effectiveSummarySnapshot.byTypeSummary;
    }

    return effectiveSummarySnapshot.byTypeSummary.filter((entry) => entry.sessionLogs > 0);
  }, [effectiveSummarySnapshot, showInactiveSummaryCategories]);
  const byTimeOfDaySummaryRows = useMemo(() => {
    if (!effectiveSummarySnapshot) {
      return [];
    }

    if (showInactiveSummaryCategories) {
      return effectiveSummarySnapshot.byTimeOfDaySummary;
    }

    return effectiveSummarySnapshot.byTimeOfDaySummary.filter((entry) => entry.sessionLogs > 0);
  }, [effectiveSummarySnapshot, showInactiveSummaryCategories]);
  const progressByStatus = useMemo(() => {
    return partitionSankalpaProgress(sankalpaProgressEntries);
  }, [sankalpaProgressEntries]);

  function resetDraftState() {
    setDraft(createInitialSankalpaDraft());
    setErrors(initialErrors);
    setEditingGoalId(null);
  }

  function beginEdit(goal: SankalpaGoal) {
    setDraft(createSankalpaDraftFromGoal(goal));
    setErrors(initialErrors);
    setSaveMessage(null);
    setEditingGoalId(goal.id);
    setPendingArchiveGoalId(null);
    setPendingDeleteGoalId(null);
  }

  function cancelEdit() {
    resetDraftState();
    setSaveMessage(null);
  }

  async function persistGoal(goal: SankalpaGoal, action: SankalpaSaveAction) {
    const result = await saveSankalpa(goal);
    resetDraftState();
    setPendingArchiveGoalId(null);
    setPendingDeleteGoalId(null);
    setSaveMessageTone(result.tone);
    setSaveMessage(buildSankalpaSaveMessage(action, result.tone));
  }

  async function removeGoal(goalId: string) {
    const result = await deleteSankalpa(goalId);
    resetDraftState();
    setPendingArchiveGoalId(null);
    setPendingDeleteGoalId(null);
    setSaveMessageTone(result.tone);
    setSaveMessage(buildSankalpaSaveMessage('delete', result.tone));
  }

  async function onSubmitSankalpa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateSankalpaDraft(draft);
    setErrors(validation.errors);

    if (!validation.isValid) {
      setSaveMessage(null);
      return;
    }

    const existingGoal = editingGoalId
      ? sankalpaProgressEntries.find((entry) => entry.goal.id === editingGoalId)?.goal ?? null
      : null;
    const nextGoal = existingGoal ? updateSankalpaGoal(existingGoal, draft) : createSankalpaGoal(draft, new Date());
    await persistGoal(nextGoal, existingGoal ? 'edit' : 'create');
  }

  async function confirmArchive(goal: SankalpaGoal) {
    if (editingGoalId === goal.id) {
      resetDraftState();
    }

    await persistGoal(archiveSankalpaGoal(goal), 'archive');
  }

  async function unarchiveGoal(goal: SankalpaGoal) {
    if (editingGoalId === goal.id) {
      resetDraftState();
    }

    await persistGoal(unarchiveSankalpaGoal(goal), 'unarchive');
  }

  async function confirmDelete(goal: SankalpaGoal) {
    if (editingGoalId === goal.id) {
      resetDraftState();
    }

    await removeGoal(goal.id);
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
                  setCustomStartDate(summaryDateDefaults.last7StartInput);
                  setCustomEndDate(summaryDateDefaults.todayDateInput);
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
        {isSummaryLoading ? <small className="hint-text">Refreshing summary from the backend.</small> : null}
        {summaryLoadMessage ? <small className="error-text">{summaryLoadMessage}</small> : null}

        {!hasAnySessionLogs ? (
          <div className="empty-state">
            <p>No session log entries yet.</p>
            <p>Start sessions in Practice or add a manual log in History to unlock summaries.</p>
          </div>
        ) : summaryRangeSelection.error || !effectiveSummarySnapshot ? (
          <div className="empty-state">
            <p>Fix custom range to view summary.</p>
            <p>Choose a start date on or before the end date.</p>
          </div>
        ) : effectiveSummarySnapshot.overallSummary.totalSessionLogs === 0 ? (
          <div className="empty-state">
            <p>No session log entries in this date range.</p>
            <p>Try a wider range to review your meditation summary.</p>
          </div>
        ) : (
          <>
            <div className="summary-grid">
              <article className="summary-card">
                <p className="summary-label">Total session logs</p>
                <p className="summary-value">{effectiveSummarySnapshot.overallSummary.totalSessionLogs}</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Total completed duration</p>
                <p className="summary-value">{formatDurationLabel(effectiveSummarySnapshot.overallSummary.totalDurationSeconds)}</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Average duration</p>
                <p className="summary-value">{formatDurationLabel(effectiveSummarySnapshot.overallSummary.averageDurationSeconds)}</p>
              </article>
              <article className="summary-card">
                <p className="summary-label">Completed vs ended early</p>
                <p className="summary-value summary-value-split">
                  <span>completed: {effectiveSummarySnapshot.overallSummary.completedSessionLogs}</span>
                  <span>ended early: {effectiveSummarySnapshot.overallSummary.endedEarlySessionLogs}</span>
                </p>
                <p className="section-subtitle">
                  auto log: {effectiveSummarySnapshot.overallSummary.autoLogs} · manual log: {effectiveSummarySnapshot.overallSummary.manualLogs}
                </p>
              </article>
            </div>

            {inactiveSummaryCategoriesCount > 0 ? (
              <div className="summary-visibility-controls">
                <label className="summary-inactive-toggle">
                  <input
                    type="checkbox"
                    checked={showInactiveSummaryCategories}
                    onChange={(event) => setShowInactiveSummaryCategories(event.target.checked)}
                  />
                  <span>Show inactive categories</span>
                </label>
                {!showInactiveSummaryCategories ? (
                  <p className="section-subtitle">{inactiveSummaryCategoriesCount} inactive categories hidden.</p>
                ) : null}
              </div>
            ) : null}

            <div className="summary-sections-grid">
              <div className="summary-by-type">
                <h4 className="section-title">By meditation type</h4>
                {byTypeSummaryRows.length === 0 ? (
                  <p className="section-subtitle">No active meditation type categories in this range.</p>
                ) : (
                  <ul className="summary-by-type-list">
                    {byTypeSummaryRows.map((entry) => (
                      <li key={entry.meditationType} className="summary-by-type-row">
                        <span>{entry.meditationType}</span>
                        <span>{entry.sessionLogs} session logs</span>
                        <span>{formatDurationLabel(entry.totalDurationSeconds)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="summary-by-type">
                <h4 className="section-title">By source</h4>
                <ul className="summary-by-type-list">
                  {effectiveSummarySnapshot.bySourceSummary.map((entry) => (
                    <li key={entry.source} className="summary-by-type-row summary-by-source-row">
                      <span>{entry.source}</span>
                      <span className="summary-metric-list">
                        <span className="summary-metric-pill">{entry.sessionLogs} session logs</span>
                        <span className="summary-metric-pill">completed: {entry.completedSessionLogs}</span>
                        <span className="summary-metric-pill">ended early: {entry.endedEarlySessionLogs}</span>
                      </span>
                      <span>{formatDurationLabel(entry.totalDurationSeconds)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="summary-by-type">
                <h4 className="section-title">By time of day</h4>
                {byTimeOfDaySummaryRows.length === 0 ? (
                  <p className="section-subtitle">No active time-of-day categories in this range.</p>
                ) : (
                  <ul className="summary-by-type-list">
                    {byTimeOfDaySummaryRows.map((entry) => (
                      <li key={entry.timeOfDayBucket} className="summary-by-type-row">
                        <span>{timeOfDayBucketLabels[entry.timeOfDayBucket]}</span>
                        <span>{entry.sessionLogs} session logs</span>
                        <span>{formatDurationLabel(entry.totalDurationSeconds)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="sankalpa-panel">
        <h3 className="section-title">{editingGoalId ? 'Edit Sankalpa' : 'Create Sankalpa'}</h3>
        <p className="section-subtitle">
          {editingGoalId
            ? 'Editing keeps this sankalpa in its existing goal window, so progress and deadline stay anchored to the original creation date.'
            : 'Counting rules: both '}
          {!editingGoalId ? (
            <>
              <code>auto log</code> and <code>manual log</code> entries count. Session-count sankalpa goals count matching session
              log entries. Duration-based goals sum matching completed duration, including ended-early entries. Matching also
              respects optional filters and the goal window from creation time through deadline.
            </>
          ) : null}
        </p>

        {saveMessage ? (
          <div className={`status-banner ${saveMessageTone === 'error' ? 'warn' : saveMessageTone}`} role="status">
            <p>{saveMessage}</p>
          </div>
        ) : null}
        {isSankalpaLoading ? <p className="section-subtitle">Refreshing sankalpa progress from the backend.</p> : null}
        {sankalpaSyncMessage ? <p className="section-subtitle">{sankalpaSyncMessage}</p> : null}

        <form className="form-grid" onSubmit={onSubmitSankalpa}>
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
              <option value="duration-based">{getSankalpaGoalTypeLabel('duration-based')}</option>
              <option value="session-count-based">{getSankalpaGoalTypeLabel('session-count-based')}</option>
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
            <button type="submit">{editingGoalId ? 'Save Changes' : 'Create Sankalpa'}</button>
            {editingGoalId ? (
              <button type="button" className="secondary" onClick={cancelEdit}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <SankalpaSection
        title="Active Sankalpas"
        emptyText="No active sankalpas. Create one above."
        items={progressByStatus.active}
        pendingArchiveGoalId={pendingArchiveGoalId}
        pendingDeleteGoalId={pendingDeleteGoalId}
        onEditGoal={beginEdit}
        onStartArchive={setPendingArchiveGoalId}
        onCancelArchive={() => setPendingArchiveGoalId(null)}
        onConfirmArchive={confirmArchive}
      />
      <SankalpaSection
        title="Completed Sankalpas"
        emptyText="Completed sankalpas will appear here."
        items={progressByStatus.completed}
        pendingArchiveGoalId={pendingArchiveGoalId}
        pendingDeleteGoalId={pendingDeleteGoalId}
        onEditGoal={beginEdit}
        onStartArchive={setPendingArchiveGoalId}
        onCancelArchive={() => setPendingArchiveGoalId(null)}
        onConfirmArchive={confirmArchive}
      />
      <SankalpaSection
        title="Expired Sankalpas"
        emptyText="Expired sankalpas will appear here if deadlines pass before completion."
        items={progressByStatus.expired}
        pendingArchiveGoalId={pendingArchiveGoalId}
        pendingDeleteGoalId={pendingDeleteGoalId}
        onEditGoal={beginEdit}
        onStartArchive={setPendingArchiveGoalId}
        onCancelArchive={() => setPendingArchiveGoalId(null)}
        onConfirmArchive={confirmArchive}
      />
      <SankalpaSection
        title="Archived Sankalpas"
        emptyText="Archived sankalpas will appear here."
        items={progressByStatus.archived}
        pendingArchiveGoalId={pendingArchiveGoalId}
        pendingDeleteGoalId={pendingDeleteGoalId}
        onUnarchiveGoal={unarchiveGoal}
        onStartDelete={(goalId) => {
          setPendingArchiveGoalId(null);
          setPendingDeleteGoalId(goalId);
        }}
        onCancelDelete={() => setPendingDeleteGoalId(null)}
        onConfirmDelete={confirmDelete}
      />
    </section>
  );
}
