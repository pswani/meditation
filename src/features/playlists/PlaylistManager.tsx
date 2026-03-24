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
  } = useTimer();
  const [draft, setDraft] = useState<PlaylistDraft>(() => createInitialPlaylistDraft());
  const [errors, setErrors] = useState<PlaylistValidationResult['errors']>(initialErrors);
  const [editId, setEditId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function updateDraft(next: PlaylistDraft) {
    setDraft(next);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = savePlaylist(draft, editId ?? undefined);
    setErrors(result.errors);

    if (result.isValid) {
      setDraft(createInitialPlaylistDraft());
      setEditId(null);
    }
  }

  function startEdit(playlistId: string) {
    const match = playlists.find((playlist) => playlist.id === playlistId);
    if (!match) {
      return;
    }

    setEditId(match.id);
    setErrors(initialErrors);
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
  }

  function removeDraftItem(itemId: string) {
    const nextItems = draft.items.filter((item) => item.id !== itemId);
    updateDraft({
      ...draft,
      items: nextItems.length > 0 ? nextItems : [createPlaylistDraftItem()],
    });
  }

  function runPlaylist(playlistId: string) {
    const started = startPlaylistRun(playlistId);
    if (started) {
      navigate('/practice/playlists/active');
    }
  }

  return (
    <section className="playlist-panel">
      <h3 className="section-title">Playlists</h3>
      <p className="section-subtitle">Create ordered playlist flows and run them in sequence.</p>

      <form className="playlist-form" onSubmit={onSubmit}>
        <label>
          <span>Playlist name</span>
          <input
            value={draft.name}
            onChange={(event) => updateDraft({ ...draft, name: event.target.value })}
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
                    value={item.meditationType}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        items: draft.items.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, meditationType: event.target.value as PlaylistDraft['items'][number]['meditationType'] }
                            : entry
                        ),
                      })
                    }
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
                    value={item.durationMinutes}
                    onChange={(event) =>
                      updateDraft({
                        ...draft,
                        items: draft.items.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, durationMinutes: Number(event.target.value) }
                            : entry
                        ),
                      })
                    }
                  />
                  {itemErrors?.durationMinutes ? <small className="error-text">{itemErrors.durationMinutes}</small> : null}
                </label>

                <div className="playlist-item-controls">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      updateDraft({
                        ...draft,
                        items: movePlaylistDraftItem(draft.items, index, -1),
                      })
                    }
                    disabled={index === 0}
                  >
                    Move Up
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      updateDraft({
                        ...draft,
                        items: movePlaylistDraftItem(draft.items, index, 1),
                      })
                    }
                    disabled={index === draft.items.length - 1}
                  >
                    Move Down
                  </button>
                  <button type="button" className="secondary" onClick={() => removeDraftItem(item.id)}>
                    Remove
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
          <button type="submit">{editId ? 'Update Playlist' : 'Create Playlist'}</button>
          {editId ? (
            <button type="button" className="secondary" onClick={cancelEdit}>
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
          {playlists.map((playlist) => (
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

              {activePlaylistRun?.playlistId === playlist.id ? (
                <p className="section-subtitle">Active run in progress for this playlist.</p>
              ) : null}

              <div className="timer-actions">
                <button type="button" onClick={() => runPlaylist(playlist.id)}>
                  Run Playlist
                </button>
                <button type="button" className="secondary" onClick={() => startEdit(playlist.id)}>
                  Edit
                </button>
                <button type="button" className="secondary" onClick={() => toggleFavoritePlaylist(playlist.id)}>
                  {playlist.favorite ? 'Unfavorite' : 'Favorite'}
                </button>
                <button type="button" className="secondary" onClick={() => setPendingDeleteId(playlist.id)}>
                  Delete
                </button>
              </div>

              {pendingDeleteId === playlist.id ? (
                <div className="confirm-sheet" role="dialog" aria-label={`Delete playlist ${playlist.name} confirmation`}>
                  <p>Delete playlist "{playlist.name}"?</p>
                  <div className="timer-actions">
                    <button type="button" className="secondary" onClick={() => setPendingDeleteId(null)}>
                      Keep Playlist
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deletePlaylist(playlist.id);
                        setPendingDeleteId(null);
                      }}
                    >
                      Delete Playlist
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
