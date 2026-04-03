import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { CustomPlayDraft, CustomPlayValidationResult } from '../../types/customPlay';
import type { MediaAssetMetadata } from '../../types/mediaAsset';
import type { TimerSettings } from '../../types/timer';
import { applyCustomPlayToTimerSettings, deriveCustomPlayDurationMinutes } from '../../utils/customPlay';
import type { MediaAssetCatalogIssue } from '../../utils/mediaAssetApi';
import { loadCustomPlayMediaAssets } from '../../utils/mediaAssetApi';
import { meditationTypes, soundOptions } from '../timer/constants';
import { useTimer } from '../timer/useTimer';

const initialDraft: CustomPlayDraft = {
  name: '',
  meditationType: '',
  durationMinutes: 0,
  startSound: 'None',
  endSound: 'Temple Bell',
  mediaAssetId: '',
  recordingLabel: '',
};

const initialErrors: CustomPlayValidationResult['errors'] = {};

function describeLinkedMedia(asset: MediaAssetMetadata): string {
  return asset.label;
}

interface CustomPlayManagerProps {
  readonly timerSettings: TimerSettings;
  readonly onApplyCustomPlay: (nextSettings: TimerSettings) => void;
  readonly onStartCustomPlay: () => void;
}

function customPlayStartBlockMessage(reason?: string): string {
  const messages: Record<string, string> = {
    'custom plays loading': 'Custom plays are still loading from the backend.',
    'timer session active': 'Finish the active timer before starting a custom play.',
    'playlist run active': 'Finish the active playlist run before starting a custom play.',
    'custom play run active': 'A custom play is already active. Resume it to continue.',
    'custom play not found': 'That custom play is no longer available.',
    'media unavailable': 'The linked media session is unavailable right now.',
  };

  return reason ? messages[reason] ?? 'Unable to start that custom play right now.' : 'Unable to start that custom play right now.';
}

