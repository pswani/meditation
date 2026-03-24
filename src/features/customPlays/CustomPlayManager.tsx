import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CustomPlayDraft, CustomPlayValidationResult } from '../../types/customPlay';
import { applyCustomPlayToTimerSettings } from '../../utils/customPlay';
import { meditationTypes } from '../timer/constants';
import { useTimer } from '../timer/useTimer';

const initialDraft: CustomPlayDraft = {
  name: '',
  meditationType: '',
  durationMinutes: 20,
  recordingLabel: '',
};

const initialErrors: CustomPlayValidationResult['errors'] = {};

export default function CustomPlayManager() {
  const { settings, setSettings, customPlays, saveCustomPlay, deleteCustomPlay, toggleFavoriteCustomPlay } = useTimer();
  const [draft, setDraft] = useState<CustomPlayDraft>(initialDraft);
  const [errors, setErrors] = useState<CustomPlayValidationResult['errors']>(initialErrors);
  const [editId, setEditId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [appliedPlayId, setAppliedPlayId] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = saveCustomPlay(draft, editId ?? undefined);
    setErrors(result.errors);

    if (result.isValid) {
      setDraft(initialDraft);
      setEditId(null);
    }
  }

  function applyCustomPlay(playId: string) {
    const match = customPlays.find((play) => play.id === playId);
    if (!match) {
      return;
    }

    setSettings(applyCustomPlayToTimerSettings(settings, match));
    setPendingDeleteId(null);
    setAppliedPlayId(match.id);
  }

  function requestDelete(playId: string) {
    setPendingDeleteId(playId);
  }

  function confirmDelete(playId: string) {
    deleteCustomPlay(playId);
    setPendingDeleteId(null);

    if (editId === playId) {
      setEditId(null);
      setDraft(initialDraft);
      setErrors(initialErrors);
    }

    if (appliedPlayId === playId) {
      setAppliedPlayId(null);
    }
  }

  function startEdit(playId: string) {
    const match = customPlays.find((play) => play.id === playId);
    if (!match) {
      return;
    }

    setEditId(playId);
    setDraft({
      name: match.name,
      meditationType: match.meditationType,
      durationMinutes: match.durationMinutes,
      recordingLabel: match.recordingLabel,
    });
  }

  return (
    <section className="custom-play-panel">
      <h3 className="section-title">Custom Plays</h3>
      <p className="section-subtitle">Create and manage your custom play presets.</p>

      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          <span>Custom play name</span>
          <input
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="Morning Focus"
          />
          {errors.name ? <small className="error-text">{errors.name}</small> : null}
        </label>

        <label>
          <span>Custom play meditation type</span>
          <select
            value={draft.meditationType}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                meditationType: event.target.value as CustomPlayDraft['meditationType'],
              }))
            }
          >
            <option value="">Select custom play meditation type</option>
            {meditationTypes.map((meditationType) => (
              <option key={meditationType} value={meditationType}>
                {meditationType}
              </option>
            ))}
          </select>
          {errors.meditationType ? <small className="error-text">{errors.meditationType}</small> : null}
        </label>

        <label>
          <span>Custom play duration (minutes)</span>
          <input
            type="number"
            min={1}
            value={draft.durationMinutes}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                durationMinutes: Number(event.target.value),
              }))
            }
          />
          {errors.durationMinutes ? <small className="error-text">{errors.durationMinutes}</small> : null}
        </label>

        <label>
          <span>Recording label (optional)</span>
          <input
            value={draft.recordingLabel}
            onChange={(event) => setDraft((current) => ({ ...current, recordingLabel: event.target.value }))}
            placeholder="Session A"
          />
        </label>

        <div className="timer-actions">
          <button type="submit">{editId ? 'Update Custom Play' : 'Create Custom Play'}</button>
          {editId ? (
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setEditId(null);
                setDraft(initialDraft);
                setErrors(initialErrors);
              }}
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      {customPlays.length === 0 ? (
        <div className="empty-state">
          <p>No custom play entries yet.</p>
          <p>Create one to quickly reuse your preferred setup.</p>
        </div>
      ) : (
        <ul className="custom-play-list">
          {customPlays.map((play) => (
            <li key={play.id} className="custom-play-item">
              <div className="custom-play-grid">
                <div className="custom-play-main">
                  <div className="history-row">
                    <div>
                      <strong>{play.name}</strong>
                      <p className="history-time">
                        {play.meditationType} · {play.durationMinutes} min
                      </p>
                    </div>
                    {play.favorite ? <span className="pill ok">favorite</span> : null}
                  </div>

                  {play.recordingLabel ? <p className="section-subtitle">Recording: {play.recordingLabel}</p> : null}
                  {appliedPlayId === play.id ? (
                    <p className="section-subtitle" role="status">
                      Custom play "{play.name}" applied to timer setup.
                    </p>
                  ) : null}
                </div>

                <div className="custom-play-side">
                  <div className="custom-play-actions">
                    <button type="button" onClick={() => applyCustomPlay(play.id)}>
                      Use Custom Play
                    </button>
                    <button type="button" className="secondary" onClick={() => startEdit(play.id)}>
                      Edit
                    </button>
                    <button type="button" className="secondary" onClick={() => toggleFavoriteCustomPlay(play.id)}>
                      {play.favorite ? 'Unfavorite' : 'Favorite'}
                    </button>
                    <button type="button" className="secondary" onClick={() => requestDelete(play.id)}>
                      Delete
                    </button>
                  </div>

                  {pendingDeleteId === play.id ? (
                    <div className="confirm-sheet" role="dialog" aria-label={`Delete custom play ${play.name} confirmation`}>
                      <p>Delete custom play "{play.name}"?</p>
                      <div className="timer-actions">
                        <button type="button" className="secondary" onClick={() => setPendingDeleteId(null)}>
                          Keep Custom Play
                        </button>
                        <button type="button" onClick={() => confirmDelete(play.id)}>
                          Delete Custom Play
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
