import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../features/timer/useTimer';
import type { CustomPlay } from '../types/customPlay';
import type { PlaylistRunStartResult } from '../types/playlist';
import { applyCustomPlayToTimerSettings } from '../utils/customPlay';
import { formatDurationLabel } from '../utils/sessionLog';
import { getSankalpaGoalTypeLabel } from '../utils/sankalpa';
import { listSankalpasFromApi } from '../utils/sankalpaApi';
import { deriveTodayActivitySummary, selectRecentSessionLogs, selectTopActiveSankalpaProgress } from '../utils/home';

function playlistStartBlockMessage(result: PlaylistRunStartResult): string {
  if (!result.reason) {
    return 'Unable to start playlist run right now.';
  }

  const reasonToMessage: Record<NonNullable<PlaylistRunStartResult['reason']>, string> = {
    'playlists loading': 'Playlists are still loading from the backend. Wait a moment and try again.',
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
    isSettingsLoading,
    isPlaylistsLoading,
    settingsSyncError,
  } = useTimer();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const sankalpas = useMemo(() => listSankalpasFromApi(), []);

  const todaySummary = useMemo(() => deriveTodayActivitySummary(sessionLogs), [sessionLogs]);
  const recentLogs = useMemo(() => selectRecentSessionLogs(sessionLogs, 5), [sessionLogs]);
  const topActiveSankalpa = useMemo(
    () => selectTopActiveSankalpaProgress(sankalpas, sessionLogs),
    [sankalpas, sessionLogs]
  );
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

    navigate('/practice', {
      state: {
        entryMessage: 'Quick start needs valid defaults. Review duration and meditation type in timer setup.',
      },
    });
  }

  function applyCustomPlayShortcut(play: CustomPlay) {
    setSettings(applyCustomPlayToTimerSettings(settings, play));
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
          <button type="button" className="link-button" onClick={() => setFeedbackMessage(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      {isSettingsLoading ? (
        <div className="status-banner" role="status">
          <p>Loading timer defaults from the backend.</p>
        </div>
      ) : null}

      {settingsSyncError ? (
        <div className="status-banner warn" role="status">
          <p>{settingsSyncError}</p>
        </div>
      ) : null}

      <section className="home-panel">
        <h3 className="section-title">Quick Start</h3>
        <p className="section-subtitle">
          {isSettingsLoading
            ? 'Loading timer defaults...'
            : `Default timer: ${settings.durationMinutes} min · ${settings.meditationType || 'select meditation type'}`}
        </p>
        <div className="timer-actions">
          <button type="button" onClick={quickStart} disabled={isSettingsLoading}>
            {activeSession ? 'Resume Active Timer' : activePlaylistRun ? 'Resume Playlist Run' : 'Start Timer Now'}
          </button>
          <button type="button" className="secondary" onClick={() => navigate('/practice')}>
            Open Practice
          </button>
        </div>
      </section>

      <div className="home-layout-grid">
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
          <div className="panel-header">
            <h3 className="section-title">Sankalpa Snapshot</h3>
            <button type="button" className="link-button" onClick={() => navigate('/goals')}>
              Open Sankalpa
            </button>
          </div>
          {topActiveSankalpa ? (
            <>
              <div className="history-row">
                <strong>{getSankalpaGoalTypeLabel(topActiveSankalpa.goal.goalType)}</strong>
                <span className="pill active">{topActiveSankalpa.status}</span>
              </div>
              <p className="section-subtitle">
                Deadline: {new Date(topActiveSankalpa.deadlineAt).toLocaleDateString()} · Target:{' '}
                {topActiveSankalpa.goal.targetValue}{' '}
                {topActiveSankalpa.goal.goalType === 'duration-based' ? 'min' : 'session logs'}
              </p>
              <div className="sankalpa-progress-track" aria-hidden="true">
                <span
                  className="sankalpa-progress-fill"
                  style={{ width: `${Math.min(100, topActiveSankalpa.progressRatio * 100)}%` }}
                />
              </div>
              <p className="section-subtitle">
                Progress:{' '}
                {topActiveSankalpa.goal.goalType === 'duration-based'
                  ? `${formatDurationLabel(topActiveSankalpa.matchedDurationSeconds)} / ${formatDurationLabel(
                      topActiveSankalpa.targetDurationSeconds
                    )}`
                  : `${topActiveSankalpa.matchedSessionCount} / ${topActiveSankalpa.targetSessionCount} session logs`}
              </p>
            </>
          ) : (
            <div className="empty-state">
              <p>No active sankalpa right now.</p>
              <p>Create one in Sankalpa to track your current intent.</p>
            </div>
          )}
        </section>
      </div>

      <section className="home-panel">
        <div className="panel-header">
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
                      <span className="home-shortcut-label">
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
                isPlaylistsLoading ? (
                  <p className="section-subtitle">Loading favorite playlists from the backend.</p>
                ) : (
                  <p className="section-subtitle">No favorite playlist yet.</p>
                )
              ) : (
                <>
                  {isPlaylistsLoading ? (
                    <p className="section-subtitle">Loading favorite playlists from the backend.</p>
                  ) : null}
                  <ul className="home-shortcut-list">
                    {favoritePlaylists.map((playlist) => (
                      <li key={playlist.id} className="home-shortcut-item">
                        <span className="home-shortcut-label">{playlist.name}</span>
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => runFavoritePlaylist(playlist.id)}
                          disabled={isPlaylistsLoading}
                        >
                          Run
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
      </section>

    </section>
  );
}
