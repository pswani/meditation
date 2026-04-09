import type { FormEvent } from 'react';
import { meditationTypes, soundOptions } from '../timer/constants';
import type { CustomPlayDraft, CustomPlayValidationResult } from '../../types/customPlay';
import type { MediaAssetMetadata } from '../../types/mediaAsset';
import { deriveCustomPlayDurationMinutes } from '../../utils/customPlay';
import { describeLinkedMedia } from './customPlayManagerHelpers';

interface CustomPlayFormProps {
  readonly draft: CustomPlayDraft;
  readonly errors: CustomPlayValidationResult['errors'];
  readonly editId: string | null;
  readonly controlsDisabled: boolean;
  readonly isMediaCatalogLoading: boolean;
  readonly mediaAssets: readonly MediaAssetMetadata[];
  readonly selectedMediaAsset: MediaAssetMetadata | null;
  readonly mediaLoadError: string | null;
  readonly mediaLoadMessageClassName: string;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onUpdateDraft: (updater: (current: CustomPlayDraft) => CustomPlayDraft) => void;
  readonly onCancelEdit: () => void;
  readonly onClearFeedback: () => void;
}

export function CustomPlayForm({
  draft,
  errors,
  editId,
  controlsDisabled,
  isMediaCatalogLoading,
  mediaAssets,
  selectedMediaAsset,
  mediaLoadError,
  mediaLoadMessageClassName,
  onSubmit,
  onUpdateDraft,
  onCancelEdit,
  onClearFeedback,
}: CustomPlayFormProps) {
  const customPlayNameMessageId = errors.name ? 'custom-play-name-error' : undefined;
  const customPlayMeditationTypeMessageId = errors.meditationType ? 'custom-play-meditation-type-error' : undefined;
  const customPlayDurationMessageId = errors.durationMinutes ? 'custom-play-duration-error' : undefined;
  const customPlayMediaMessageId = errors.mediaAssetId ? 'custom-play-media-error' : 'custom-play-media-hint';

  return (
    <form className="form-grid custom-play-form" onSubmit={onSubmit}>
      <label>
        <span>Custom play name</span>
        <input
          disabled={controlsDisabled}
          value={draft.name}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={customPlayNameMessageId}
          onChange={(event) => {
            onClearFeedback();
            onUpdateDraft((current) => ({ ...current, name: event.target.value }));
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
          disabled={controlsDisabled}
          value={draft.meditationType}
          aria-invalid={Boolean(errors.meditationType)}
          aria-describedby={customPlayMeditationTypeMessageId}
          onChange={(event) => {
            onClearFeedback();
            onUpdateDraft((current) => ({
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
          disabled={controlsDisabled}
          value={draft.startSound}
          onChange={(event) => {
            onClearFeedback();
            onUpdateDraft((current) => ({
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
          disabled={controlsDisabled}
          value={draft.endSound}
          onChange={(event) => {
            onClearFeedback();
            onUpdateDraft((current) => ({
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
          disabled={controlsDisabled || isMediaCatalogLoading}
          value={draft.mediaAssetId}
          aria-invalid={Boolean(errors.mediaAssetId)}
          aria-describedby={customPlayMediaMessageId}
          onChange={(event) => {
            onClearFeedback();
            const nextMediaAssetId = event.target.value;
            const nextDurationMinutes = deriveCustomPlayDurationMinutes(nextMediaAssetId) ?? 0;
            onUpdateDraft((current) => ({
              ...current,
              mediaAssetId: nextMediaAssetId,
              durationMinutes: nextDurationMinutes,
            }));
          }}
        >
          <option value="">Select linked media session</option>
          {mediaAssets.map((asset) => (
            <option key={asset.id} value={asset.id}>
              {describeLinkedMedia(asset)}
            </option>
          ))}
        </select>
        {errors.mediaAssetId ? (
          <small id={customPlayMediaMessageId} className="error-text">
            {errors.mediaAssetId}
          </small>
        ) : isMediaCatalogLoading ? (
          <small id={customPlayMediaMessageId} className="hint-text">
            Loading managed media sessions from the backend library.
          </small>
        ) : selectedMediaAsset ? (
          <>
            <small id={customPlayMediaMessageId} className="hint-text">
              Managed library entry: {describeLinkedMedia(selectedMediaAsset)}
            </small>
            <small className="hint-text">Managed path: {selectedMediaAsset.relativePath}</small>
            <small className="hint-text">This keeps the custom play connected to the selected managed media session.</small>
          </>
        ) : (
          <>
            {mediaLoadError ? (
              <small id={customPlayMediaMessageId} className={mediaLoadMessageClassName}>
                {mediaLoadError}
              </small>
            ) : null}
            <small className="hint-text">Choose a managed media session to remember which recording this custom play uses.</small>
          </>
        )}
      </label>

      <label>
        <span>Session note (optional)</span>
        <input
          disabled={controlsDisabled}
          value={draft.recordingLabel}
          onChange={(event) => {
            onClearFeedback();
            onUpdateDraft((current) => ({ ...current, recordingLabel: event.target.value }));
          }}
          placeholder="Breath emphasis"
        />
      </label>

      <div className="timer-actions">
        <button type="submit" disabled={controlsDisabled}>
          {editId ? 'Update Custom Play' : 'Create Custom Play'}
        </button>
        {editId ? (
          <button type="button" className="secondary" disabled={controlsDisabled} onClick={onCancelEdit}>
            Cancel Edit
          </button>
        ) : null}
      </div>
    </form>
  );
}
