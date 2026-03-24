import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../features/timer/useTimer';
import type { CustomPlay } from '../types/customPlay';
import type { PlaylistRunStartResult } from '../types/playlist';
import { formatDurationLabel } from '../utils/sessionLog';
import { deriveTodayActivitySummary, selectRecentSessionLogs } from '../utils/home';

function playlistStartBlockMessage(result: PlaylistRunStartResult): string {
  if (!result.reason) {
    return 'Unable to start playlist run right now.';
  }

  const reasonToMessage: Record<NonNullable<PlaylistRunStartResult['reason']>, string> = {
    'timer session active': 'Finish or end the active timer session before starting a playlist run.',
    'playlist run active': 'A playlist run is already active. Open it to continue.',
    'playlist not found': 'That playlist is no longer available.',
    'playlist has no items': 'Add at least one item before starting this playlist run.',
  };

  return reasonToMessage[result.reason];
}

export default function HomePage() {
  const navigate = useNavigate();
  const {
    settings,
    sessionLogs,
    customPlays,
    playlists,
    activeSession,
    activePlaylistRun,
    startSession,
    setSettings,
    startPlaylistRun,
  } = useTimer();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const todaySummary = useMemo(() => deriveTodayActivitySummary(sessionLogs), [sessionLogs]);
  const recentLogs = useMemo(() => selectRecentSessionLogs(sessionLogs, 5), [sessionLogs]);
  const favoriteCustomPlays = useMemo(() => customPlays.filter((entry) => entry.favorite).slice(0, 3), [customPlays]);
  const favoritePlaylists = useMemo(() => playlists.filter((entry) => entry.favorite).slice(0, 3), [playlists]);

  function quickStart() {
    if (activeSession) {
      navigate('/practice/active');
      return;
    }

    if (activePlaylistRun) {
      navigate('/practice/playlists/active');
      return;
    }

    const started = startSession();
    if (started) {
      navigate('/practice/active');
      return;
    }

    setFeedbackMessage('Timer defaults need attention before quick start. Open Practice to review settings.');
    navigate('/practice');
  }

  function applyCustomPlayShortcut(play: CustomPlay) {
    setSettings({
      ...settings,
      durationMinutes: play.durationMinutes,
      meditationType: play.meditationType,
    });
    setFeedbackMessage(`Loaded ${play.name} into timer setup.`);
    navigate('/practice');
  }

  function runFavoritePlaylist(playlistId: string) {
    if (activePlaylistRun?.playlistId === playlistId) {
      navigate('/practice/playlists/active');
      return;
    }

    const result = startPlaylistRun(playlistId);
    if (result.started) {
      setFeedbackMessage(null);
      navigate('/practice/playlists/active');
      return;
    }

    setFeedbackMessage(playlistStartBlockMessage(result));
  }

  return (
    <section className="page-card home-screen">
      <h2 className="page-title">Home</h2>
      <p className="page-description">Start quickly, check today’s activity, and jump back into favorite flows.</p>

      {feedbackMessage ? (
        <div className="status-banner" role="status">
          <p>{feedbackMessage}</p>
        </div>
      ) : null}

      <section className="home-panel">
        <h3 className="section-title">Quick Start</h3>
        <p className="section-subtitle">
          Default timer: {settings.durationMinutes} min · {settings.meditationType || 'select meditation type'}
        </p>
        <div className="timer-actions">
          <button type="button" onClick={quickStart}>
            {activeSession ? 'Resume Active Timer' : activePlaylistRun ? 'Resume Playlist Run' : 'Start Timer Now'}
          </button>
          <button type="button" className="secondary" onClick={() => navigate('/practice')}>
            Open Practice
          </button>
        </div>
      </section>

      <section className="home-panel">
        <h3 className="section-title">Today</h3>
        {todaySummary.sessionLogCount === 0 ? (
          <div className="empty-state">
            <p>No session log entries yet today.</p>
            <p>Start a timer session or add a manual log in History.</p>
          </div>
        ) : (
          <div className="home-summary-grid">
            <article className="summary-card">
              <p className="summary-label">Session logs</p>
              <p className="summary-value">{todaySummary.sessionLogCount}</p>
            </article>
            <article className="summary-card">
              <p className="summary-label">Completed duration</p>
              <p className="summary-value">{formatDurationLabel(todaySummary.totalDurationSeconds)}</p>
            </article>
            <article className="summary-card">
              <p className="summary-label">Completed vs ended early</p>
              <p className="summary-value">
                {todaySummary.completedCount} / {todaySummary.endedEarlyCount}
              </p>
            </article>
          </div>
        )}
      </section>

      <section className="home-panel">
        <div className="history-row">
          <h3 className="section-title">Recent Activity</h3>
          <button type="button" className="link-button" onClick={() => navigate('/history')}>
            View History
          </button>
        </div>
        {recentLogs.length === 0 ? (
          <div className="empty-state">
            <p>No recent session log entries yet.</p>
            <p>Practice sessions and manual logs will appear here.</p>
          </div>
        ) : (
          <ul className="home-recent-list">
            {recentLogs.map((entry) => (
              <li key={entry.id} className="home-recent-item">
                <strong>{entry.meditationType}</strong>
                <p className="section-subtitle">{new Date(entry.endedAt).toLocaleString()}</p>
                <p className="section-subtitle">
                  {formatDurationLabel(entry.completedDurationSeconds)} · {entry.status} · {entry.source}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="home-panel">
        <h3 className="section-title">Favorites</h3>
        {favoriteCustomPlays.length === 0 && favoritePlaylists.length === 0 ? (
          <div className="empty-state">
            <p>No favorites yet.</p>
            <p>Mark a custom play or playlist as favorite in Practice.</p>
          </div>
        ) : (
          <div className="home-favorites-grid">
            <div className="home-shortcuts">
              <strong>Favorite custom play</strong>
              {favoriteCustomPlays.length === 0 ? (
                <p className="section-subtitle">No favorite custom play yet.</p>
              ) : (
                <ul className="home-shortcut-list">
                  {favoriteCustomPlays.map((play) => (
                    <li key={play.id} className="home-shortcut-item">
                      <span>
                        {play.name} · {play.durationMinutes} min
                      </span>
                      <button type="button" className="secondary" onClick={() => applyCustomPlayShortcut(play)}>
                        Use
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="home-shortcuts">
              <strong>Favorite playlist</strong>
              {favoritePlaylists.length === 0 ? (
                <p className="section-subtitle">No favorite playlist yet.</p>
              ) : (
                <ul className="home-shortcut-list">
                  {favoritePlaylists.map((playlist) => (
                    <li key={playlist.id} className="home-shortcut-item">
                      <span>{playlist.name}</span>
                      <button type="button" className="secondary" onClick={() => runFavoritePlaylist(playlist.id)}>
                        Run
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="home-panel">
        <h3 className="section-title">Next Actions</h3>
        <div className="timer-actions">
          <button type="button" className="secondary" onClick={() => navigate('/practice')}>
            Practice
          </button>
          <button type="button" className="secondary" onClick={() => navigate('/history')}>
            History
          </button>
          <button type="button" className="secondary" onClick={() => navigate('/goals')}>
            Sankalpa
          </button>
          <button type="button" className="secondary" onClick={() => navigate('/settings')}>
            Settings
          </button>
        </div>
      </section>
    </section>
  );
}
