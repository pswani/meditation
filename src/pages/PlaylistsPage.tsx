import { useNavigate } from 'react-router-dom';
import PlaylistManager from '../features/playlists/PlaylistManager';
import { useTimer } from '../features/timer/useTimer';

export default function PlaylistsPage() {
  const navigate = useNavigate();
  const { activePlaylistRun, playlistRunOutcome, clearPlaylistRunOutcome } = useTimer();

  return (
    <section className="page-card playlist-screen">
      <h2 className="page-title">Playlists</h2>
      <p className="page-description">Create, order, and run playlist sequences with automatic session log entries.</p>

      {activePlaylistRun ? (
        <div className="status-banner">
          <p>
            Playlist run active: {activePlaylistRun.playlistName} · item {activePlaylistRun.currentIndex + 1}/
            {activePlaylistRun.items.length}
          </p>
          <button type="button" className="link-button" onClick={() => navigate('/practice/playlists/active')}>
            Open Playlist Run
          </button>
        </div>
      ) : null}

      {playlistRunOutcome ? (
        <div className={`status-banner ${playlistRunOutcome.status === 'completed' ? 'ok' : 'warn'}`}>
          <p>
            Last playlist run {playlistRunOutcome.status} with {playlistRunOutcome.completedItems}/
            {playlistRunOutcome.totalItems} items completed.
          </p>
          <button type="button" className="link-button" onClick={clearPlaylistRunOutcome}>
            Dismiss
          </button>
        </div>
      ) : null}

      <PlaylistManager />
    </section>
  );
}
