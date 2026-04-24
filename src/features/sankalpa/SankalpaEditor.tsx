import type { FormEvent } from 'react';
import { meditationTypes } from '../timer/constants';
import type { SankalpaDraft, SankalpaValidationResult } from '../../types/sankalpa';
import {
  createInitialSankalpaDraft,
  describeSankalpaDraft,
  getSankalpaGoalTypeLabel,
  isObservanceGoalType,
  syncDraftTitle,
  timeOfDayBuckets,
  timeOfDayBucketLabels,
} from '../../utils/sankalpa';

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

function isGymPresetDraft(draft: SankalpaDraft): boolean {
  return (
    draft.goalType === 'observance-based' &&
    draft.cadenceMode === 'weekly' &&
    draft.targetValue === 5 &&
    draft.days === 28 &&
    draft.weeks === 4 &&
    draft.qualifyingDaysPerWeek === 5 &&
    draft.meditationType === '' &&
    draft.timeOfDayBucket === '' &&
    draft.observanceLabel.trim() === 'Gym'
  );
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
  const observanceGoal = isObservanceGoalType(draft.goalType);
  const recurringCadence = draft.cadenceMode === 'weekly';
  const titlePlaceholder = describeSankalpaDraft(draft);
  const gymPresetActive = isGymPresetDraft(draft);

  function applyDraftChange(updater: (current: SankalpaDraft) => SankalpaDraft) {
    onClearSaveMessage();
    onChangeDraft((current) => syncDraftTitle(current, updater(current)));
  }

  return (
    <section className="sankalpa-panel">
      <h3 className="section-title">{editingGoalId ? 'Edit Sankalpa' : 'Create Sankalpa'}</h3>
      <p className="section-subtitle">
        {editingGoalId
          ? 'Editing keeps this sankalpa in its existing goal window, so progress and deadline stay anchored to the original creation date.'
          : 'Meditation-based goals can track either a total target or a recurring weekly cadence. Observance goals use manual per-date check-ins for observances the app cannot infer automatically.'}
      </p>
      {!editingGoalId ? (
        <div className="timer-actions compact-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              if (gymPresetActive) {
                onClearSaveMessage();
                onChangeDraft(() => createInitialSankalpaDraft());
                return;
              }

              applyDraftChange((current) => ({
                ...current,
                goalType: 'observance-based',
                cadenceMode: 'weekly',
                targetValue: 5,
                days: 28,
                weeks: 4,
                qualifyingDaysPerWeek: 5,
                meditationType: '',
                timeOfDayBucket: '',
                observanceLabel: 'Gym',
              }));
            }}
            aria-pressed={gymPresetActive}
          >
            {gymPresetActive ? 'Unset Gym Preset' : 'Use Gym Preset'}
          </button>
        </div>
      ) : null}

      {saveMessage ? (
        <div className={`status-banner ${saveMessageTone === 'error' ? 'warn' : saveMessageTone}`} role="status">
          <p>{saveMessage}</p>
        </div>
      ) : null}
      {isSankalpaLoading ? <p className="section-subtitle">Refreshing sankalpa progress from the backend.</p> : null}
      {sankalpaSyncMessage ? <p className="section-subtitle">{sankalpaSyncMessage}</p> : null}

      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          <span>Title</span>
          <input
            type="text"
            value={draft.title}
            placeholder={titlePlaceholder}
            maxLength={160}
            onChange={(event) => {
              onClearSaveMessage();
              onChangeDraft((current) => ({
                ...current,
                title: event.target.value,
              }));
            }}
          />
          {errors.title ? <small className="error-text">{errors.title}</small> : null}
        </label>

        <label>
          <span>Goal type</span>
          <select
            value={draft.goalType}
            onChange={(event) => {
              const nextGoalType = event.target.value as typeof draft.goalType;
              applyDraftChange((current) => ({
                ...current,
                goalType: nextGoalType,
                cadenceMode: nextGoalType === 'observance-based' ? 'cumulative' : current.cadenceMode,
                targetValue:
                  nextGoalType === 'observance-based'
                    ? current.days
                    : current.goalType === 'observance-based'
                      ? nextGoalType === 'duration-based'
                        ? 15
                        : 1
                      : current.targetValue,
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

        {observanceGoal ? (
          <>
            <label>
              <span>Observed activity</span>
              <input
                type="text"
                value={draft.observanceLabel}
                placeholder="Brahmacharya"
                onChange={(event) => {
                  applyDraftChange((current) => ({
                    ...current,
                    observanceLabel: event.target.value,
                  }));
                }}
              />
              {errors.observanceLabel ? <small className="error-text">{errors.observanceLabel}</small> : null}
            </label>

            <label>
              <span>Tracking style</span>
              <select
                value={draft.cadenceMode}
                onChange={(event) => {
                  const nextCadenceMode = event.target.value as SankalpaDraft['cadenceMode'];
                  applyDraftChange((current) => ({
                    ...current,
                    cadenceMode: nextCadenceMode,
                    targetValue: nextCadenceMode === 'weekly' ? current.qualifyingDaysPerWeek : current.days,
                    weeks:
                      nextCadenceMode === 'weekly'
                        ? Math.max(1, Math.ceil(current.days / 7))
                        : current.weeks,
                  }));
                }}
              >
                <option value="cumulative">Every scheduled date</option>
                <option value="weekly">Weekly observed days</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <label>
              <span>Tracking style</span>
              <select
                value={draft.cadenceMode}
                onChange={(event) => {
                  const nextCadenceMode = event.target.value as SankalpaDraft['cadenceMode'];
                  applyDraftChange((current) => ({
                    ...current,
                    cadenceMode: nextCadenceMode,
                    targetValue:
                      nextCadenceMode === 'weekly'
                        ? current.goalType === 'duration-based'
                          ? 15
                          : 1
                        : current.goalType === 'duration-based'
                          ? Math.max(current.targetValue, 30)
                          : Math.max(current.targetValue, 3),
                  }));
                }}
              >
                <option value="cumulative">Total within window</option>
                <option value="weekly">Recurring weekly cadence</option>
              </select>
            </label>

            <label>
              <span>
                {recurringCadence
                  ? draft.goalType === 'duration-based'
                    ? 'Daily qualifying duration (minutes)'
                    : 'Daily qualifying session logs'
                  : draft.goalType === 'duration-based'
                    ? 'Target duration (minutes)'
                    : 'Target session logs'}
              </span>
              <input
                type="number"
                min={1}
                step={draft.goalType === 'session-count-based' ? 1 : 0.5}
                value={draft.targetValue}
                onChange={(event) => {
                  applyDraftChange((current) => ({
                    ...current,
                    targetValue: Number(event.target.value),
                  }));
                }}
              />
              {errors.targetValue ? <small className="error-text">{errors.targetValue}</small> : null}
            </label>
          </>
        )}

        {draft.cadenceMode === 'cumulative' ? (
          <label>
            <span>Days</span>
            <input
              type="number"
              min={1}
              step={1}
              value={draft.days}
              onChange={(event) => {
                applyDraftChange((current) => ({
                  ...current,
                  days: Number(event.target.value),
                  targetValue: isObservanceGoalType(current.goalType) ? Number(event.target.value) : current.targetValue,
                }));
              }}
            />
            {errors.days ? <small className="error-text">{errors.days}</small> : null}
          </label>
        ) : (
          <>
            <label>
              <span>{observanceGoal ? 'Observed days per week' : 'Qualifying days per week'}</span>
              <input
                type="number"
                min={1}
                max={7}
                step={1}
                value={draft.qualifyingDaysPerWeek}
                onChange={(event) => {
                  applyDraftChange((current) => ({
                    ...current,
                    qualifyingDaysPerWeek: Number(event.target.value),
                  }));
                }}
              />
              {errors.qualifyingDaysPerWeek ? <small className="error-text">{errors.qualifyingDaysPerWeek}</small> : null}
            </label>

            <label>
              <span>Weeks</span>
              <input
                type="number"
                min={1}
                step={1}
                value={draft.weeks}
                onChange={(event) => {
                  applyDraftChange((current) => ({
                    ...current,
                    weeks: Number(event.target.value),
                  }));
                }}
              />
              {errors.weeks ? <small className="error-text">{errors.weeks}</small> : null}
            </label>
          </>
        )}

        {observanceGoal ? (
          <div className="empty-state">
            {recurringCadence ? (
              <>
                <p>Each week counts when enough dates are marked observed.</p>
                <p>Gym check-ins stay manual and separate from meditation session logs.</p>
              </>
            ) : (
              <>
                <p>Each date in this window will appear in the sankalpa card for manual check-ins.</p>
                <p>The goal completes when every scheduled date is marked as observed.</p>
              </>
            )}
          </div>
        ) : (
          <>
            {recurringCadence ? (
              <div className="empty-state">
                <p>Each week counts only when enough local dates meet the qualifying threshold.</p>
                <p>This keeps recurring sankalpas focused on steady discipline rather than raw totals alone.</p>
              </div>
            ) : null}

            <label>
              <span>Meditation type filter (optional)</span>
              <select
                value={draft.meditationType}
                onChange={(event) => {
                  applyDraftChange((current) => ({
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
                  applyDraftChange((current) => ({
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
