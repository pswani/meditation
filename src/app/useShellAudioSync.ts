import { useEffect } from 'react';
import type { RefObject } from 'react';
import { precacheUrlsForOffline } from '../features/sync/offlineApp';
import type { ActiveCustomPlayRun } from '../types/customPlay';
import type { ActivePlaylistRun, ActivePlaylistRunItem } from '../types/playlist';
import { buildCustomPlayMediaMessage, buildPlaylistMediaMessage } from './appShellHelpers';

interface UseCustomPlayAudioSyncOptions {
  readonly audioRef: RefObject<HTMLAudioElement | null>;
  readonly activeCustomPlayRun: ActiveCustomPlayRun | null;
  readonly reportCustomPlayRuntimeIssue: (message: string | null) => void;
}

export function useCustomPlayAudioSync({
  audioRef,
  activeCustomPlayRun,
  reportCustomPlayRuntimeIssue,
}: UseCustomPlayAudioSyncOptions) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!activeCustomPlayRun) {
      try {
        audio.pause();
      } catch {
        // JSDOM does not implement media playback.
      }
      if (audio.getAttribute('src')) {
        audio.removeAttribute('src');
        audio.load();
      }
      return;
    }

    if (audio.src !== new URL(activeCustomPlayRun.mediaFilePath, window.location.origin).toString()) {
      audio.src = activeCustomPlayRun.mediaFilePath;
      audio.load();
    }

    const desiredPosition = Math.max(0, Math.min(activeCustomPlayRun.durationSeconds, activeCustomPlayRun.currentPositionSeconds));
    if (Math.abs(audio.currentTime - desiredPosition) > 1) {
      try {
        audio.currentTime = desiredPosition;
      } catch {
        // Wait for metadata before seeking.
      }
    }

    if (activeCustomPlayRun.isPaused) {
      try {
        audio.pause();
      } catch {
        // JSDOM does not implement media playback.
      }
      return;
    }

    void audio
      .play()
      .then(() => {
        reportCustomPlayRuntimeIssue(null);
      })
      .catch((error) => {
        reportCustomPlayRuntimeIssue(buildCustomPlayMediaMessage(error));
      });
  }, [activeCustomPlayRun, audioRef, reportCustomPlayRuntimeIssue]);

  useEffect(() => {
    if (!activeCustomPlayRun?.mediaFilePath) {
      return;
    }

    void precacheUrlsForOffline([activeCustomPlayRun.mediaFilePath]);
  }, [activeCustomPlayRun?.mediaFilePath]);
}

interface UsePlaylistAudioSyncOptions {
  readonly audioRef: RefObject<HTMLAudioElement | null>;
  readonly activePlaylistRun: ActivePlaylistRun | null;
  readonly activePlaylistAudioItem: ActivePlaylistRunItem | null;
  readonly isPlaylistRunPaused: boolean;
  readonly reportPlaylistRuntimeIssue: (message: string | null) => void;
}

export function usePlaylistAudioSync({
  audioRef,
  activePlaylistRun,
  activePlaylistAudioItem,
  isPlaylistRunPaused,
  reportPlaylistRuntimeIssue,
}: UsePlaylistAudioSyncOptions) {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!activePlaylistAudioItem || !activePlaylistRun || activePlaylistRun.currentSegment.phase !== 'item') {
      try {
        audio.pause();
      } catch {
        // JSDOM does not implement media playback.
      }
      if (audio.getAttribute('src')) {
        audio.removeAttribute('src');
        audio.load();
      }
      return;
    }

    if (!activePlaylistAudioItem.mediaFilePath) {
      reportPlaylistRuntimeIssue('The linked playlist recording is missing its media path.');
      return;
    }

    if (audio.src !== new URL(activePlaylistAudioItem.mediaFilePath, window.location.origin).toString()) {
      audio.src = activePlaylistAudioItem.mediaFilePath;
      audio.load();
    }

    const desiredPosition = Math.max(0, Math.min(audio.duration || Number.MAX_SAFE_INTEGER, activePlaylistRun.currentSegment.elapsedSeconds));
    if (Math.abs(audio.currentTime - desiredPosition) > 1) {
      try {
        audio.currentTime = desiredPosition;
      } catch {
        // Wait for metadata before seeking.
      }
    }

    if (isPlaylistRunPaused) {
      try {
        audio.pause();
      } catch {
        // JSDOM does not implement media playback.
      }
      return;
    }

    void audio
      .play()
      .then(() => {
        reportPlaylistRuntimeIssue(null);
      })
      .catch((error) => {
        reportPlaylistRuntimeIssue(buildPlaylistMediaMessage(error));
      });
  }, [activePlaylistAudioItem, activePlaylistRun, audioRef, isPlaylistRunPaused, reportPlaylistRuntimeIssue]);

  useEffect(() => {
    if (!activePlaylistAudioItem?.mediaFilePath) {
      return;
    }

    void precacheUrlsForOffline([activePlaylistAudioItem.mediaFilePath]);
  }, [activePlaylistAudioItem?.mediaFilePath]);
}
