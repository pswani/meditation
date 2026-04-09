import type { FormEvent } from 'react';
import { meditationTypes } from '../timer/constants';
import type { SankalpaDraft, SankalpaValidationResult } from '../../types/sankalpa';
import { getSankalpaGoalTypeLabel, isObservanceGoalType, timeOfDayBuckets, timeOfDayBucketLabels } from '../../utils/sankalpa';

interface SankalpaEditorProps {
  readonly draft: SankalpaDraft;
  readonly errors: SankalpaValidationResult['errors'];
  readonly editingGoalId: string | null;
  readonly saveMessage: string | null;
  readonly saveMessageTone: 'ok' | 'warn' | 'error';
  readonly isSankalpaLoading: boolean;
  readonly sankalpaSyncMessage: string | null;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onCancelEdit: () => void;
  readonly onChangeDraft: (updater: (current: SankalpaDraft) => SankalpaDraft) => void;
  readonly onClearSaveMessage: () => void;
}

export function SankalpaEditor({
  draft,
  errors,
  editingGoalId,
  saveMessage,
  saveMessageTone,
  isSankalpaLoading,
  sankalpaSyncMessage,
  onSubmit,
  onCancelEdit,
  onChangeDraft,
  onClearSaveMessage,
}: SankalpaEditorProps) {
  return (
    <section className="sankalpa-panel">
      <h3 className="section-title">{editingGoalId ? 'Edit Sankalpa' : 'Create Sankalpa'}</h3>
      <p className="section-subtitle">
        {editingGoalId
          ? 'Editing keeps this sankalpa in its existing goal window, so progress and deadline stay anchored to the original creation date.'
          : 'Meditation-based goals count matching session logs. Observance goals use manual per-date check-ins for observances the app cannot infer automatically.'}
      </p>

      {saveMessage ? (
        <div className={`status-banner ${saveMessageTone === 'error' ? 'warn' : saveMessageTone}`} role="status">
          <p>{saveMessage}</p>
        </div>
      ) : null}
      {isSankalpaLoading ? <p className="section-subtitle">Refreshing sankalpa progress from the backend.</p> : null}
      {sankalpaSyncMessage ? <p className="section-subtitle">{sankalpaSyncMessage}</p> : null}

      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          <span>Goal type</span>
          <select
            value={draft.goalType}
            onChange={(event) => {
              onClearSaveMessage();
              const nextGoalType = event.target.value as typeof draft.goalType;
              onChangeDraft((current) => ({
                ...current,
                goalType: nextGoalType,
                targetValue: nextGoalType === 'observance-based' ? current.days : current.targetValue,
                meditationType: nextGoalType === 'observance-based' ? '' : current.meditationType,
                timeOfDayBucket: nextGoalType === 'observance-based' ? '' : current.timeOfDayBucket,
              }));
            }}
          >
            <option value="duration-based">{getSankalpaGoalTypeLabel('duration-based')}</option>
            <option value="session-count-based">{getSankalpaGoalTypeLabel('session-count-based')}</option>
            <option value="observance-based">{getSankalpaGoalTypeLabel('observance-based')}</option>
          </select>
          {errors.goalType ? <small className="error-text">{errors.goalType}</small> : null}
        </label>

        {draft.goalType === 'observance-based' ? (
          <label>
            <span>Observance</span>
            <input
              type="text"
              value={draft.observanceLabel}
              placeholder="Brahmacharya"
              onChange={(event) => {
                onClearSaveMessage();
                onChangeDraft((current) => ({
                  ...current,
                  observanceLabel: event.target.value,
                }));
              }}
            />
            {errors.observanceLabel ? <small className="error-text">{errors.observanceLabel}</small> : null}
          </label>
        ) : (
          <label>
            <span>{draft.goalType === 'duration-based' ? 'Target duration (minutes)' : 'Target session logs'}</span>
            <input
              type="number"
              min={1}
              step={draft.goalType === 'session-count-based' ? 1 : 0.5}
              value={draft.targetValue}
              onChange={(event) => {
                onClearSaveMessage();
                onChangeDraft((current) => ({
                  ...current,
                  targetValue: Number(event.target.value),
                }));
              }}
            />
            {errors.targetValue ? <small className="error-text">{errors.targetValue}</small> : null}
          </label>
        )}

        <label>
          <span>Days</span>
          <input
            type="number"
            min={1}
            step={1}
            value={draft.days}
            onChange={(event) => {
              onClearSaveMessage();
              onChangeDraft((current) => ({
                ...current,
                days: Number(event.target.value),
                targetValue: isObservanceGoalType(current.goalType) ? Number(event.target.value) : current.targetValue,
              }));
            }}
          />
          {errors.days ? <small className="error-text">{errors.days}</small> : null}
        </label>

        {draft.goalType === 'observance-based' ? (
          <div className="empty-state">
            <p>Each date in this window will appear in the sankalpa card for manual check-ins.</p>
            <p>The goal completes when every scheduled date is marked as observed.</p>
          </div>
        ) : (
          <>
            <label>
              <span>Meditation type filter (optional)</span>
              <select
                value={draft.meditationType}
                onChange={(event) => {
                  onClearSaveMessage();
                  onChangeDraft((current) => ({
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
                  onClearSaveMessage();
                  onChangeDraft((current) => ({
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
          </>
        )}

        <div className="timer-actions">
          <button type="submit">{editingGoalId ? 'Save Changes' : 'Create Sankalpa'}</button>
          {editingGoalId ? (
            <button type="button" className="secondary" onClick={onCancelEdit}>
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
