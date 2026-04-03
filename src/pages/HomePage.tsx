import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSankalpaProgress } from '../features/sankalpa/useSankalpaProgress';
import { useTimer } from '../features/timer/useTimer';
import type { CustomPlay } from '../types/customPlay';
import type { LastUsedMeditation } from '../types/home';
import type { PlaylistRunStartResult } from '../types/playlist';
import { applyCustomPlayToTimerSettings } from '../utils/customPlay';
import { formatDurationLabel } from '../utils/sessionLog';
import { getSankalpaGoalTypeLabel } from '../utils/sankalpa';
import { deriveTodayActivitySummary, selectRecentSessionLogs, selectTopActiveSankalpaProgress } from '../utils/home';

function playlistStartBlockMessage(result: PlaylistRunStartResult): string {
  if (!result.reason) {
    return 'Unable to start playlist run right now.';
  }

  const reasonToMessage: Record<NonNullable<PlaylistRunStartResult['reason']>, string> = {
    'playlists loading': 'Playlists are still loading from the backend. Wait a moment and try again.',
    'timer session active': 'Finish or end the active timer session before starting a playlist run.',
    'custom play run active': 'Finish the active custom play before starting a playlist run.',
    'playlist run active': 'A playlist run is already active. Open it to continue.',
    'playlist not found': 'That playlist is no longer available.',
    'playlist has no items': 'Add at least one item before starting this playlist run.',
  };

  return reasonToMessage[result.reason];
}

function describeLastUsedMeditation(lastUsedMeditation: LastUsedMeditation): string {
  if (lastUsedMeditation.kind === 'playlist') {
    return `Playlist · ${lastUsedMeditation.playlistName}`;
  }

  if (lastUsedMeditation.kind === 'custom-play') {
    return `Custom play · ${lastUsedMeditation.customPlayName}`;
  }

  const durationLabel =
    lastUsedMeditation.settings.timerMode === 'open-ended'
      ? 'Open-ended'
      : `${lastUsedMeditation.settings.durationMinutes ?? lastUsedMeditation.settings.lastFixedDurationMinutes} min`;

  return `Timer · ${durationLabel} · ${lastUsedMeditation.settings.meditationType}`;
}

function customPlayStartBlockMessage(reason?: string): string {
  const reasonToMessage: Record<string, string> = {
    'custom plays loading': 'Custom plays are still loading from the backend. Wait a moment and try again.',
    'timer session active': 'Finish or end the active timer session before starting a custom play.',
    'playlist run active': 'Finish the active playlist run before starting a custom play.',
    'custom play run active': 'A custom play is already active. Open it to continue.',
    'custom play not found': 'That custom play is no longer available.',
    'media unavailable': 'The linked media session is unavailable right now. Reconnect the custom play and try again.',
  };

  return reason ? reasonToMessage[reason] ?? 'Unable to start that custom play right now.' : 'Unable to start that custom play right now.';
}