export default function CustomPlayManager({ timerSettings, onApplyCustomPlay, onStartCustomPlay }: CustomPlayManagerProps) {
  const {
    customPlays,
    saveCustomPlay,
    deleteCustomPlay,
    toggleFavoriteCustomPlay,
    startCustomPlayRun,
    activeCustomPlayRun,
    isCustomPlaysLoading,
    isCustomPlaySyncing,
    customPlaySyncError,
  } = useTimer();
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const playName = draft.name.trim() || 'Custom play';
    const feedbackMessage = editId ? `Custom play "${playName}" updated.` : `Custom play "${playName}" saved.`;
    const result = await saveCustomPlay(draft, editId ?? undefined);
    setErrors(result.errors);

    if (result.isValid && result.persisted) {
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

    onApplyCustomPlay(applyCustomPlayToTimerSettings(timerSettings, match));
    setPendingDeleteId(null);
    setAppliedPlayId(match.id);
    setSaveFeedbackMessage(null);
  }

  function startCustomPlay(playId: string) {
    const match = customPlays.find((play) => play.id === playId);
    if (!match) {
      return;
    }

    const result = startCustomPlayRun(playId);
    if (!result.started) {
      setSaveFeedbackMessage(customPlayStartBlockMessage(result.reason));
      return;
    }

    setPendingDeleteId(null);
    setAppliedPlayId(null);
    setSaveFeedbackMessage(`Custom play "${match.name}" started.`);
    onStartCustomPlay();
  }

  function requestDelete(playId: string) {
    setPendingDeleteId(playId);
    setSaveFeedbackMessage(null);
  }

  async function confirmDelete(playId: string) {
    const deleted = await deleteCustomPlay(playId);
    if (!deleted) {
      return;
    }

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
  const customPlayNameMessageId = errors.name ? 'custom-play-name-error' : undefined;
  const customPlayMeditationTypeMessageId = errors.meditationType ? 'custom-play-meditation-type-error' : undefined;
  const customPlayDurationMessageId = errors.durationMinutes ? 'custom-play-duration-error' : undefined;
  const customPlayMediaMessageId = errors.mediaAssetId ? 'custom-play-media-error' : 'custom-play-media-hint';

  return (
    <section className="custom-play-panel">
      <h3 className="section-title">Custom Plays</h3>
      <p className="section-subtitle">Create and manage your custom play presets.</p>

      {isCustomPlaysLoading ? (
        <div className="status-banner" role="status">
          <p>Loading custom plays from the backend.</p>
        </div>
      ) : null}

      {isCustomPlaySyncing ? (
        <div className="status-banner" role="status">
          <p>Saving custom plays to the backend.</p>
        </div>
      ) : null}

      {customPlaySyncError ? (
        <div className="status-banner warn" role="status">
          <p>{customPlaySyncError}</p>
        </div>
      ) : null}

      {saveFeedbackMessage ? (
        <div className="status-banner ok" role="status">
          <p>{saveFeedbackMessage}</p>
        </div>
      ) : null}

      <div className="custom-play-manager-layout">
        <form className="form-grid custom-play-form" onSubmit={onSubmit}>
          <label>
            <span>Custom play name</span>
            <input
              disabled={isCustomPlaysLoading || isCustomPlaySyncing}
              value={draft.name}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={customPlayNameMessageId}
              onChange={(event) => {
                setSaveFeedbackMessage(null);
                setDraft((current) => ({ ...current, name: event.target.value }));
              }}
              placeholder="Morning Focus"
            />
            {errors.name ? (
              <small id={customPlayNameMessageId} className="error-text">
                {errors.name}
              </small>
            ) : null}
          </label>

          <label>
            <span>Custom play meditation type</span>
            <select
              disabled={isCustomPlaysLoading || isCustomPlaySyncing}
              value={draft.meditationType}
              aria-invalid={Boolean(errors.meditationType)}
              aria-describedby={customPlayMeditationTypeMessageId}
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
            {errors.meditationType ? (
              <small id={customPlayMeditationTypeMessageId} className="error-text">
                {errors.meditationType}
              </small>
            ) : null}
          </label>

          <label>
            <span>Custom play duration (minutes)</span>
            <input
              type="number"
              min={1}
              disabled
              value={draft.durationMinutes || ''}
              aria-invalid={Boolean(errors.durationMinutes)}
              aria-describedby={customPlayDurationMessageId}
              readOnly
            />
            {errors.durationMinutes ? (
              <small id={customPlayDurationMessageId} className="error-text">
                {errors.durationMinutes}
              </small>
            ) : null}
            <small className="hint-text">Duration is derived from the linked media session.</small>
          </label>

          <label>
            <span>Custom play start sound (optional)</span>
            <select
              disabled={isCustomPlaysLoading || isCustomPlaySyncing}
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
              disabled={isCustomPlaysLoading || isCustomPlaySyncing}
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
            <span>Linked media session</span>
            <select
              disabled={isCustomPlaysLoading || isCustomPlaySyncing}
              value={draft.mediaAssetId}
              aria-invalid={Boolean(errors.mediaAssetId)}
              aria-describedby={customPlayMediaMessageId}
              onChange={(event) => {
                setSaveFeedbackMessage(null);
                const nextMediaAssetId = event.target.value;
                const nextDurationMinutes = deriveCustomPlayDurationMinutes(nextMediaAssetId) ?? 0;
                setDraft((current) => ({
                  ...current,
                  mediaAssetId: nextMediaAssetId,
                  durationMinutes: nextDurationMinutes,
                }));
              }}
            >
              <option value="">Select linked media session</option>
              {mediaAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.label}
                </option>
              ))}
            </select>
            {errors.mediaAssetId ? (
              <small id={customPlayMediaMessageId} className="error-text">
                {errors.mediaAssetId}
              </small>
            ) : selectedMediaAsset ? (
              <>
                <small id={customPlayMediaMessageId} className="hint-text">
                  Linked media session: {describeLinkedMedia(selectedMediaAsset)}
                </small>
                <small className="hint-text">This keeps the custom play connected to the selected media session.</small>
              </>
            ) : (
              <>
                {mediaLoadError ? <small id={customPlayMediaMessageId} className={mediaLoadMessageClassName}>{mediaLoadError}</small> : null}
                <small className="hint-text">
                  Choose a linked media session to remember which recording this custom play uses.
                </small>
              </>
            )}
          </label>

          <label>
            <span>Session note (optional)</span>
            <input
              disabled={isCustomPlaysLoading || isCustomPlaySyncing}
              value={draft.recordingLabel}
              onChange={(event) => {
                setSaveFeedbackMessage(null);
                setDraft((current) => ({ ...current, recordingLabel: event.target.value }));
              }}
              placeholder="Breath emphasis"
            />
          </label>

          <div className="timer-actions">
            <button type="submit" disabled={isCustomPlaysLoading || isCustomPlaySyncing}>
              {editId ? 'Update Custom Play' : 'Create Custom Play'}
            </button>
            {editId ? (
              <button
                type="button"
                className="secondary"
                disabled={isCustomPlaysLoading || isCustomPlaySyncing}
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

        <div className="custom-play-collection" aria-live="polite">
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
                      <button
                        type="button"
                        disabled={isCustomPlaysLoading || isCustomPlaySyncing}
                        onClick={() => startCustomPlay(play.id)}
                      >
                        Start Custom Play
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        disabled={isCustomPlaysLoading || isCustomPlaySyncing}
                        onClick={() => applyCustomPlay(play.id)}
                      >
                        Apply To Timer
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        disabled={isCustomPlaysLoading || isCustomPlaySyncing}
                        onClick={() => startEdit(play.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        disabled={isCustomPlaysLoading || isCustomPlaySyncing}
                        onClick={async () => {
                          setSaveFeedbackMessage(null);
                          await toggleFavoriteCustomPlay(play.id);
                        }}
                      >
                        {play.favorite ? 'Unfavorite' : 'Favorite'}
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        disabled={isCustomPlaysLoading || isCustomPlaySyncing}
                        onClick={() => requestDelete(play.id)}
                      >
                        Delete
                      </button>
                    </div>
                    {activeCustomPlayRun?.customPlayId === play.id ? (
                      <p className="section-subtitle" role="status">
                        Custom play running now.
                      </p>
                    ) : null}
                    {appliedPlayId === play.id ? (
                      <p className="section-subtitle" role="status">
                        Custom play "{play.name}" applied to timer setup.
                      </p>
                    ) : null}
                    {pendingDeleteId === play.id ? (
                      <div className="confirm-sheet" role="dialog" aria-label={`Delete custom play ${play.name} confirmation`}>
                        <p>Delete custom play "{play.name}"?</p>
                        <div className="timer-actions">
                          <button
                            type="button"
                            className="secondary"
                            disabled={isCustomPlaysLoading || isCustomPlaySyncing}
                            onClick={() => setPendingDeleteId(null)}
                          >
                            Keep Custom Play
                          </button>
                          <button
                            type="button"
                            disabled={isCustomPlaysLoading || isCustomPlaySyncing}
                            onClick={() => void confirmDelete(play.id)}
                          >
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
        </div>
      </div>
    </section>
  );
}
