import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaylistCollection } from './PlaylistCollection';
import { PlaylistForm } from './PlaylistForm';
import { playlistRunFeedbackMessage } from './playlistManagerHelpers';
import type { PlaylistDraft, PlaylistValidationResult } from '../../types/playlist';
import {
  createInitialPlaylistDraft,
  createPlaylistDraftItem,
  pruneResolvedPlaylistErrors,
} from '../../utils/playlist';
import { useTimer } from '../timer/useTimer';

const initialErrors: PlaylistValidationResult['errors'] = {
  itemErrors: {},
};
const playlistFormId = 'playlist-form';

export default function PlaylistManager() {
  const navigate = useNavigate();
  const {
    playlists,
    customPlays,
    activePlaylistRun,
    savePlaylist,
    deletePlaylist,
    toggleFavoritePlaylist,
    startPlaylistRun,
    isPlaylistsLoading,
    isPlaylistSyncing,
    playlistSyncError,
    isCustomPlaysLoading,
  } = useTimer();
  const [draft, setDraft] = useState<PlaylistDraft>(() => createInitialPlaylistDraft());
  const [errors, setErrors] = useState<PlaylistValidationResult['errors']>(initialErrors);
  const [editId, setEditId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [playlistFeedback, setPlaylistFeedback] = useState<string | null>(null);

  const controlsDisabled = isPlaylistsLoading || isPlaylistSyncing;

  function updateDraft(next: PlaylistDraft) {
    setErrors((current) => pruneResolvedPlaylistErrors(next, current));
    setDraft(next);
  }

  function updateDraftItem(itemId: string, updater: (item: PlaylistDraft['items'][number]) => PlaylistDraft['items'][number]) {
    updateDraft({
      ...draft,
      items: draft.items.map((item) => (item.id === itemId ? updater(item) : item)),
    });
  }

  function syncDraftItemFromCustomPlay(itemId: string, customPlayId: string) {
    const selectedCustomPlay = customPlays.find((entry) => entry.id === customPlayId);
    updateDraftItem(itemId, (item) => {
      if (!selectedCustomPlay) {
        return {
          ...item,
          customPlayId: '',
          title: item.title || item.meditationType || '',
        };
      }

      return {
        ...item,
        customPlayId: selectedCustomPlay.id,
        title: selectedCustomPlay.name,
        meditationType: selectedCustomPlay.meditationType,
        durationMinutes: selectedCustomPlay.durationMinutes,
      };
    });
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
      smallGapSeconds: match.smallGapSeconds,
      items: match.items.map((item) => ({
        id: item.id,
        title: item.title,
        meditationType: item.meditationType,
        durationMinutes: item.durationMinutes,
        customPlayId: item.customPlayId ?? '',
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

  function focusPlaylistForm() {
    document.getElementById(playlistFormId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    setPlaylistFeedback(playlistRunFeedbackMessage(result));
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
      <p className="section-subtitle">Create ordered playlist flows, optionally link recordings, and run them in sequence.</p>

      {isPlaylistsLoading ? (
        <div className="status-banner" role="status">
          <p>Loading playlists.</p>
        </div>
      ) : null}

      {isPlaylistSyncing ? (
        <div className="status-banner" role="status">
          <p>Saving playlists.</p>
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

      <div className="playlist-manager-layout">
        <div id={playlistFormId}>
          <PlaylistForm
          draft={draft}
          errors={errors}
          editId={editId}
          controlsDisabled={controlsDisabled}
          customPlays={customPlays}
          isCustomPlaysLoading={isCustomPlaysLoading}
          onSubmit={onSubmit}
          onCancelEdit={cancelEdit}
          onUpdateDraft={updateDraft}
          onUpdateDraftItem={updateDraftItem}
          onSyncDraftItemFromCustomPlay={syncDraftItemFromCustomPlay}
          onRemoveDraftItem={removeDraftItem}
          onClearFeedback={() => setPlaylistFeedback(null)}
          />
        </div>

        <PlaylistCollection
          playlists={playlists}
          activePlaylistRun={activePlaylistRun}
          pendingDeleteId={pendingDeleteId}
          controlsDisabled={controlsDisabled}
          onRunPlaylist={runPlaylist}
          onStartEdit={startEdit}
          onToggleFavorite={toggleFavoritePlaylist}
          onRequestDelete={setPendingDeleteId}
          onCancelDelete={() => setPendingDeleteId(null)}
          onConfirmDelete={confirmDelete}
          onCreatePlaylist={() => {
            cancelEdit();
            focusPlaylistForm();
          }}
        />
      </div>
    </section>
  );
}
