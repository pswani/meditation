import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlaylistDraft, PlaylistValidationResult } from '../../types/playlist';
import {
  computePlaylistTotalDurationMinutes,
  createInitialPlaylistDraft,
  createPlaylistDraftItem,
  movePlaylistDraftItem,
} from '../../utils/playlist';
import { meditationTypes } from '../timer/constants';
import { useTimer } from '../timer/useTimer';

const initialErrors: PlaylistValidationResult['errors'] = {
  itemErrors: {},
};

export default function PlaylistManager() {
  const navigate = useNavigate();
  const {
    playlists,
    activePlaylistRun,
    savePlaylist,
    deletePlaylist,
    toggleFavoritePlaylist,
    startPlaylistRun,
    isPlaylistsLoading,
    isPlaylistSyncing,
    playlistSyncError,
  } = useTimer();
  const [draft, setDraft] = useState<PlaylistDraft>(() => createInitialPlaylistDraft());
  const [errors, setErrors] = useState<PlaylistValidationResult['errors']>(initialErrors);
  const [editId, setEditId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [playlistFeedback, setPlaylistFeedback] = useState<string | null>(null);

  const controlsDisabled = isPlaylistsLoading || isPlaylistSyncing;

  function updateDraft(next: PlaylistDraft) {
    setDraft(next);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const playlistName = draft.name.trim() || 'Playlist';
    const feedbackMessage = editId ? `Playlist "${playlistName}" updated.` : `Playlist "${playlistName}" saved.`;
    const result = await savePlaylist(draft, editId ?? undefined);
    setErrors(result.errors);

    if (result.isValid && result.persisted) {
      setDraft(createInitialPlaylistDraft());
      setEditId(null);
      setPendingDeleteId(null);
      setPlaylistFeedback(feedbackMessage);
    } else if (!result.isValid) {
      setPlaylistFeedback(null);
    }
  }

  function startEdit(playlistId: string) {
    const match = playlists.find((playlist) => playlist.id === playlistId);
    if (!match) {
      return;
    }

    setEditId(match.id);
    setErrors(initialErrors);
    setPlaylistFeedback(null);
    setDraft({
      name: match.name,
      items: match.items.map((item) => ({
        id: item.id,
        meditationType: item.meditationType,
        durationMinutes: item.durationMinutes,
      })),
    });
  }

  function cancelEdit() {
    setDraft(createInitialPlaylistDraft());
    setEditId(null);
    setErrors(initialErrors);
    setPlaylistFeedback(null);
  }

  function removeDraftItem(itemId: string) {
    const nextItems = draft.items.filter((item) => item.id !== itemId);
    updateDraft({
      ...draft,
      items: nextItems.length > 0 ? nextItems : [createPlaylistDraftItem()],
    });
  }

  function runPlaylist(playlistId: string) {
    if (activePlaylistRun?.playlistId === playlistId) {
      setPlaylistFeedback(null);
      navigate('/practice/playlists/active');
      return;
    }

    const result = startPlaylistRun(playlistId);
    if (result.started) {
      setPlaylistFeedback(null);
      navigate('/practice/playlists/active');
      return;
    }

    const reasonToMessage: Record<NonNullable<typeof result.reason>, string> = {
      'playlists loading': 'Playlists are still loading from the backend. Wait a moment and try again.',
      'timer session active': 'Finish or end the active timer session before starting a playlist run.',
      'playlist run active': 'A playlist run is already active. Open it to continue before starting another.',
      'playlist not found': 'That playlist is no longer available. Refresh and try again.',
      'playlist has no items': 'Add at least one item before starting this playlist run.',
    };

    if (result.reason) {
      setPlaylistFeedback(reasonToMessage[result.reason]);
    }
  }

  async function confirmDelete(playlistId: string) {
    const deleteResult = await deletePlaylist(playlistId);
    if (!deleteResult.deleted) {
      if (deleteResult.reason === 'playlist run active') {
        setPlaylistFeedback('This playlist is currently running. End the run before deleting it.');
        return;
      }

      if (deleteResult.persistenceError) {
        setPlaylistFeedback(null);
        return;
      }

      setPlaylistFeedback('Playlist deletion failed. Review the warning above and try again.');
      return;
    }

    setPendingDeleteId(null);
    setPlaylistFeedback(null);

    if (editId === playlistId) {
      cancelEdit();
    }
  }

  return (
    <section className="playlist-panel">
      <h3 className="section-title">Playlists</h3>
      <p className="section-subtitle">Create ordered playlist flows and run them in sequence.</p>

      {isPlaylistsLoading ? (
        <div className="status-banner" role="status">
          <p>Loading playlists from the backend.</p>
        </div>
      ) : null}

      {isPlaylistSyncing ? (
        <div className="status-banner" role="status">
          <p>Saving playlists to the backend.</p>
        </div>
      ) : null}

      {playlistSyncError ? (
        <div className="status-banner warn" role="status">
          <p>{playlistSyncError}</p>
        </div>
      ) : null}

      {playlistFeedback ? (
        <div
          className={`status-banner ${playlistFeedback.includes('saved') || playlistFeedback.includes('updated') ? 'ok' : 'warn'}`}
          role="status"
        >
          <p>{playlistFeedback}</p>
        </div>
      ) : null}

      <form className="playlist-form" onSubmit={onSubmit}>
        <label>
          <span>Playlist name</span>
          <input
            disabled={controlsDisabled}
            value={draft.name}
            onChange={(event) => {
              setPlaylistFeedback(null);
              updateDraft({ ...draft, name: event.target.value });
            }}
            placeholder="Morning Sequence"
          />
          {errors.name ? <small className="error-text">{errors.name}</small> : null}
        </label>

        <div className="playlist-item-builder">
          <div className="history-row">
            <strong>Playlist items</strong>
            <button
              type="button"
              className="secondary"
              disabled={controlsDisabled}
              onClick={() =>
                updateDraft({
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
            return (
              <div key={item.id} className="playlist-item-row">
                <label>
                  <span>Item {index + 1} meditation type</span>
                  <select
                    disabled={controlsDisabled}
                    value={item.meditationType}
                    onChange={(event) => {
                      setPlaylistFeedback(null);
                      updateDraft({
                        ...draft,
                        items: draft.items.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, meditationType: event.target.value as PlaylistDraft['items'][number]['meditationType'] }
                            : entry
                        ),
                      });
                    }}
                  >
                    <option value="">Select meditation type</option>
                    {meditationTypes.map((meditationType) => (
                      <option key={meditationType} value={meditationType}>
                        {meditationType}
                      </option>
                    ))}
                  </select>
                  {itemErrors?.meditationType ? <small className="error-text">{itemErrors.meditationType}</small> : null}
                </label>

                <label>
                  <span>Item {index + 1} duration (minutes)</span>
                  <input
                    type="number"
                    min={1}
                    disabled={controlsDisabled}
                    value={item.durationMinutes}
                    onChange={(event) => {
                      setPlaylistFeedback(null);
                      updateDraft({
                        ...draft,
                        items: draft.items.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, durationMinutes: Number(event.target.value) }
                            : entry
                        ),
                      });
                    }}
                  />
                  {itemErrors?.durationMinutes ? <small className="error-text">{itemErrors.durationMinutes}</small> : null}
                </label>

                <div className="playlist-item-controls">
                  <button
                    type="button"
                    className="secondary compact-control"
                    onClick={() =>
                      updateDraft({
                        ...draft,
                        items: movePlaylistDraftItem(draft.items, index, -1),
                      })
                    }
                    disabled={controlsDisabled || index === 0}
                    aria-label={`Move item ${index + 1} up`}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="secondary compact-control"
                    onClick={() =>
                      updateDraft({
                        ...draft,
                        items: movePlaylistDraftItem(draft.items, index, 1),
                      })
                    }
                    disabled={controlsDisabled || index === draft.items.length - 1}
                    aria-label={`Move item ${index + 1} down`}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="secondary compact-control"
                    onClick={() => removeDraftItem(item.id)}
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
          Derived total duration: {computePlaylistTotalDurationMinutes(draft.items)} min
        </p>

        <div className="timer-actions">
          <button type="submit" disabled={controlsDisabled}>
            {editId ? 'Update Playlist' : 'Create Playlist'}
          </button>
          {editId ? (
            <button type="button" className="secondary" onClick={cancelEdit} disabled={controlsDisabled}>
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <p>No playlist entries yet.</p>
          <p>Create a playlist to run multiple meditation type segments in order.</p>
        </div>
      ) : (
        <ul className="playlist-list">
          {playlists.map((playlist) => {
            const isActivePlaylist = activePlaylistRun?.playlistId === playlist.id;

            return (
              <li key={playlist.id} className="playlist-item-card">
                <div className="history-row">
                  <div>
                    <strong>{playlist.name}</strong>
                    <p className="history-time">
                      {playlist.items.length} items · {computePlaylistTotalDurationMinutes(playlist.items)} min total
                    </p>
                  </div>
                  {playlist.favorite ? <span className="pill ok">favorite</span> : null}
                </div>

                <div className="playlist-inline-items">
                  {playlist.items.map((item, index) => (
                    <span key={item.id}>
                      {index + 1}. {item.meditationType} ({item.durationMinutes}m)
                    </span>
                  ))}
                </div>

                {isActivePlaylist ? (
                  <p className="section-subtitle">Active run in progress for this playlist.</p>
                ) : null}

                <div className="timer-actions">
                  {isActivePlaylist ? (
                    <button type="button" onClick={() => navigate('/practice/playlists/active')}>
                      Open Active Run
                    </button>
                  ) : (
                    <button type="button" onClick={() => runPlaylist(playlist.id)} disabled={controlsDisabled}>
                      Run Playlist
                    </button>
                  )}
                  <button type="button" className="secondary" onClick={() => startEdit(playlist.id)} disabled={controlsDisabled}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => void toggleFavoritePlaylist(playlist.id)}
                    disabled={controlsDisabled}
                  >
                    {playlist.favorite ? 'Unfavorite' : 'Favorite'}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setPendingDeleteId(playlist.id)}
                    disabled={controlsDisabled || isActivePlaylist}
                    title={isActivePlaylist ? 'Cannot delete an actively running playlist' : 'Delete playlist'}
                  >
                    Delete
                  </button>
                </div>

                {pendingDeleteId === playlist.id ? (
                  <div className="confirm-sheet" role="dialog" aria-label={`Delete playlist ${playlist.name} confirmation`}>
                    <p>Delete playlist "{playlist.name}"?</p>
                    <div className="timer-actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setPendingDeleteId(null)}
                        disabled={controlsDisabled}
                      >
                        Keep Playlist
                      </button>
                      <button type="button" onClick={() => void confirmDelete(playlist.id)} disabled={controlsDisabled}>
                        Delete Playlist
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
