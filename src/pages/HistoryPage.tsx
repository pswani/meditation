import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { meditationTypes } from '../features/timer/constants';
import { useTimer } from '../features/timer/useTimer';
import type { SessionLog } from '../types/sessionLog';
import type { ManualLogInput, ManualLogValidationResult } from '../utils/manualLog';
import { formatDurationLabel } from '../utils/sessionLog';

function getDefaultTimestamp(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const initialManualLog: ManualLogInput = {
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

export default function HistoryPage() {
  const { recentLogs, addManualLog } = useTimer();
  const navigate = useNavigate();
  const [manualLog, setManualLog] = useState<ManualLogInput>(initialManualLog);
  const [manualLogOpen, setManualLogOpen] = useState(() => recentLogs.length === 0);
  const [errors, setErrors] = useState<ManualLogValidationResult['errors']>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  function submitManualLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = addManualLog(manualLog);
    setErrors(result.errors);

    if (result.isValid) {
      setManualLog({
        ...initialManualLog,
        sessionTimestamp: getDefaultTimestamp(),
      });
      setManualLogOpen(true);
      setSaveSuccessMessage('Manual log saved to history.');
    } else {
      setSaveSuccessMessage(null);
      setManualLogOpen(true);
    }
  }

  return (
    <section className="page-card history-screen">
      <h2 className="page-title">History</h2>
      <p className="page-description">View recent session log entries and add manual log entries for off-app practice.</p>

      <section className="history-log-panel">
        <h3 className="section-title">Recent Session Logs</h3>

        {recentLogs.length === 0 ? (
          <div className="empty-state">
            <p>No session log entries yet.</p>
            <p>Start a timer session or save a manual log entry.</p>
            <button type="button" className="link-button" onClick={() => navigate('/practice')}>
              Start Session
            </button>
          </div>
        ) : (
          <ul className="history-list">
            {recentLogs.map((entry, index) => {
              const runClusterKey = getPlaylistRunClusterKey(entry);
              const previousRunClusterKey = index > 0 ? getPlaylistRunClusterKey(recentLogs[index - 1]) : null;
              const showRunContext = Boolean(runClusterKey) && runClusterKey !== previousRunClusterKey;
              const runStartedAt = entry.playlistRunStartedAt ?? entry.startedAt;

              return (
                <li key={entry.id} className="history-item">
                  {showRunContext ? (
                    <p className="history-run-context">
                      Playlist run started at {new Date(runStartedAt).toLocaleString()}
                    </p>
                  ) : null}
                  <div className="history-item-main">
                    <strong>{entry.meditationType}</strong>
                    <p className="history-time">{new Date(entry.endedAt).toLocaleString()}</p>
                    {entry.playlistName ? (
                      <p className="section-subtitle">
                        Playlist: {entry.playlistName} · item {entry.playlistItemPosition}/{entry.playlistItemCount}
                      </p>
                    ) : null}

                    <div className="history-meta">
                      <span>Completed: {formatDurationLabel(entry.completedDurationSeconds)}</span>
                      <span>Planned: {formatDurationLabel(entry.intendedDurationSeconds)}</span>
                    </div>
                  </div>

                  <div className="history-item-side">
                    <div className="badge-row">
                      <span className={`pill ${entry.status === 'completed' ? 'ok' : 'warn'}`}>{entry.status}</span>
                      <span className={`pill source ${entry.source === 'manual log' ? 'manual' : 'auto'}`}>{entry.source}</span>
                      {entry.playlistName ? <span className="pill playlist">playlist</span> : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
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
            <form className="form-grid" onSubmit={submitManualLog}>
              <label>
                <span>Duration (minutes)</span>
                <input
                  type="number"
                  min={1}
                  value={manualLog.durationMinutes}
                  onChange={(event) => {
                    setSaveSuccessMessage(null);
                    setManualLog((current) => ({
                      ...current,
                      durationMinutes: Number(event.target.value),
                    }));
                  }}
                />
                {errors.durationMinutes ? <small className="error-text">{errors.durationMinutes}</small> : null}
              </label>

              <label>
                <span>Meditation type</span>
                <select
                  value={manualLog.meditationType}
                  onChange={(event) => {
                    setSaveSuccessMessage(null);
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
                {errors.meditationType ? <small className="error-text">{errors.meditationType}</small> : null}
              </label>

              <label>
                <span>Session timestamp</span>
                <input
                  type="datetime-local"
                  value={manualLog.sessionTimestamp}
                  onChange={(event) => {
                    setSaveSuccessMessage(null);
                    setManualLog((current) => ({
                      ...current,
                      sessionTimestamp: event.target.value,
                    }));
                  }}
                />
                {errors.sessionTimestamp ? (
                  <small className="error-text">{errors.sessionTimestamp}</small>
                ) : (
                  <small className="hint-text">Use your local date and time when the session ended.</small>
                )}
              </label>

              <div className="timer-actions">
                <button type="submit">Save Manual Log</button>
              </div>
            </form>
          </div>
        </details>
      </section>
    </section>
  );
}
