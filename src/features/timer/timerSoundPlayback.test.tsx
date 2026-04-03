import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncStatusProvider } from '../sync/SyncStatusProvider';
import type { TimerSettings } from '../../types/timer';
import { TimerProvider } from './TimerContext';
import { resolveTimerSound } from './timerSoundCatalog';
import { useTimer } from './useTimer';

const validSettings: TimerSettings = {
  timerMode: 'fixed',
  durationMinutes: 10,
  lastFixedDurationMinutes: 10,
  meditationType: 'Vipassana',
  startSound: 'Temple Bell',
  endSound: 'Gong',
  intervalEnabled: true,
  intervalMinutes: 2,
  intervalSound: 'Gong',
};

class MockAudio {
  static playCalls: string[] = [];
  static mutedPlayCalls: string[] = [];
  static primedSources = new Set<string>();
  static blockedUntilPrimed = new Set<string>();

  preload = 'auto';
  currentTime = 0;
  muted = false;

  constructor(readonly src: string) {}

  pause() {}

  play() {
    if (this.muted) {
      MockAudio.mutedPlayCalls.push(this.src);
      MockAudio.primedSources.add(this.src);
      return Promise.resolve();
    }

    MockAudio.playCalls.push(this.src);
    if (MockAudio.blockedUntilPrimed.has(this.src) && !MockAudio.primedSources.has(this.src)) {
      return Promise.reject(new DOMException('Playback requires user activation.', 'NotAllowedError'));
    }

    return mockAudioPlay(this.src);
  }
}

const mockAudioPlay = vi.fn<(src: string) => Promise<void>>();

function SoundHarness() {
  const {
    setSettings,
    startSession,
    pauseSession,
    resumeSession,
    endSessionEarly,
    activeSession,
    lastOutcome,
    timerSoundPlaybackMessage,
  } = useTimer();

  return (
    <div>
      <button type="button" onClick={() => setSettings(validSettings)}>
        Load Valid Timer Settings
      </button>
      <button
        type="button"
        onClick={() =>
          setSettings({
            ...validSettings,
            startSound: 'Soft Chime',
            intervalSound: 'Wood Block',
          } as TimerSettings)
        }
      >
        Load Legacy Timer Settings
      </button>
      <button
        type="button"
        onClick={() =>
          setSettings({
            ...validSettings,
            startSound: 'Missing Bell',
          } as TimerSettings)
        }
      >
        Load Invalid Sound Mapping
      </button>
      <button type="button" onClick={() => startSession()}>
        Start Session
      </button>
      <button type="button" onClick={() => pauseSession()}>
        Pause Session
      </button>
      <button type="button" onClick={() => resumeSession()}>
        Resume Session
      </button>
      <button type="button" onClick={() => endSessionEarly()}>
        End Session Early
      </button>
      <p data-testid="active-session">{activeSession?.startedAt ?? 'none'}</p>
      <p data-testid="outcome-status">{lastOutcome?.status ?? 'none'}</p>
      <p data-testid="sound-message">{timerSoundPlaybackMessage ?? 'none'}</p>
    </div>
  );
}

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function renderHarness(useStrictMode = false) {
  const content = (
    <SyncStatusProvider>
      <TimerProvider>
        <SoundHarness />
      </TimerProvider>
    </SyncStatusProvider>
  );

  return render(useStrictMode ? <StrictMode>{content}</StrictMode> : content);
}

