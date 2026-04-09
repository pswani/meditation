import { ObservanceTracker } from './ObservanceTracker';
import type { SankalpaGoal, SankalpaProgress } from '../../types/sankalpa';
import { describeSankalpa, filterDetail, progressDetail, remainingDetail } from './sankalpaPageHelpers';

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
  readonly onUpdateObservanceStatus?: (goal: SankalpaGoal, date: string, status: 'pending' | 'observed' | 'missed') => void;
}

export function SankalpaSection({
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
  onUpdateObservanceStatus,
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
              {progress.goal.goalType === 'observance-based' ? (
                <ObservanceTracker
                  progress={progress}
                  readOnly={progress.status === 'archived'}
                  onChangeStatus={
                    onUpdateObservanceStatus
                      ? (date, status) => {
                          onUpdateObservanceStatus(progress.goal, date, status);
                        }
                      : undefined
                  }
                />
              ) : null}
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
