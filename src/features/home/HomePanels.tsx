import type { CustomPlay } from '../../types/customPlay';
import type { LastUsedMeditation } from '../../types/home';
import type { Playlist } from '../../types/playlist';
import type { SessionLog } from '../../types/sessionLog';
import type { SankalpaProgress } from '../../types/sankalpa';
import { formatDurationLabel } from '../../utils/sessionLog';
import { getSankalpaGoalTypeLabel } from '../../utils/sankalpa';
import { describeLastUsedMeditation } from './homePageHelpers';

interface QuickStartPanelProps {
  readonly isSettingsLoading: boolean;
  readonly defaultTimerLabel: string;
  readonly actionButtonLabel: string;
  readonly lastUsedMeditation: LastUsedMeditation | null;
  readonly onQuickStart: () => void;
  readonly onOpenPractice: () => void;
  readonly onStartLastUsedMeditation: () => void;
}

export function HomeQuickStartPanel({
  isSettingsLoading,
  defaultTimerLabel,
  actionButtonLabel,
  lastUsedMeditation,
  onQuickStart,
  onOpenPractice,
  onStartLastUsedMeditation,
}: QuickStartPanelProps) {
  return (
    <section className="home-panel">
      <h3 className="section-title">Quick Start</h3>
      <p className="section-subtitle">
        {isSettingsLoading ? 'Loading timer defaults...' : `Default timer: ${defaultTimerLabel}`}
      </p>
      <div className="timer-actions">
        <button type="button" onClick={onQuickStart} disabled={isSettingsLoading}>
          {actionButtonLabel}
        </button>
        <button type="button" className="secondary" onClick={onOpenPractice}>
          Open Practice
        </button>
      </div>
      {lastUsedMeditation ? (
        <>
          <p className="section-subtitle">Last used: {describeLastUsedMeditation(lastUsedMeditation)}</p>
          <div className="timer-actions">
            <button type="button" className="secondary" onClick={onStartLastUsedMeditation}>
              Start Last Used Meditation
            </button>
          </div>
        </>
      ) : (
        <p className="section-subtitle">Your last started timer, custom play, or playlist will appear here.</p>
      )}
    </section>
  );
}

interface TodayAndSankalpaPanelsProps {
  readonly todaySummary: {
    readonly sessionLogCount: number;
    readonly totalDurationSeconds: number;
    readonly completedCount: number;
    readonly endedEarlyCount: number;
  };
  readonly isSankalpaLoading: boolean;
  readonly sankalpaSyncMessage: string | null;
  readonly topActiveSankalpa: SankalpaProgress | null;
  readonly onOpenSankalpa: () => void;
}

export function HomeTodayAndSankalpaPanels({
  todaySummary,
  isSankalpaLoading,
  sankalpaSyncMessage,
  topActiveSankalpa,
  onOpenSankalpa,
}: TodayAndSankalpaPanelsProps) {
  return (
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
          <button type="button" className="link-button" onClick={onOpenSankalpa}>
            Open Sankalpa
          </button>
        </div>
        {isSankalpaLoading ? <p className="section-subtitle">Refreshing sankalpa progress from the backend.</p> : null}
        {sankalpaSyncMessage ? <p className="section-subtitle">{sankalpaSyncMessage}</p> : null}
        {topActiveSankalpa ? (
          <>
            <div className="history-row">
              <strong>
                {topActiveSankalpa.goal.goalType === 'observance-based'
                  ? topActiveSankalpa.goal.observanceLabel
                  : getSankalpaGoalTypeLabel(topActiveSankalpa.goal.goalType)}
              </strong>
              <span className="pill active">{topActiveSankalpa.status}</span>
            </div>
            <p className="section-subtitle">
              Deadline: {new Date(topActiveSankalpa.deadlineAt).toLocaleDateString()} · Target:{' '}
              {topActiveSankalpa.goal.goalType === 'observance-based'
                ? `${topActiveSankalpa.targetObservanceCount} observed dates`
                : `${topActiveSankalpa.goal.targetValue} ${
                    topActiveSankalpa.goal.goalType === 'duration-based' ? 'min' : 'session logs'
                  }`}
            </p>
            <div className="sankalpa-progress-track" aria-hidden="true">
              <span className="sankalpa-progress-fill" style={{ width: `${Math.min(100, topActiveSankalpa.progressRatio * 100)}%` }} />
            </div>
            <p className="section-subtitle">
              Progress:{' '}
              {topActiveSankalpa.goal.goalType === 'observance-based'
                ? `${topActiveSankalpa.matchedObservanceCount} / ${topActiveSankalpa.targetObservanceCount} observed dates`
                : topActiveSankalpa.goal.goalType === 'duration-based'
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
  );
}

interface RecentActivityPanelProps {
  readonly recentLogs: SessionLog[];
  readonly onOpenHistory: () => void;
}

export function HomeRecentActivityPanel({ recentLogs, onOpenHistory }: RecentActivityPanelProps) {
  return (
    <section className="home-panel">
      <div className="panel-header">
        <h3 className="section-title">Recent Activity</h3>
        <button type="button" className="link-button" onClick={onOpenHistory}>
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
  );
}

interface FavoritesPanelProps {
  readonly favoriteCustomPlays: readonly CustomPlay[];
  readonly favoritePlaylists: readonly Playlist[];
  readonly isPlaylistsLoading: boolean;
  readonly onStartFavoriteCustomPlay: (play: CustomPlay) => void;
  readonly onRunFavoritePlaylist: (playlistId: string) => void;
}

export function HomeFavoritesPanel({
  favoriteCustomPlays,
  favoritePlaylists,
  isPlaylistsLoading,
  onStartFavoriteCustomPlay,
  onRunFavoritePlaylist,
}: FavoritesPanelProps) {
  return (
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
                    <button type="button" className="secondary" onClick={() => onStartFavoriteCustomPlay(play)}>
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
                {isPlaylistsLoading ? <p className="section-subtitle">Loading favorite playlists from the backend.</p> : null}
                <ul className="home-shortcut-list">
                  {favoritePlaylists.map((playlist) => (
                    <li key={playlist.id} className="home-shortcut-item">
                      <span className="home-shortcut-label">{playlist.name}</span>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => onRunFavoritePlaylist(playlist.id)}
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
  );
}
