import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncStatusProvider } from '../sync/SyncStatusProvider';
import type { TimerSettings } from '../../types/timer';
import { TimerProvider } from './TimerContext';
import { useTimer } from './useTimer';

const validSettings: TimerSettings = {
  durationMinutes: 10,
  meditationType: 'Vipassana',
  startSound: 'Soft Chime',
  endSound: 'Temple Bell',
  intervalEnabled: true,
  intervalMinutes: 2,
  intervalSound: 'Wood Block',
};

class MockAudio {
  static playCalls: string[] = [];

  preload = 'auto';
  currentTime = 0;

  constructor(readonly src: string) {}

  play() {
    MockAudio.playCalls.push(this.src);
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
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-27T15:00:00.000Z'));
    MockAudio.playCalls = [];
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

    expect(MockAudio.playCalls).toEqual(['/media/sounds/soft-chime.wav']);
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

    expect(MockAudio.playCalls).toEqual(['/media/sounds/soft-chime.wav']);

    fireEvent.click(screen.getByRole('button', { name: /resume session/i }));
    await flushAsyncWork();

    await act(async () => {
      vi.advanceTimersByTime(59_000);
    });
    await flushAsyncWork();

    expect(MockAudio.playCalls).toEqual(['/media/sounds/soft-chime.wav']);

    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    await flushAsyncWork();

    expect(MockAudio.playCalls).toEqual(['/media/sounds/soft-chime.wav', '/media/sounds/wood-block.wav']);

    await act(async () => {
      vi.advanceTimersByTime(2 * 60_000);
    });
    await flushAsyncWork();

    expect(MockAudio.playCalls).toEqual([
      '/media/sounds/soft-chime.wav',
      '/media/sounds/wood-block.wav',
      '/media/sounds/wood-block.wav',
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
    expect(MockAudio.playCalls.filter((src) => src === '/media/sounds/temple-bell.wav')).toHaveLength(1);
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
    expect(MockAudio.playCalls).toEqual(['/media/sounds/soft-chime.wav', '/media/sounds/temple-bell.wav']);
  });

  it('does not duplicate playback when rendered in StrictMode', async () => {
    renderHarness(true);
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load valid timer settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    expect(MockAudio.playCalls).toEqual(['/media/sounds/soft-chime.wav']);
  });

  it('fails safely when the browser blocks playback', async () => {
    mockAudioPlay.mockImplementation(async (src) => {
      if (src === '/media/sounds/soft-chime.wav') {
        throw new DOMException('Playback requires user activation.', 'NotAllowedError');
      }
    });

    renderHarness();
    await flushAsyncWork();

    fireEvent.click(screen.getByRole('button', { name: /load valid timer settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    await flushAsyncWork();

    expect(screen.getByTestId('active-session')).not.toHaveTextContent('none');
    expect(screen.getByTestId('sound-message')).toHaveTextContent(/browser blocked the start sound "Soft Chime"/i);
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
});
