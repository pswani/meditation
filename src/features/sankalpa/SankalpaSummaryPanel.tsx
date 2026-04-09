import { formatDurationLabel } from '../../utils/sessionLog';
import { timeOfDayBucketLabels } from '../../utils/sankalpa';
import type { SummarySnapshotData } from '../../utils/summary';
import type { SummaryRangePreset } from './sankalpaPageHelpers';

interface SankalpaSummaryPanelProps {
  readonly summaryRangePreset: SummaryRangePreset;
  readonly setSummaryRangePreset: (preset: SummaryRangePreset) => void;
  readonly customStartDate: string;
  readonly setCustomStartDate: (value: string) => void;
  readonly customEndDate: string;
  readonly setCustomEndDate: (value: string) => void;
  readonly summaryDateDefaults: {
    readonly todayDateInput: string;
    readonly last7StartInput: string;
    readonly last30StartInput: string;
  };
  readonly summaryRangeSelection: {
    readonly label: string;
    readonly error: string | null;
  };
  readonly isSummaryLoading: boolean;
  readonly summaryLoadMessage: string | null;
  readonly hasAnySessionLogs: boolean;
  readonly effectiveSummarySnapshot: SummarySnapshotData | null;
  readonly inactiveSummaryCategoriesCount: number;
  readonly showInactiveSummaryCategories: boolean;
  readonly setShowInactiveSummaryCategories: (show: boolean) => void;
  readonly byTypeSummaryRows: SummarySnapshotData['byTypeSummary'];
  readonly byTimeOfDaySummaryRows: SummarySnapshotData['byTimeOfDaySummary'];
}

export function SankalpaSummaryPanel({
  summaryRangePreset,
  setSummaryRangePreset,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  summaryDateDefaults,
  summaryRangeSelection,
  isSummaryLoading,
  summaryLoadMessage,
  hasAnySessionLogs,
  effectiveSummarySnapshot,
  inactiveSummaryCategoriesCount,
  showInactiveSummaryCategories,
  setShowInactiveSummaryCategories,
  byTypeSummaryRows,
  byTimeOfDaySummaryRows,
}: SankalpaSummaryPanelProps) {
  return (
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
  );
}