export default function HomePage() {
  const navigate = useNavigate();
  const {
    settings,
    sessionLogs,
    customPlays,
    playlists,
    lastUsedMeditation,
    activeSession,
    activeCustomPlayRun,
    activePlaylistRun,
    startSession,
    startCustomPlayRun,
    startPlaylistRun,
    isSettingsLoading,
    isPlaylistsLoading,
    settingsSyncError,
  } = useTimer();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const { progressEntries: sankalpaProgressEntries, isLoading: isSankalpaLoading, syncMessage: sankalpaSyncMessage } =
    useSankalpaProgress(sessionLogs);

  const todaySummary = useMemo(() => deriveTodayActivitySummary(sessionLogs), [sessionLogs]);
  const recentLogs = useMemo(() => selectRecentSessionLogs(sessionLogs, 5), [sessionLogs]);
  const topActiveSankalpa = useMemo(() => selectTopActiveSankalpaProgress(sankalpaProgressEntries), [sankalpaProgressEntries]);
  const favoriteCustomPlays = useMemo(() => customPlays.filter((entry) => entry.favorite).slice(0, 3), [customPlays]);
  const favoritePlaylists = useMemo(() => playlists.filter((entry) => entry.favorite).slice(0, 3), [playlists]);
  const fixedDurationMinutes = settings.durationMinutes ?? settings.lastFixedDurationMinutes;

  function quickStart() {
    if (activeSession) {
      navigate('/practice/active');
      return;
    }

    if (activePlaylistRun) {
      navigate('/practice/playlists/active');
      return;
    }

    if (activeCustomPlayRun) {
      navigate('/practice/custom-plays/active');
      return;
    }

    const started = startSession();
    if (started) {
      navigate('/practice/active');
      return;
    }

    navigate('/practice', {
      state: {
        entryMessage:
          settings.timerMode === 'open-ended'
            ? 'Quick start needs valid open-ended defaults. Review meditation type and interval settings in timer setup.'
            : 'Quick start needs valid defaults. Review duration, meditation type, and any interval settings in timer setup.',
      },
    });
  }

  function startFavoriteCustomPlay(play: CustomPlay) {
    setFeedbackMessage(null);

    if (activeCustomPlayRun?.customPlayId === play.id) {
      navigate('/practice/custom-plays/active');
      return;
    }

    const result = startCustomPlayRun(play.id);
    if (result.started) {
      navigate('/practice/custom-plays/active');
      return;
    }

    navigate('/practice', {
      state: {
        entryMessage: customPlayStartBlockMessage(result.reason),
        timerPreset: applyCustomPlayToTimerSettings(settings, play),
      },
    });
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

  function startLastUsedMeditationShortcut() {
    if (!lastUsedMeditation) {
      return;
    }

    setFeedbackMessage(null);

    if (lastUsedMeditation.kind === 'playlist') {
      if (activePlaylistRun?.playlistId === lastUsedMeditation.playlistId) {
        navigate('/practice/playlists/active');
        return;
      }

      const result = startPlaylistRun(lastUsedMeditation.playlistId);
      if (result.started) {
        navigate('/practice/playlists/active');
        return;
      }

      setFeedbackMessage(playlistStartBlockMessage(result));
      return;
    }

    if (lastUsedMeditation.kind === 'custom-play') {
      if (activeCustomPlayRun?.customPlayId === lastUsedMeditation.customPlayId) {
        navigate('/practice/custom-plays/active');
        return;
      }

      const result = startCustomPlayRun(lastUsedMeditation.customPlayId);
      if (result.started) {
        navigate('/practice/custom-plays/active');
        return;
      }

      setFeedbackMessage(customPlayStartBlockMessage(result.reason));
      return;
    }

    if (activeSession) {
      navigate('/practice/active');
      return;
    }

    if (activePlaylistRun) {
      setFeedbackMessage('Finish the active playlist run before starting your last-used timer.');
      return;
    }

    const started = startSession(lastUsedMeditation.settings);
    if (started) {
      navigate('/practice/active');
      return;
    }

    navigate('/practice', {
      state: {
        entryMessage: 'Your last-used timer settings need a quick review before starting.',
        timerPreset: lastUsedMeditation.settings,
      },
    });
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
            : `Default timer: ${settings.timerMode === 'open-ended' ? 'Open-ended' : `${fixedDurationMinutes} min`} · ${
                settings.meditationType || 'select meditation type'
              }`}
        </p>
        <div className="timer-actions">
          <button type="button" onClick={quickStart} disabled={isSettingsLoading}>
            {activeSession
              ? 'Resume Active Timer'
              : activeCustomPlayRun
              ? 'Resume Custom Play'
              : activePlaylistRun
              ? 'Resume Playlist Run'
              : 'Start Timer Now'}
          </button>
          <button type="button" className="secondary" onClick={() => navigate('/practice')}>
            Open Practice
          </button>
        </div>
        {lastUsedMeditation ? (
          <>
            <p className="section-subtitle">Last used: {describeLastUsedMeditation(lastUsedMeditation)}</p>
            <div className="timer-actions">
              <button type="button" className="secondary" onClick={startLastUsedMeditationShortcut}>
                Start Last Used Meditation
              </button>
            </div>
          </>
        ) : (
          <p className="section-subtitle">Your last started timer, custom play, or playlist will appear here.</p>
        )}
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
          {isSankalpaLoading ? <p className="section-subtitle">Refreshing sankalpa progress from the backend.</p> : null}
          {sankalpaSyncMessage ? <p className="section-subtitle">{sankalpaSyncMessage}</p> : null}
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
                {entry.customPlayName ? <p className="section-subtitle">Custom play: {entry.customPlayName}</p> : null}
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
                      <button type="button" className="secondary" onClick={() => startFavoriteCustomPlay(play)}>
                        Start
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
