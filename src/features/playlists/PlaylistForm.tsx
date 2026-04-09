import type { FormEvent } from 'react';
import type { PlaylistDraft, PlaylistValidationResult } from '../../types/playlist';
import type { CustomPlay } from '../../types/customPlay';
import {
  computePlaylistGapTotalSeconds,
  computePlaylistTotalDurationMinutes,
  computePlaylistTotalDurationSeconds,
  createPlaylistDraftItem,
  movePlaylistDraftItem,
} from '../../utils/playlist';
import { formatDurationLabel } from '../../utils/sessionLog';
import { meditationTypes } from '../timer/constants';
import { formatGapLabel, smallGapOptions } from './playlistManagerHelpers';

interface PlaylistFormProps {
  readonly draft: PlaylistDraft;
  readonly errors: PlaylistValidationResult['errors'];
  readonly editId: string | null;
  readonly controlsDisabled: boolean;
  readonly customPlays: readonly CustomPlay[];
  readonly isCustomPlaysLoading: boolean;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly onCancelEdit: () => void;
  readonly onUpdateDraft: (next: PlaylistDraft) => void;
  readonly onUpdateDraftItem: (
    itemId: string,
    updater: (item: PlaylistDraft['items'][number]) => PlaylistDraft['items'][number]
  ) => void;
  readonly onSyncDraftItemFromCustomPlay: (itemId: string, customPlayId: string) => void;
  readonly onRemoveDraftItem: (itemId: string) => void;
  readonly onClearFeedback: () => void;
}

