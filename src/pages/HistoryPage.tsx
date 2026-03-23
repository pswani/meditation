import { useTimer } from '../features/timer/useTimer';
import { formatDurationLabel } from '../utils/sessionLog';

export default function HistoryPage() {
  const { recentLogs } = useTimer();

  return (
    <section className="page-card history-screen">
      <h2 className="page-title">History</h2>
      <p className="page-description">Recent session log entries from auto log creation are shown below.</p>

      {recentLogs.length === 0 ? (
        <div className="empty-state">
          <p>No session log entries yet.</p>
          <p>Start a timer session to generate your first auto log.</p>
        </div>
      ) : (
        <ul className="history-list">
          {recentLogs.map((entry) => (
            <li key={entry.id} className="history-item">
              <div className="history-row">
                <strong>{entry.meditationType}</strong>
                <span className={`pill ${entry.status === 'completed' ? 'ok' : 'warn'}`}>{entry.status}</span>
              </div>
              <div className="history-meta">
                <span>Completed: {formatDurationLabel(entry.completedDurationSeconds)}</span>
                <span>Planned: {formatDurationLabel(entry.intendedDurationSeconds)}</span>
                <span>Source: {entry.source}</span>
                <span>{new Date(entry.endedAt).toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
