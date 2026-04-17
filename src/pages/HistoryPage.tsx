import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { meditationTypes } from '../features/timer/constants';
import { useTimer } from '../features/timer/useTimer';
import type { SessionLog } from '../types/sessionLog';
import type { ManualLogInput, ManualLogValidationResult } from '../utils/manualLog';
import { formatDurationLabel, formatPlannedDurationLabel } from '../utils/sessionLog';

const historyTimeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const historyDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function getDefaultTimestamp(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const initialManualLog: ManualLogInput = {
  timerMode: 'fixed',
  durationMinutes: 20,
  meditationType: '',
  sessionTimestamp: getDefaultTimestamp(),
};

function getPlaylistRunClusterKey(entry: SessionLog): string | null {
  if (!entry.playlistName) {
    return null;
  }

  if (entry.playlistRunId) {
    return entry.playlistRunId;
  }

  if (entry.playlistRunStartedAt) {
    return `${entry.playlistName}-${entry.playlistRunStartedAt}`;
  }

  return `${entry.playlistName}-${entry.startedAt}`;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getSessionTimeRangeLabels(entry: Pick<SessionLog, 'startedAt' | 'endedAt'>): {
  readonly startLabel: string;
  readonly endLabel: string;
} {
  const startedAt = new Date(entry.startedAt);
  const endedAt = new Date(entry.endedAt);

  if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
    return {
      startLabel: entry.startedAt,
      endLabel: entry.endedAt,
    };
  }

  if (isSameLocalDay(startedAt, endedAt)) {
    return {
      startLabel: historyDateTimeFormatter.format(startedAt),
      endLabel: historyTimeFormatter.format(endedAt),
    };
  }

  return {
    startLabel: historyDateTimeFormatter.format(startedAt),
    endLabel: historyDateTimeFormatter.format(endedAt),
  };
}

export default function HistoryPage() {
  const {
    sessionLogs,
    addManualLog,
    canChangeSessionLogMeditationType,
    updateSessionLogMeditationType,
    isSessionLogsLoading,
    isSessionLogSyncing,
    sessionLogSyncError,
  } = useTimer();
  const navigate = useNavigate();
  const [manualLog, setManualLog] = useState<ManualLogInput>(initialManualLog);
  const [manualLogOpen, setManualLogOpen] = useState(() => sessionLogs.length === 0);
  const [errors, setErrors] = useState<ManualLogValidationResult['errors']>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [historyFeedbackMessage, setHistoryFeedbackMessage] = useState<string | null>(null);
  const [editingMeditationTypeLogId, setEditingMeditationTypeLogId] = useState<string | null>(null);
  const [editedMeditationType, setEditedMeditationType] = useState<SessionLog['meditationType']>('Vipassana');
  const [isSavingManualLog, setIsSavingManualLog] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | SessionLog['source']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | SessionLog['status']>('all');
  const [visibleCount, setVisibleCount] = useState(20);
  const manualDurationMessageId = errors.durationMinutes ? 'manual-log-duration-error' : 'manual-log-duration-hint';
  const manualMeditationTypeMessageId = errors.meditationType
    ? 'manual-log-meditation-type-error'
    : 'manual-log-meditation-type-hint';
  const manualTimestampMessageId = errors.sessionTimestamp ? 'manual-log-timestamp-error' : 'manual-log-timestamp-hint';
  const isOpenEndedManualLog = manualLog.timerMode === 'open-ended';

  const filteredLogs = useMemo(
    () =>
      sessionLogs.filter((entry) => {
        const sourceMatches = sourceFilter === 'all' || entry.source === sourceFilter;
        const statusMatches = statusFilter === 'all' || entry.status === statusFilter;
        return sourceMatches && statusMatches;
      }),
    [sessionLogs, sourceFilter, statusFilter]
  );

  const visibleLogs = useMemo(() => filteredLogs.slice(0, visibleCount), [filteredLogs, visibleCount]);
  const canShowMore = filteredLogs.length > visibleLogs.length;

  useEffect(() => {
    setVisibleCount(20);
  }, [sourceFilter, statusFilter]);

  async function submitManualLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingManualLog(true);
    const result = await addManualLog(manualLog);
    setErrors(result.errors);
    setIsSavingManualLog(false);

    if (result.isValid && result.persisted) {
      setManualLog({
        ...initialManualLog,
        sessionTimestamp: getDefaultTimestamp(),
      });
      setManualLogOpen(true);
      setSaveSuccessMessage('Manual log saved to history.');
      setSaveErrorMessage(null);
    } else {
      setSaveSuccessMessage(null);
      setManualLogOpen(true);
      setSaveErrorMessage(result.persistenceError ?? null);
    }
  }

  function startMeditationTypeEdit(entry: SessionLog) {
    setHistoryFeedbackMessage(null);
    setEditingMeditationTypeLogId(entry.id);
    setEditedMeditationType(entry.meditationType);
  }

  function cancelMeditationTypeEdit() {
    setEditingMeditationTypeLogId(null);
    setHistoryFeedbackMessage(null);
  }

  function saveMeditationTypeEdit(entry: SessionLog) {
    const result = updateSessionLogMeditationType(entry, editedMeditationType);
    setHistoryFeedbackMessage(result.feedbackMessage);
    if (result.updated) {
      setEditingMeditationTypeLogId(null);
    }
  }

  return (
    <section className="page-card history-screen">
      <h2 className="page-title">History</h2>
      <p className="page-description">
        View recent session log entries and add manual log entries for off-app practice. Only manual logs can change
        meditation type later; auto-created history stays read-only.
      </p>

      {historyFeedbackMessage ? (
        <div className="status-banner" role="status">
          <p>{historyFeedbackMessage}</p>
        </div>
      ) : null}

      <section className="history-log-panel">
        <h3 className="section-title">Recent Session Logs</h3>
        <p className="section-subtitle">
          Showing {visibleLogs.length} of {filteredLogs.length} filtered entries ({sessionLogs.length} stored).
        </p>

        {isSessionLogsLoading ? (
          <div className="status-banner" role="status">
            <p>Loading session log history from the backend.</p>
          </div>
        ) : null}

        {isSessionLogSyncing ? (
          <div className="status-banner" role="status">
            <p>Syncing recent session logs to the backend.</p>
          </div>
        ) : null}

        {sessionLogSyncError ? (
          <div className="status-banner warn" role="status">
            <p>{sessionLogSyncError}</p>
          </div>
        ) : null}

        <div className="form-grid history-filters" role="group" aria-label="Filter session logs">
          <label>
            <span>Source filter</span>
            <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}>
              <option value="all">All sources</option>
              <option value="auto log">Auto log only</option>
              <option value="manual log">Manual log only</option>
            </select>
          </label>

          <label>
            <span>Status filter</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">All statuses</option>
              <option value="completed">Completed only</option>
              <option value="ended early">Ended early only</option>
            </select>
          </label>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="empty-state">
            {sessionLogs.length === 0 ? (
              <>
                <p>No session log entries yet.</p>
                <p>Start a timer session or save a manual log entry.</p>
                <button type="button" className="link-button" onClick={() => navigate('/practice')}>
                  Start Session
                </button>
              </>
            ) : (
              <>
                <p>No session log entries match the selected filters.</p>
                <p>Adjust filters to view more entries.</p>
              </>
            )}
          </div>
        ) : (
          <ul className="history-list">
            {visibleLogs.map((entry, index) => {
              const runClusterKey = getPlaylistRunClusterKey(entry);
              const previousRunClusterKey = index > 0 ? getPlaylistRunClusterKey(visibleLogs[index - 1]) : null;
              const showRunContext = Boolean(runClusterKey) && runClusterKey !== previousRunClusterKey;
              const runStartedAt = entry.playlistRunStartedAt ?? entry.startedAt;
              const sessionTimeRange = getSessionTimeRangeLabels(entry);
              const canEditMeditationType = canChangeSessionLogMeditationType(entry);
              const isEditingMeditationType = editingMeditationTypeLogId === entry.id;

              return (
                <li key={entry.id} className="history-item">
                  {showRunContext ? (
                    <p className="history-run-context">
                      Playlist run started at {new Date(runStartedAt).toLocaleString()}
                    </p>
                  ) : null}
                  <div className="history-item-main">
                    <strong>{entry.meditationType}</strong>
                    <p className="history-time">
                      <time dateTime={entry.startedAt}>{sessionTimeRange.startLabel}</time>
                      <span className="history-time-separator">to</span>
                      <time dateTime={entry.endedAt}>{sessionTimeRange.endLabel}</time>
                    </p>
                    {entry.playlistName ? (
                      <p className="section-subtitle">
                        Playlist: {entry.playlistName} · item {entry.playlistItemPosition}/{entry.playlistItemCount}
                      </p>
                    ) : null}
                    {entry.customPlayName ? (
                      <p className="section-subtitle">
                        Custom play: {entry.customPlayName}
                        {entry.customPlayRecordingLabel ? ` · ${entry.customPlayRecordingLabel}` : ''}
                      </p>
                    ) : null}

                    <div className="history-meta">
                      <span>Completed: {formatDurationLabel(entry.completedDurationSeconds)}</span>
                      <span>Planned: {formatPlannedDurationLabel(entry)}</span>
                    </div>

                    {canEditMeditationType ? (
                      isEditingMeditationType ? (
                        <div className="history-edit-panel">
                          <label>
                            <span>Meditation type</span>
                            <select
                              value={editedMeditationType}
                              onChange={(event) => setEditedMeditationType(event.target.value as SessionLog['meditationType'])}
                            >
                              {meditationTypes.map((meditationType) => (
                                <option key={meditationType} value={meditationType}>
                                  {meditationType}
                                </option>
                              ))}
                            </select>
                          </label>
                          <p className="hint-text">Only this manual log changes here. Duration and session time stay unchanged.</p>
                          <div className="timer-actions">
                            <button
                              type="button"
                              onClick={() => saveMeditationTypeEdit(entry)}
                              disabled={editedMeditationType === entry.meditationType}
                            >
                              Save Meditation Type
                            </button>
                            <button type="button" className="secondary" onClick={cancelMeditationTypeEdit}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="history-edit-panel">
                          <button type="button" className="secondary" onClick={() => startMeditationTypeEdit(entry)}>
                            Change Meditation Type
                          </button>
                        </div>
                      )
                    ) : null}
                  </div>

                  <div className="history-item-side">
                    <div className="badge-row">
                      <span className={`pill ${entry.status === 'completed' ? 'ok' : 'warn'}`}>{entry.status}</span>
                      <span className={`pill source ${entry.source === 'manual log' ? 'manual' : 'auto'}`}>{entry.source}</span>
                      {entry.timerMode === 'open-ended' ? <span className="pill mode">open-ended</span> : null}
                      {entry.customPlayName ? <span className="pill playlist">custom play</span> : null}
                      {entry.playlistName ? <span className="pill playlist">playlist</span> : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {canShowMore ? (
          <div className="timer-actions">
            <button type="button" className="secondary" onClick={() => setVisibleCount((current) => current + 20)}>
              Show More Session Logs
            </button>
          </div>
        ) : null}
      </section>

      <section className="manual-log-panel">
        <details className="manual-log-disclosure" open={manualLogOpen} onToggle={(event) => setManualLogOpen(event.currentTarget.open)}>
          <summary>Add Manual Log</summary>
          <div className="manual-log-disclosure-body">
            {saveSuccessMessage ? (
              <div className="status-banner ok" role="status">
                <p>{saveSuccessMessage}</p>
              </div>
            ) : null}
            {saveErrorMessage ? (
              <div className="status-banner warn" role="status">
                <p>{saveErrorMessage}</p>
              </div>
            ) : null}
            <form className="form-grid" onSubmit={submitManualLog}>
              <section className="timer-mode-panel" aria-label="Manual log mode">
                <label className={`timer-mode-option ${manualLog.timerMode === 'fixed' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="manual-log-mode"
                    checked={manualLog.timerMode === 'fixed'}
                    onChange={() => {
                      setSaveSuccessMessage(null);
                      setSaveErrorMessage(null);
                      setManualLog((current) => ({
                        ...current,
                        timerMode: 'fixed',
                      }));
                    }}
                  />
                  <span className="timer-mode-copy">
                    <strong>Fixed Duration</strong>
                    <small>Save this as a session that had a planned end time.</small>
                  </span>
                </label>

                <label className={`timer-mode-option ${manualLog.timerMode === 'open-ended' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="manual-log-mode"
                    checked={manualLog.timerMode === 'open-ended'}
                    onChange={() => {
                      setSaveSuccessMessage(null);
                      setSaveErrorMessage(null);
                      setManualLog((current) => ({
                        ...current,
                        timerMode: 'open-ended',
                      }));
                    }}
                  />
                  <span className="timer-mode-copy">
                    <strong>Open-Ended</strong>
                    <small>Save this as a session that ended when you chose to stop, without a planned finish time.</small>
                  </span>
                </label>
              </section>

              <label>
                <span>Duration (minutes)</span>
                <input
                  type="number"
                  min={1}
                  value={manualLog.durationMinutes}
                  aria-invalid={Boolean(errors.durationMinutes)}
                  aria-describedby={manualDurationMessageId}
                  onChange={(event) => {
                    setSaveSuccessMessage(null);
                    setSaveErrorMessage(null);
                    setManualLog((current) => ({
                      ...current,
                      durationMinutes: Number(event.target.value),
                    }));
                  }}
                />
                {errors.durationMinutes ? (
                  <small id={manualDurationMessageId} className="error-text">
                    {errors.durationMinutes}
                  </small>
                ) : (
                  <small id={manualDurationMessageId} className="hint-text">
                    {isOpenEndedManualLog
                      ? 'Enter the completed duration. History will show this entry as open-ended.'
                      : 'Enter the full session duration in minutes.'}
                  </small>
                )}
              </label>

              <label>
                <span>Meditation type</span>
                <select
                  value={manualLog.meditationType}
                  aria-invalid={Boolean(errors.meditationType)}
                  aria-describedby={manualMeditationTypeMessageId}
                  onChange={(event) => {
                    setSaveSuccessMessage(null);
                    setSaveErrorMessage(null);
                    setManualLog((current) => ({
                      ...current,
                      meditationType: event.target.value as ManualLogInput['meditationType'],
                    }));
                  }}
                >
                  <option value="">Select meditation type</option>
                  {meditationTypes.map((meditationType) => (
                    <option key={meditationType} value={meditationType}>
                      {meditationType}
                    </option>
                  ))}
                </select>
                {errors.meditationType ? (
                  <small id={manualMeditationTypeMessageId} className="error-text">
                    {errors.meditationType}
                  </small>
                ) : (
                  <small id={manualMeditationTypeMessageId} className="hint-text">
                    Choose the meditation type you practiced.
                  </small>
                )}
              </label>

              <label>
                <span>Session timestamp</span>
                <input
                  type="datetime-local"
                  value={manualLog.sessionTimestamp}
                  aria-invalid={Boolean(errors.sessionTimestamp)}
                  aria-describedby={manualTimestampMessageId}
                  onChange={(event) => {
                    setSaveSuccessMessage(null);
                    setSaveErrorMessage(null);
                    setManualLog((current) => ({
                      ...current,
                      sessionTimestamp: event.target.value,
                    }));
                  }}
                />
                {errors.sessionTimestamp ? (
                  <small id={manualTimestampMessageId} className="error-text">
                    {errors.sessionTimestamp}
                  </small>
                ) : (
                  <small id={manualTimestampMessageId} className="hint-text">
                    {isOpenEndedManualLog
                      ? 'Use your local date and time when the open-ended session ended.'
                      : 'Use your local date and time when the session ended.'}
                  </small>
                )}
              </label>

              {isOpenEndedManualLog ? (
                <div className="mode-hint-card">
                  <strong>Open-ended manual log</strong>
                  <p className="section-subtitle">
                    The saved history entry will show the completed duration, an open-ended badge, and `Planned: Open-ended`.
                  </p>
                </div>
              ) : null}

              <div className="timer-actions">
                <button type="submit" disabled={isSavingManualLog}>
                  {isSavingManualLog ? 'Saving Manual Log...' : 'Save Manual Log'}
                </button>
              </div>
            </form>
          </div>
        </details>
      </section>
    </section>
  );
}
