import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimerProvider } from './TimerContext';
import { useTimer } from './useTimer';

const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';
const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const CUSTOM_PLAYS_KEY = 'meditation.customPlays.v1';
const PLAYLISTS_KEY = 'meditation.playlists.v1';
const SANKALPAS_KEY = 'meditation.sankalpas.v1';
const ACTIVE_TIMER_STATE_KEY = 'meditation.activeTimerState.v1';
const ACTIVE_PLAYLIST_RUN_STATE_KEY = 'meditation.activePlaylistRunState.v1';

function TimerSettingsButton() {
  const { setSettings } = useTimer();

  return (
    <button
      type="button"
      onClick={() =>
        setSettings({
          durationMinutes: 15,
          meditationType: 'Vipassana',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 5,
          intervalSound: 'Temple Bell',
        })
      }
    >
      Update timer settings
    </button>
  );
}

describe('TimerProvider persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('does not rewrite hydrated storage on initial mount when persisted values already match', () => {
    localStorage.setItem(
      TIMER_SETTINGS_KEY,
      JSON.stringify({
        durationMinutes: 10,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
      })
    );
    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        {
          id: 'log-1',
          startedAt: '2026-03-24T10:00:00.000Z',
          endedAt: '2026-03-24T10:10:00.000Z',
          meditationType: 'Vipassana',
          intendedDurationSeconds: 600,
          completedDurationSeconds: 600,
          status: 'completed',
          source: 'auto log',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
        },
      ])
    );
    localStorage.setItem(
      CUSTOM_PLAYS_KEY,
      JSON.stringify([
        {
          id: 'play-1',
          name: 'Morning Focus',
          durationMinutes: 20,
          meditationType: 'Ajapa',
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
        },
      ])
    );
    localStorage.setItem(
      PLAYLISTS_KEY,
      JSON.stringify([
        {
          id: 'playlist-1',
          name: 'Calm Sequence',
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
          items: [
            {
              id: 'playlist-item-1',
              durationMinutes: 10,
              meditationType: 'Vipassana',
            },
          ],
        },
      ])
    );
    localStorage.setItem(
      SANKALPAS_KEY,
      JSON.stringify([
        {
          id: 'goal-1',
          goalType: 'duration-based',
          targetValue: 120,
          days: 7,
          createdAt: '2026-03-24T08:00:00.000Z',
        },
      ])
    );
    localStorage.setItem(
      ACTIVE_TIMER_STATE_KEY,
      JSON.stringify({
        activeSession: {
          startedAt: '2026-03-24T10:00:00.000Z',
          startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          intendedDurationSeconds: 600,
          remainingSeconds: 600,
          meditationType: 'Vipassana',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
          endAtMs: Date.parse('2026-03-24T10:10:00.000Z'),
        },
        isPaused: true,
      })
    );
    localStorage.setItem(
      ACTIVE_PLAYLIST_RUN_STATE_KEY,
      JSON.stringify({
        activePlaylistRun: {
          runId: 'playlist-run-1',
          playlistId: 'playlist-1',
          playlistName: 'Calm Sequence',
          runStartedAt: '2026-03-24T10:00:00.000Z',
          items: [
            {
              id: 'playlist-item-1',
              durationMinutes: 10,
              meditationType: 'Vipassana',
            },
          ],
          currentIndex: 0,
          currentItemStartedAt: '2026-03-24T10:00:00.000Z',
          currentItemStartedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          currentItemRemainingSeconds: 600,
          currentItemEndAtMs: Date.parse('2026-03-24T10:10:00.000Z'),
          completedItems: 0,
          completedDurationSeconds: 0,
          totalIntendedDurationSeconds: 600,
        },
        isPaused: true,
      })
    );

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

    render(
      <TimerProvider>
        <div>ready</div>
      </TimerProvider>
    );

    expect(screen.getByText('ready')).toBeInTheDocument();
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(removeItemSpy).not.toHaveBeenCalled();
  });

  it('persists timer settings after a real update', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <TimerProvider>
        <TimerSettingsButton />
      </TimerProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /update timer settings/i }));

    expect(setItemSpy).toHaveBeenCalledWith(
      TIMER_SETTINGS_KEY,
      expect.stringContaining('"durationMinutes":15')
    );
  });
});
