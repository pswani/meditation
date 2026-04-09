import { useNavigate } from 'react-router-dom';
import type { ActivePlaylistRun, Playlist } from '../../types/playlist';
import { computePlaylistGapTotalSeconds, computePlaylistTotalDurationMinutes } from '../../utils/playlist';

interface PlaylistCollectionProps {
  readonly playlists: readonly Playlist[];
  readonly activePlaylistRun: ActivePlaylistRun | null;
  readonly pendingDeleteId: string | null;
  readonly controlsDisabled: boolean;
  readonly onRunPlaylist: (playlistId: string) => void;
  readonly onStartEdit: (playlistId: string) => void;
  readonly onToggleFavorite: (playlistId: string) => Promise<unknown>;
  readonly onRequestDelete: (playlistId: string) => void;
  readonly onCancelDelete: () => void;
  readonly onConfirmDelete: (playlistId: string) => Promise<unknown>;
}

export function PlaylistCollection({
  playlists,
  activePlaylistRun,
  pendingDeleteId,
  controlsDisabled,
  onRunPlaylist,
  onStartEdit,
  onToggleFavorite,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: PlaylistCollectionProps) {
  const navigate = useNavigate();

  return (
    <div className="playlist-collection" aria-live="polite">
      {playlists.length === 0 ? (
        <div className="empty-state">
          <p>No playlist entries yet.</p>
          <p>Create a playlist to run multiple meditation segments or linked recordings in order.</p>
        </div>
      ) : (
        <ul className="playlist-list">
          {playlists.map((playlist) => {
            const isActivePlaylist = activePlaylistRun?.playlistId === playlist.id;
            const totalGapSeconds = computePlaylistGapTotalSeconds(playlist.items.length, playlist.smallGapSeconds);

            return (
              <li key={playlist.id} className="playlist-item-card">
                <div className="history-row">
                  <div>
                    <strong>{playlist.name}</strong>
                    <p className="history-time">
                      {playlist.items.length} items · {computePlaylistTotalDurationMinutes(playlist.items)} min meditation
                      {totalGapSeconds > 0 ? ` · ${totalGapSeconds} sec gaps` : ''}
                    </p>
                  </div>
                  {playlist.favorite ? <span className="pill ok">favorite</span> : null}
                </div>

                <div className="playlist-inline-items">
                  {playlist.items.map((item, index) => (
                    <span key={item.id}>
                      {index + 1}. {item.title} ({item.durationMinutes}m)
                      {item.customPlayId ? ' · recording' : ''}
                    </span>
                  ))}
                </div>

                {isActivePlaylist ? <p className="section-subtitle">Active run in progress for this playlist.</p> : null}

                <div className="timer-actions">
                  {isActivePlaylist ? (
                    <button type="button" onClick={() => navigate('/practice/playlists/active')}>
                      Open Active Run
                    </button>
                  ) : (
                    <button type="button" onClick={() => onRunPlaylist(playlist.id)} disabled={controlsDisabled}>
                      Run Playlist
                    </button>
                  )}
                  <button type="button" className="secondary" onClick={() => onStartEdit(playlist.id)} disabled={controlsDisabled}>
                    Edit
                  </button>
                  <button type="button" className="secondary" onClick={() => void onToggleFavorite(playlist.id)} disabled={controlsDisabled}>
                    {playlist.favorite ? 'Unfavorite' : 'Favorite'}
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onRequestDelete(playlist.id)}
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
                      <button type="button" className="secondary" onClick={onCancelDelete} disabled={controlsDisabled}>
                        Keep Playlist
                      </button>
                      <button type="button" onClick={() => void onConfirmDelete(playlist.id)} disabled={controlsDisabled}>
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
    </div>
  );
}