describe('timer sound playback', () => {
  const templeBellPath = resolveTimerSound('Temple Bell')?.filePath ?? 'temple-bell.mp3';
  const gongPath = resolveTimerSound('Gong')?.filePath ?? 'gong.mp3';

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-27T15:00:00.000Z'));
    MockAudio.playCalls = [];
    MockAudio.mutedPlayCalls = [];
    MockAudio.primedSources = new Set();
    MockAudio.blockedUntilPrimed = new Set();
    mockAudioPlay.mockReset();
    mockAudioPlay.mockResolvedValue();
    vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('plays the start sound once when a session starts', async () => {
    renderHarness();
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load valid timer settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    expect(MockAudio.playCalls).toEqual([templeBellPath]);
  });

  it('primes only the later cues so Safari-friendly preparation does not compete with the start sound', async () => {
    renderHarness();
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load valid timer settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    expect(MockAudio.mutedPlayCalls).toEqual([gongPath]);
    expect(MockAudio.playCalls).toEqual([templeBellPath]);
  });

  it('plays interval sounds at the elapsed timer cadence without replaying on pause and resume', async () => {
    renderHarness();
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load valid timer settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });

    fireEvent.click(screen.getByRole('button', { name: /pause session/i }));
    await flushAsyncWork();

    await act(async () => {
      vi.advanceTimersByTime(5 * 60_000);
    });
    await flushAsyncWork();

    expect(MockAudio.playCalls).toEqual([templeBellPath]);

    fireEvent.click(screen.getByRole('button', { name: /resume session/i }));
    await flushAsyncWork();

    await act(async () => {
      vi.advanceTimersByTime(59_000);
    });
    await flushAsyncWork();

    expect(MockAudio.playCalls).toEqual([templeBellPath]);

    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    await flushAsyncWork();

    expect(MockAudio.playCalls).toEqual([templeBellPath, gongPath]);

    await act(async () => {
      vi.advanceTimersByTime(2 * 60_000);
    });
    await flushAsyncWork();

    expect(MockAudio.playCalls).toEqual([
      templeBellPath,
      gongPath,
      gongPath,
    ]);
  });

  it('plays the end sound once when the timer completes naturally', async () => {
    renderHarness();
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load valid timer settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    await act(async () => {
      vi.advanceTimersByTime(10 * 60_000);
    });
    await flushAsyncWork();

    expect(screen.getByTestId('outcome-status')).toHaveTextContent('completed');
    expect(MockAudio.playCalls.filter((src) => src === gongPath)).toHaveLength(1);
  });

  it('plays the end sound once when the user ends a session early', async () => {
    renderHarness();
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load valid timer settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /end session early/i }));
    await flushAsyncWork();

    expect(screen.getByTestId('outcome-status')).toHaveTextContent('ended early');
    expect(MockAudio.playCalls).toEqual([templeBellPath, gongPath]);
  });

  it('does not duplicate playback when rendered in StrictMode', async () => {
    renderHarness(true);
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load valid timer settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    expect(MockAudio.playCalls).toEqual([templeBellPath]);
  });

  it('fails safely when the browser blocks playback', async () => {
    mockAudioPlay.mockImplementation(async (src) => {
      if (src === templeBellPath) {
        throw new DOMException('Playback requires user activation.', 'NotAllowedError');
      }
    });

    renderHarness();
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load valid timer settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    expect(screen.getByTestId('active-session')).not.toHaveTextContent('none');
    expect(screen.getByTestId('sound-message')).toHaveTextContent(/browser blocked the start sound "Temple Bell"/i);
  });

  it('primes later cues so Safari-style delayed playback can still succeed', async () => {
    MockAudio.blockedUntilPrimed = new Set([gongPath]);

    renderHarness();
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load valid timer settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    await act(async () => {
      vi.advanceTimersByTime(10 * 60_000);
    });
    await flushAsyncWork();

    expect(screen.getByTestId('outcome-status')).toHaveTextContent('completed');
    expect(screen.getByTestId('sound-message')).toHaveTextContent('none');
    expect(MockAudio.playCalls.filter((src) => src === gongPath)).toHaveLength(1);
  });

  it('maps legacy labels to the current packaged sounds during playback', async () => {
    renderHarness();
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load legacy timer settings/i }));

    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    expect(MockAudio.playCalls).toEqual([templeBellPath]);
  });

  it('fails safely when a selected sound label is not mapped to a file', async () => {
    renderHarness();
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load invalid sound mapping/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    expect(screen.getByTestId('active-session')).not.toHaveTextContent('none');
    expect(screen.getByTestId('sound-message')).toHaveTextContent(/start sound "Missing Bell" is not mapped/i);
  });

  it('shows a warning when the end sound is blocked at completion', async () => {
    mockAudioPlay.mockImplementation(async (src) => {
      if (src === gongPath) {
        throw new DOMException('Playback requires user activation.', 'NotAllowedError');
      }
    });

    renderHarness();
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load valid timer settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    await act(async () => {
      vi.advanceTimersByTime(10 * 60_000);
    });
    await flushAsyncWork();

    expect(screen.getByTestId('outcome-status')).toHaveTextContent('completed');
    expect(screen.getByTestId('sound-message')).toHaveTextContent(/browser blocked the end sound "Gong"/i);
  });
});
