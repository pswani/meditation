import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { CustomPlayDraft, CustomPlayValidationResult } from '../../types/customPlay';
import type { MediaAssetMetadata } from '../../types/mediaAsset';
import { applyCustomPlayToTimerSettings } from '../../utils/customPlay';
import type { MediaAssetCatalogIssue } from '../../utils/mediaAssetApi';
import { loadCustomPlayMediaAssets } from '../../utils/mediaAssetApi';
import { meditationTypes, soundOptions } from '../timer/constants';
import { useTimer } from '../timer/useTimer';

const initialDraft: CustomPlayDraft = {
  name: '',
  meditationType: '',
  durationMinutes: 20,
  startSound: 'None',
  endSound: 'Temple Bell',
  mediaAssetId: '',
  recordingLabel: '',
};

const initialErrors: CustomPlayValidationResult['errors'] = {};

function describeLinkedMedia(asset: MediaAssetMetadata): string {
  return asset.label;
}

export default function CustomPlayManager() {
  const { settings, setSettings, customPlays, saveCustomPlay, deleteCustomPlay, toggleFavoriteCustomPlay } = useTimer();
  const [draft, setDraft] = useState<CustomPlayDraft>(initialDraft);
  const [errors, setErrors] = useState<CustomPlayValidationResult['errors']>(initialErrors);
  const [editId, setEditId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [appliedPlayId, setAppliedPlayId] = useState<string | null>(null);
  const [saveFeedbackMessage, setSaveFeedbackMessage] = useState<string | null>(null);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetMetadata[]>([]);
  const [mediaLoadError, setMediaLoadError] = useState<string | null>(null);
  const [mediaLoadIssueKind, setMediaLoadIssueKind] = useState<MediaAssetCatalogIssue | null>(null);

  useEffect(() => {
    let mounted = true;

    loadCustomPlayMediaAssets()
      .then((result) => {
        if (!mounted) {
          return;
        }
        setMediaAssets(result.assets);
        setMediaLoadError(result.errorMessage);
        setMediaLoadIssueKind(result.errorKind);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setMediaLoadError('Unable to load media session options right now.');
        setMediaLoadIssueKind('backend-error');
      });

    return () => {
      mounted = false;
    };
  }, []);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const playName = draft.name.trim() || 'Custom play';
    const feedbackMessage = editId ? `Custom play "${playName}" updated.` : `Custom play "${playName}" saved.`;
    const result = saveCustomPlay(draft, editId ?? undefined);
    setErrors(result.errors);

    if (result.isValid) {
      setDraft(initialDraft);
      setEditId(null);
      setSaveFeedbackMessage(feedbackMessage);
    } else {
      setSaveFeedbackMessage(null);
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
    setSaveFeedbackMessage(null);
  }

  function requestDelete(playId: string) {
    setPendingDeleteId(playId);
    setSaveFeedbackMessage(null);
  }

  function confirmDelete(playId: string) {
    deleteCustomPlay(playId);
    setPendingDeleteId(null);
    setSaveFeedbackMessage(null);

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
    setSaveFeedbackMessage(null);
    setDraft({
      name: match.name,
      meditationType: match.meditationType,
      durationMinutes: match.durationMinutes,
      startSound: match.startSound,
      endSound: match.endSound,
      mediaAssetId: match.mediaAssetId,
      recordingLabel: match.recordingLabel,
    });
  }

  const selectedMediaAsset = mediaAssets.find((asset) => asset.id === draft.mediaAssetId) ?? null;
  const mediaLoadMessageClassName =
    mediaLoadIssueKind === 'backend-error' || mediaLoadIssueKind === 'invalid-response' ? 'error-text' : 'hint-text';

  return (
    <section className="custom-play-panel">
      <h3 className="section-title">Custom Plays</h3>
      <p className="section-subtitle">Create and manage your custom play presets.</p>

      {saveFeedbackMessage ? (
        <div className="status-banner ok" role="status">
          <p>{saveFeedbackMessage}</p>
        </div>
      ) : null}

      <form className="form-grid" onSubmit={onSubmit}>
        <label>
          <span>Custom play name</span>
          <input
            value={draft.name}
            onChange={(event) => {
              setSaveFeedbackMessage(null);
              setDraft((current) => ({ ...current, name: event.target.value }));
            }}
            placeholder="Morning Focus"
          />
          {errors.name ? <small className="error-text">{errors.name}</small> : null}
        </label>

        <label>
          <span>Custom play meditation type</span>
          <select
            value={draft.meditationType}
            onChange={(event) => {
              setSaveFeedbackMessage(null);
              setDraft((current) => ({
                ...current,
                meditationType: event.target.value as CustomPlayDraft['meditationType'],
              }));
            }}
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
            onChange={(event) => {
              setSaveFeedbackMessage(null);
              setDraft((current) => ({
                ...current,
                durationMinutes: Number(event.target.value),
              }));
            }}
          />
          {errors.durationMinutes ? <small className="error-text">{errors.durationMinutes}</small> : null}
        </label>

        <label>
          <span>Custom play start sound (optional)</span>
          <select
            value={draft.startSound}
            onChange={(event) => {
              setSaveFeedbackMessage(null);
              setDraft((current) => ({
                ...current,
                startSound: event.target.value,
              }));
            }}
          >
            {soundOptions.map((sound) => (
              <option key={sound} value={sound}>
                {sound}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Custom play end sound (optional)</span>
          <select
            value={draft.endSound}
            onChange={(event) => {
              setSaveFeedbackMessage(null);
              setDraft((current) => ({
                ...current,
                endSound: event.target.value,
              }));
            }}
          >
            {soundOptions.map((sound) => (
              <option key={sound} value={sound}>
                {sound}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Media session (optional)</span>
          <select
            value={draft.mediaAssetId}
            onChange={(event) => {
              setSaveFeedbackMessage(null);
              setDraft((current) => ({
                ...current,
                mediaAssetId: event.target.value,
              }));
            }}
          >
            <option value="">No linked media session</option>
            {mediaAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.label}
              </option>
            ))}
          </select>
          {errors.mediaAssetId ? (
            <small className="error-text">{errors.mediaAssetId}</small>
          ) : selectedMediaAsset ? (
            <>
              <small className="hint-text">Linked media session: {describeLinkedMedia(selectedMediaAsset)}</small>
              <small className="hint-text">This keeps the custom play connected to the selected media session.</small>
            </>
          ) : (
            <>
              {mediaLoadError ? <small className={mediaLoadMessageClassName}>{mediaLoadError}</small> : null}
              <small className="hint-text">
                Choose a linked media session to remember which recording this custom play uses.
              </small>
            </>
          )}
        </label>

        <label>
          <span>Session note (optional)</span>
          <input
            value={draft.recordingLabel}
            onChange={(event) => {
              setSaveFeedbackMessage(null);
              setDraft((current) => ({ ...current, recordingLabel: event.target.value }));
            }}
            placeholder="Breath emphasis"
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
                setSaveFeedbackMessage(null);
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
          {customPlays.map((play) => {
            const linkedAsset = play.mediaAssetId ? mediaAssets.find((asset) => asset.id === play.mediaAssetId) : null;

            return (
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

                    {play.recordingLabel ? <p className="section-subtitle">Session note: {play.recordingLabel}</p> : null}
                    <p className="section-subtitle">
                      Sounds: {play.startSound} start · {play.endSound} end
                    </p>
                    {linkedAsset ? (
                      <p className="section-subtitle">Media session: {describeLinkedMedia(linkedAsset)}</p>
                    ) : play.mediaAssetId ? (
                      <p className="section-subtitle">Linked media session unavailable right now.</p>
                    ) : null}
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
            );
          })}
        </ul>
      )}
    </section>
  );
}
