import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncStatusProvider } from '../sync/SyncStatusProvider';
import type { TimerSettings } from '../../types/timer';
import { TimerProvider } from './TimerContext';
import { useTimer } from './useTimer';

const ACTIVE_TIMER_STATE_KEY = 'meditation.activeTimerState.v1';
const ACTIVE_PLAYLIST_RUN_STATE_KEY = 'meditation.activePlaylistRunState.v1';
const PLAYLISTS_KEY = 'meditation.playlists.v1';

const validSettings: TimerSettings = {
  timerMode: 'fixed',
  durationMinutes: 10,
  meditationType: 'Vipassana',
  startSound: 'None',
  endSound: 'Temple Bell',
  intervalEnabled: false,
  intervalMinutes: 5,
  intervalSound: 'Temple Bell',
};

function getSetItemCallsFor(spy: ReturnType<typeof vi.spyOn>, storageKey: string) {
  return spy.mock.calls.filter((call) => call[0] === storageKey);
}

async function flushProviderHydration() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function PersistenceHarness() {
  const { setSettings, startSession, pauseSession, startPlaylistRun, pausePlaylistRun, activeSession, activePlaylistRun } = useTimer();
  const playlistElapsed =
    activePlaylistRun?.currentSegment.phase === 'item' ? activePlaylistRun.currentSegment.elapsedSeconds : 'none';
  const playlistRemaining = activePlaylistRun?.currentSegment.remainingSeconds ?? 'none';

  return (
    <div>
      <button type="button" onClick={() => setSettings(validSettings)}>
        Load Valid Timer Settings
      </button>
      <button type="button" onClick={() => startSession()}>
        Start Session
      </button>
      <button type="button" onClick={() => pauseSession()}>
        Pause Session
      </button>
      <button type="button" onClick={() => startPlaylistRun('playlist-1')}>
        Start Playlist Run
      </button>
      <button type="button" onClick={() => pausePlaylistRun()}>
        Pause Playlist Run
      </button>
      <p data-testid="timer-elapsed">{activeSession?.elapsedSeconds ?? 'none'}</p>
      <p data-testid="playlist-elapsed">{playlistElapsed}</p>
      <p data-testid="playlist-remaining">{playlistRemaining}</p>
    </div>
  );
}

describe('TimerProvider persistence behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T12:00:00.000Z'));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('does not rewrite active timer persistence on every countdown tick', () => {
    render(
      <SyncStatusProvider>
        <TimerProvider>
          <PersistenceHarness />
        </TimerProvider>
      </SyncStatusProvider>
    );

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    setItemSpy.mockClear();

    fireEvent.click(screen.getByRole('button', { name: /load valid timer settings/i }));
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));

    expect(getSetItemCallsFor(setItemSpy, ACTIVE_TIMER_STATE_KEY)).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2_500);
    });

    expect(getSetItemCallsFor(setItemSpy, ACTIVE_TIMER_STATE_KEY)).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /pause session/i }));

    const timerPersistenceCalls = getSetItemCallsFor(setItemSpy, ACTIVE_TIMER_STATE_KEY);
    expect(timerPersistenceCalls).toHaveLength(2);

    const pausedPayload = JSON.parse(String(timerPersistenceCalls.at(-1)?.[1]));
    expect(pausedPayload.isPaused).toBe(true);
    expect(pausedPayload.elapsedSeconds).toBeGreaterThan(0);
  });

  it('does not rewrite active playlist persistence on every countdown tick', async () => {
    localStorage.setItem(
      PLAYLISTS_KEY,
      JSON.stringify([
        {
          id: 'playlist-1',
          name: 'Morning Sequence',
          smallGapSeconds: 0,
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
          items: [
            {
              id: 'item-1',
              title: 'Vipassana',
              meditationType: 'Vipassana',
              durationMinutes: 10,
            },
          ],
        },
      ])
    );

    render(
      <SyncStatusProvider>
        <TimerProvider>
          <PersistenceHarness />
        </TimerProvider>
      </SyncStatusProvider>
    );

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    setItemSpy.mockClear();

    await flushProviderHydration();
    fireEvent.click(screen.getByRole('button', { name: /start playlist run/i }));

    expect(getSetItemCallsFor(setItemSpy, ACTIVE_PLAYLIST_RUN_STATE_KEY)).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2_500);
    });

    expect(getSetItemCallsFor(setItemSpy, ACTIVE_PLAYLIST_RUN_STATE_KEY)).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /pause playlist run/i }));

    const playlistPersistenceCalls = getSetItemCallsFor(setItemSpy, ACTIVE_PLAYLIST_RUN_STATE_KEY);
    expect(playlistPersistenceCalls).toHaveLength(2);

    const pausedPayload = JSON.parse(String(playlistPersistenceCalls.at(-1)?.[1]));
    expect(pausedPayload.isPaused).toBe(true);
    expect(pausedPayload.activePlaylistRun.currentSegment.remainingSeconds).toBeLessThan(600);
  });

  it('recovers recording-backed playlist items from stored playback progress instead of stale wall-clock time', async () => {
    localStorage.setItem(
      ACTIVE_PLAYLIST_RUN_STATE_KEY,
      JSON.stringify({
        activePlaylistRun: {
          runId: 'playlist-1-1000',
          playlistId: 'playlist-1',
          playlistName: 'Morning Sequence',
          runStartedAt: '2026-03-24T10:00:00.000Z',
          items: [
            {
              id: 'item-1',
              title: 'Recorded Vipassana',
              meditationType: 'Vipassana',
              durationMinutes: 20,
              customPlayId: 'custom-play-1',
              customPlayName: 'Recorded Vipassana',
              customPlayRecordingLabel: 'Vipassana Sit (20 min)',
              mediaAssetId: 'media-vipassana-sit-20',
              mediaLabel: 'Vipassana Sit (20 min)',
              mediaFilePath: '/media/custom-plays/vipassana-sit-20.mp3',
              startSound: 'Temple Bell',
              endSound: 'Gong',
            },
          ],
          smallGapSeconds: 0,
          currentIndex: 0,
          currentSegment: {
            phase: 'item',
            startedAt: '2026-03-24T10:00:00.000Z',
            startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
            elapsedSeconds: 65,
            remainingSeconds: 1135,
            endAtMs: Date.parse('2026-03-24T10:20:00.000Z'),
          },
          completedItems: 0,
          completedDurationSeconds: 0,
          totalIntendedDurationSeconds: 1200,
        },
        isPaused: false,
      })
    );
    vi.setSystemTime(new Date('2026-03-24T10:10:00.000Z'));

    render(
      <SyncStatusProvider>
        <TimerProvider>
          <PersistenceHarness />
        </TimerProvider>
      </SyncStatusProvider>
    );

    await flushProviderHydration();

    expect(screen.getByTestId('playlist-elapsed')).toHaveTextContent('65');
    expect(screen.getByTestId('playlist-remaining')).toHaveTextContent('1135');
  });
});