export function PlaylistForm({
  draft,
  errors,
  editId,
  controlsDisabled,
  customPlays,
  isCustomPlaysLoading,
  onSubmit,
  onCancelEdit,
  onUpdateDraft,
  onUpdateDraftItem,
  onSyncDraftItemFromCustomPlay,
  onRemoveDraftItem,
  onClearFeedback,
}: PlaylistFormProps) {
  const playlistNameMessageId = errors.name ? 'playlist-name-error' : undefined;
  const playlistGapMessageId = errors.smallGapSeconds ? 'playlist-gap-error' : undefined;
  const derivedGapSeconds = computePlaylistGapTotalSeconds(draft.items.length, draft.smallGapSeconds);
  const derivedTotalSeconds = computePlaylistTotalDurationSeconds(draft.items, draft.smallGapSeconds);

  return (
    <form className="playlist-form" onSubmit={onSubmit}>
      <label>
        <span>Playlist name</span>
        <input
          disabled={controlsDisabled}
          value={draft.name}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={playlistNameMessageId}
          onChange={(event) => {
            onClearFeedback();
            onUpdateDraft({ ...draft, name: event.target.value });
          }}
          placeholder="Morning Sequence"
        />
        {errors.name ? (
          <small id={playlistNameMessageId} className="error-text">
            {errors.name}
          </small>
        ) : null}
      </label>

      <label>
        <span>Small gap between items</span>
        <select
          disabled={controlsDisabled}
          value={draft.smallGapSeconds}
          aria-invalid={Boolean(errors.smallGapSeconds)}
          aria-describedby={playlistGapMessageId}
          onChange={(event) => {
            onClearFeedback();
            onUpdateDraft({
              ...draft,
              smallGapSeconds: Number(event.target.value),
            });
          }}
        >
          {smallGapOptions.map((seconds) => (
            <option key={seconds} value={seconds}>
              {formatGapLabel(seconds)}
            </option>
          ))}
        </select>
        {errors.smallGapSeconds ? (
          <small id={playlistGapMessageId} className="error-text">
            {errors.smallGapSeconds}
          </small>
        ) : (
          <small id={playlistGapMessageId} className="hint-text">
            Use a brief settling pause when you want a calm transition between items.
          </small>
        )}
      </label>

      <div className="playlist-item-builder">
        <div className="history-row">
          <strong>Playlist items</strong>
          <button
            type="button"
            className="secondary"
            disabled={controlsDisabled}
            onClick={() =>
              onUpdateDraft({
                ...draft,
                items: [...draft.items, createPlaylistDraftItem()],
              })
            }
          >
            Add Item
          </button>
        </div>

        {errors.items ? <small className="error-text">{errors.items}</small> : null}

        {draft.items.map((item, index) => {
          const itemErrors = errors.itemErrors[item.id];
          const itemMeditationTypeMessageId = itemErrors?.meditationType ? `playlist-item-${item.id}-meditation-type-error` : undefined;
          const itemDurationMessageId = itemErrors?.durationMinutes ? `playlist-item-${item.id}-duration-error` : undefined;
          const linkedCustomPlay = item.customPlayId ? customPlays.find((entry) => entry.id === item.customPlayId) : null;
          const isLinkedCustomPlayItem = Boolean(item.customPlayId);

          return (
            <div key={item.id} className="playlist-item-row">
              <label>
                <span>Item {index + 1} linked custom play (optional)</span>
                <select
                  disabled={controlsDisabled || isCustomPlaysLoading}
                  value={item.customPlayId}
                  onChange={(event) => {
                    onClearFeedback();
                    onSyncDraftItemFromCustomPlay(item.id, event.target.value);
                  }}
                >
                  <option value="">Use a timed meditation segment</option>
                  {customPlays.map((customPlay) => (
                    <option key={customPlay.id} value={customPlay.id}>
                      {customPlay.name}
                    </option>
                  ))}
                </select>
                <small className="hint-text">
                  {isCustomPlaysLoading
                    ? 'Loading available custom plays.'
                    : isLinkedCustomPlayItem
                    ? 'This item will use the linked recording, meditation type, and duration.'
                    : 'Leave this empty to use a quiet timed segment.'}
                </small>
              </label>

              <label>
                <span>Item {index + 1} meditation type</span>
                <select
                  disabled={controlsDisabled || isLinkedCustomPlayItem}
                  value={item.meditationType}
                  aria-invalid={Boolean(itemErrors?.meditationType)}
                  aria-describedby={itemMeditationTypeMessageId}
                  onChange={(event) => {
                    onClearFeedback();
                    onUpdateDraftItem(item.id, (entry) => ({
                      ...entry,
                      meditationType: event.target.value as PlaylistDraft['items'][number]['meditationType'],
                      title: event.target.value || entry.title,
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
                {itemErrors?.meditationType ? (
                  <small id={itemMeditationTypeMessageId} className="error-text">
                    {itemErrors.meditationType}
                  </small>
                ) : null}
              </label>

              <label>
                <span>Item {index + 1} duration (minutes)</span>
                <input
                  type="number"
                  min={1}
                  disabled={controlsDisabled || isLinkedCustomPlayItem}
                  value={item.durationMinutes}
                  aria-invalid={Boolean(itemErrors?.durationMinutes)}
                  aria-describedby={itemDurationMessageId}
                  onChange={(event) => {
                    onClearFeedback();
                    onUpdateDraftItem(item.id, (entry) => ({
                      ...entry,
                      durationMinutes: Number(event.target.value),
                    }));
                  }}
                />
                {itemErrors?.durationMinutes ? (
                  <small id={itemDurationMessageId} className="error-text">
                    {itemErrors.durationMinutes}
                  </small>
                ) : (
                  <small id={itemDurationMessageId} className="hint-text">
                    {linkedCustomPlay
                      ? `Linked recording: ${linkedCustomPlay.recordingLabel || linkedCustomPlay.name}`
                      : 'Choose how long this meditation segment should run.'}
                  </small>
                )}
              </label>

              <div className="playlist-item-controls">
                <button
                  type="button"
                  className="secondary compact-control"
                  onClick={() => onUpdateDraft({ ...draft, items: movePlaylistDraftItem(draft.items, index, -1) })}
                  disabled={controlsDisabled || index === 0}
                  aria-label={`Move item ${index + 1} up`}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="secondary compact-control"
                  onClick={() => onUpdateDraft({ ...draft, items: movePlaylistDraftItem(draft.items, index, 1) })}
                  disabled={controlsDisabled || index === draft.items.length - 1}
                  aria-label={`Move item ${index + 1} down`}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="secondary compact-control"
                  onClick={() => onRemoveDraftItem(item.id)}
                  disabled={controlsDisabled}
                  aria-label={`Remove item ${index + 1}`}
                  title="Remove item"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="section-subtitle">
        Derived meditation time: {computePlaylistTotalDurationMinutes(draft.items)} min
        {derivedGapSeconds > 0 ? ` · gaps: ${derivedGapSeconds} sec` : ''}
      </p>
      <p className="section-subtitle">Derived total runtime: {formatDurationLabel(derivedTotalSeconds)}</p>

      <div className="timer-actions">
        <button type="submit" disabled={controlsDisabled}>
          {editId ? 'Update Playlist' : 'Create Playlist'}
        </button>
        {editId ? (
          <button type="button" className="secondary" onClick={onCancelEdit} disabled={controlsDisabled}>
            Cancel Edit
          </button>
        ) : null}
      </div>
    </form>
  );
}
