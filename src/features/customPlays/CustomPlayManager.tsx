import { useState } from 'react';
import type { FormEvent } from 'react';
import { CustomPlayCollection } from './CustomPlayCollection';
import { CustomPlayForm } from './CustomPlayForm';
import { customPlayStartBlockMessage, describeManagedLibrarySource } from './customPlayManagerHelpers';
import { useCustomPlayMediaCatalog } from './useCustomPlayMediaCatalog';
import type { CustomPlayDraft, CustomPlayValidationResult } from '../../types/customPlay';
import type { TimerSettings } from '../../types/timer';
import { applyCustomPlayToTimerSettings } from '../../utils/customPlay';
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
type FeedbackTone = 'ok' | 'warn';

interface CustomPlayManagerProps {
  readonly timerSettings: TimerSettings;
  readonly onApplyCustomPlay: (nextSettings: TimerSettings) => void;
  readonly onStartCustomPlay: () => void;
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
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('ok');
  const { mediaAssets, mediaCatalogSource, isMediaCatalogLoading, mediaLoadError, mediaLoadIssueKind } = useCustomPlayMediaCatalog();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const playName = draft.name.trim() || 'Custom play';
    const feedbackMessage = editId ? `Custom play "${playName}" updated.` : `Custom play "${playName}" saved.`;
    const result = await saveCustomPlay(draft, editId ?? undefined);
    setErrors(result.errors);

    if (result.isValid && result.persisted) {
      setDraft(initialDraft);
      setEditId(null);
      setFeedbackTone('ok');
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
      setFeedbackTone('warn');
      setSaveFeedbackMessage(customPlayStartBlockMessage(result.reason));
      return;
    }

    setPendingDeleteId(null);
    setAppliedPlayId(null);
    setFeedbackTone('ok');
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
  const showManagedLibraryEmptyState = !isMediaCatalogLoading && !isCustomPlaysLoading && mediaAssets.length === 0;
  const controlsDisabled = isCustomPlaysLoading || isCustomPlaySyncing;

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
        <div className={`status-banner ${feedbackTone === 'ok' ? 'ok' : 'warn'}`} role="status">
          <p>{saveFeedbackMessage}</p>
        </div>
      ) : null}

      {isMediaCatalogLoading ? (
        <div className="status-banner" role="status">
          <p>Loading managed media sessions from the backend library.</p>
        </div>
      ) : showManagedLibraryEmptyState ? (
        <div className="status-banner warn" role="status">
          <p>No managed media sessions are available yet.</p>
          <p>Register a custom-play recording through the repo media workflow, restart the backend, then reload this screen.</p>
        </div>
      ) : (
        <div className={`status-banner ${mediaCatalogSource === 'backend' ? 'ok' : ''}`} role="status">
          <p>{describeManagedLibrarySource(mediaCatalogSource, mediaAssets.length)}</p>
          {mediaLoadError ? <p>{mediaLoadError}</p> : null}
        </div>
      )}

      <div className="custom-play-manager-layout">
        <CustomPlayForm
          draft={draft}
          errors={errors}
          editId={editId}
          controlsDisabled={controlsDisabled}
          isMediaCatalogLoading={isMediaCatalogLoading}
          mediaAssets={mediaAssets}
          selectedMediaAsset={selectedMediaAsset}
          mediaLoadError={mediaLoadError}
          mediaLoadMessageClassName={mediaLoadMessageClassName}
          onSubmit={onSubmit}
          onUpdateDraft={(updater) => setDraft((current) => updater(current))}
          onCancelEdit={() => {
            setEditId(null);
            setDraft(initialDraft);
            setErrors(initialErrors);
            setSaveFeedbackMessage(null);
          }}
          onClearFeedback={() => setSaveFeedbackMessage(null)}
        />

        <CustomPlayCollection
          customPlays={customPlays}
          mediaAssets={mediaAssets}
          activeCustomPlayRun={activeCustomPlayRun}
          appliedPlayId={appliedPlayId}
          pendingDeleteId={pendingDeleteId}
          controlsDisabled={controlsDisabled}
          isMediaCatalogLoading={isMediaCatalogLoading}
          onStartCustomPlay={startCustomPlay}
          onApplyCustomPlay={applyCustomPlay}
          onStartEdit={startEdit}
          onToggleFavorite={toggleFavoriteCustomPlay}
          onRequestDelete={requestDelete}
          onCancelDelete={() => setPendingDeleteId(null)}
          onConfirmDelete={confirmDelete}
          onClearFeedback={() => setSaveFeedbackMessage(null)}
        />
      </div>
    </section>
  );
}
