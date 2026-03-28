import type { ActiveSession } from '../../types/timer';
import { resolveTimerSound, SILENT_TIMER_SOUND_LABEL } from './timerSoundCatalog';

export type TimerSoundCue = 'start' | 'interval' | 'end';
export type TimerSoundPlaybackFailureReason = 'missing mapping' | 'audio blocked' | 'file unavailable' | 'playback failed';

export type TimerSoundPlaybackResult =
  | {
      readonly status: 'played';
      readonly label: string;
      readonly cue: TimerSoundCue;
    }
  | {
      readonly status: 'silent';
      readonly label: string;
      readonly cue: TimerSoundCue;
    }
  | {
      readonly status: 'failed';
      readonly label: string;
      readonly cue: TimerSoundCue;
      readonly reason: TimerSoundPlaybackFailureReason;
      readonly filePath: string | null;
    };

interface AudioLike {
  preload: string;
  currentTime: number;
  play(): Promise<void>;
}

type AudioLikeConstructor = new (src: string) => AudioLike;

export interface TimerSoundPlayer {
  play(label: string, cue: TimerSoundCue): Promise<TimerSoundPlaybackResult>;
}

class UnsupportedAudio {
  preload = 'auto';
  currentTime = 0;

  constructor(src: string) {
    void src;
  }

  play(): Promise<void> {
    return Promise.reject(new Error('Audio playback is not supported in this environment.'));
  }
}

function inferFailureReason(error: unknown): TimerSoundPlaybackFailureReason {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'audio blocked';
  }

  if (error instanceof DOMException && error.name === 'NotSupportedError') {
    return 'file unavailable';
  }

  if (error instanceof Error) {
    const normalizedMessage = error.message.toLowerCase();
    if (normalizedMessage.includes('notallowederror') || normalizedMessage.includes('user gesture')) {
      return 'audio blocked';
    }
    if (
      normalizedMessage.includes('404') ||
      normalizedMessage.includes('network') ||
      normalizedMessage.includes('media resource') ||
      normalizedMessage.includes('not supported')
    ) {
      return 'file unavailable';
    }
  }

  return 'playback failed';
}

export function createTimerSoundPlayer(
  AudioConstructor: AudioLikeConstructor = typeof window !== 'undefined' && typeof window.Audio === 'function'
    ? (window.Audio as AudioLikeConstructor)
    : UnsupportedAudio
): TimerSoundPlayer {
  return {
    async play(label, cue) {
      if (label === SILENT_TIMER_SOUND_LABEL) {
        return {
          status: 'silent',
          label,
          cue,
        };
      }

      const resolvedSound = resolveTimerSound(label);
      if (!resolvedSound) {
        return {
          status: 'failed',
          label,
          cue,
          reason: 'missing mapping',
          filePath: null,
        };
      }

      try {
        const audio = new AudioConstructor(resolvedSound.filePath);
        audio.preload = 'auto';
        audio.currentTime = 0;
        await audio.play();
        return {
          status: 'played',
          label,
          cue,
        };
      } catch (error) {
        return {
          status: 'failed',
          label,
          cue,
          reason: inferFailureReason(error),
          filePath: resolvedSound.filePath,
        };
      }
    },
  };
}

export function getCompletedSessionSeconds(session: ActiveSession, nowMs: number, isPaused: boolean): number {
  if (isPaused) {
    return Math.max(0, session.intendedDurationSeconds - session.remainingSeconds);
  }

  const remainingSeconds = Math.max(0, Math.ceil((session.endAtMs - nowMs) / 1000));
  return Math.max(0, session.intendedDurationSeconds - remainingSeconds);
}

export function getElapsedIntervalCueCount(session: ActiveSession, nowMs: number, isPaused: boolean): number {
  if (!session.intervalEnabled || session.intervalMinutes <= 0) {
    return 0;
  }

  const intervalSeconds = Math.round(session.intervalMinutes * 60);
  if (intervalSeconds <= 0) {
    return 0;
  }

  const completedSeconds = getCompletedSessionSeconds(session, nowMs, isPaused);
  const maxIntervalCueCount = Math.floor((session.intendedDurationSeconds - 1) / intervalSeconds);

  return Math.min(Math.floor(completedSeconds / intervalSeconds), maxIntervalCueCount);
}

export function buildTimerSoundPlaybackMessage(result: Extract<TimerSoundPlaybackResult, { status: 'failed' }>): string {
  if (result.reason === 'missing mapping') {
    return `The ${result.cue} sound "${result.label}" is not mapped to a playable file yet. The timer is still running normally.`;
  }

  if (result.reason === 'audio blocked') {
    return `The browser blocked the ${result.cue} sound "${result.label}". The timer is still running normally.`;
  }

  if (result.reason === 'file unavailable') {
    return `The ${result.cue} sound "${result.label}" could not be loaded from ${result.filePath ?? 'the configured media path'}. The timer is still running normally.`;
  }

  return `The ${result.cue} sound "${result.label}" could not play. The timer is still running normally.`;
}
