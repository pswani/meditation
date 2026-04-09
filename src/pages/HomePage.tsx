import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HomeFavoritesPanel,
  HomeQuickStartPanel,
  HomeRecentActivityPanel,
  HomeTodayAndSankalpaPanels,
} from '../features/home/HomePanels';
import {
  customPlayStartBlockMessage,
  playlistStartBlockMessage,
  selectFavoriteCustomPlays,
} from '../features/home/homePageHelpers';
import { useSankalpaProgress } from '../features/sankalpa/useSankalpaProgress';
import { useTimer } from '../features/timer/useTimer';
import type { CustomPlay } from '../types/customPlay';
import { applyCustomPlayToTimerSettings } from '../utils/customPlay';
import { deriveTodayActivitySummary, selectRecentSessionLogs, selectTopActiveSankalpaProgress } from '../utils/home';

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
  const favoriteCustomPlays = useMemo(() => selectFavoriteCustomPlays(customPlays), [customPlays]);
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

      <HomeQuickStartPanel
        isSettingsLoading={isSettingsLoading}
        defaultTimerLabel={`${
          settings.timerMode === 'open-ended' ? 'Open-ended' : `${fixedDurationMinutes} min`
        } · ${settings.meditationType || 'select meditation type'}`}
        actionButtonLabel={
          activeSession
            ? 'Resume Active Timer'
            : activeCustomPlayRun
            ? 'Resume Custom Play'
            : activePlaylistRun
            ? 'Resume Playlist Run'
            : 'Start Timer Now'
        }
        lastUsedMeditation={lastUsedMeditation}
        onQuickStart={quickStart}
        onOpenPractice={() => navigate('/practice')}
        onStartLastUsedMeditation={startLastUsedMeditationShortcut}
      />

      <HomeTodayAndSankalpaPanels
        todaySummary={todaySummary}
        isSankalpaLoading={isSankalpaLoading}
        sankalpaSyncMessage={sankalpaSyncMessage}
        topActiveSankalpa={topActiveSankalpa}
        onOpenSankalpa={() => navigate('/goals')}
      />

      <HomeRecentActivityPanel recentLogs={recentLogs} onOpenHistory={() => navigate('/history')} />

      <HomeFavoritesPanel
        favoriteCustomPlays={favoriteCustomPlays}
        favoritePlaylists={favoritePlaylists}
        isPlaylistsLoading={isPlaylistsLoading}
        onStartFavoriteCustomPlay={startFavoriteCustomPlay}
        onRunFavoritePlaylist={runFavoritePlaylist}
      />

    </section>
  );
}
