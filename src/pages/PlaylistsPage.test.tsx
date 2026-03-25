import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const PLAYLISTS_KEY = 'meditation.playlists.v1';
const ACTIVE_TIMER_STATE_KEY = 'meditation.activeTimerState.v1';
const ACTIVE_PLAYLIST_RUN_STATE_KEY = 'meditation.activePlaylistRunState.v1';

const storedPlaylists = [
  {
    id: 'playlist-1',
    name: 'Morning Sequence',
    favorite: true,
    createdAt: '2026-03-24T08:00:00.000Z',
    updatedAt: '2026-03-24T08:00:00.000Z',
    items: [
      {
        id: 'item-1',
        meditationType: 'Vipassana' as const,
        durationMinutes: 10,
      },
      {
        id: 'item-2',
        meditationType: 'Ajapa' as const,
        durationMinutes: 15,
      },
    ],
  },
];

describe('PlaylistsPage UX', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T10:05:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('blocks starting a playlist when an active timer session is already running', () => {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(storedPlaylists));
    localStorage.setItem(
      ACTIVE_TIMER_STATE_KEY,
      JSON.stringify({
        activeSession: {
          startedAt: '2026-03-24T10:00:00.000Z',
          startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          intendedDurationSeconds: 1800,
          remainingSeconds: 1500,
          meditationType: 'Vipassana',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
          endAtMs: Date.parse('2026-03-24T10:30:00.000Z'),
        },
        isPaused: false,
      })
    );

    render(
      <MemoryRouter initialEntries={['/practice/playlists']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /run playlist/i }));

    expect(screen.getByText(/finish or end the active timer session before starting a playlist run/i)).toBeInTheDocument();
  });

  it('surfaces an active playlist and opens the run screen to continue it', () => {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(storedPlaylists));
    localStorage.setItem(
      ACTIVE_PLAYLIST_RUN_STATE_KEY,
      JSON.stringify({
        activePlaylistRun: {
          runId: 'playlist-1-1000',
          playlistId: 'playlist-1',
          playlistName: 'Morning Sequence',
          runStartedAt: '2026-03-24T10:00:00.000Z',
          items: storedPlaylists[0].items,
          currentIndex: 0,
          currentItemStartedAt: '2026-03-24T10:00:00.000Z',
          currentItemStartedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          currentItemRemainingSeconds: 300,
          currentItemEndAtMs: Date.parse('2026-03-24T10:10:00.000Z'),
          completedItems: 0,
          completedDurationSeconds: 0,
          totalIntendedDurationSeconds: 1500,
        },
        isPaused: false,
      })
    );

    render(
      <MemoryRouter initialEntries={['/practice/playlists']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/playlist run active: morning sequence · item 1\/2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open active run/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open active run/i }));

    expect(screen.getByRole('heading', { level: 2, name: 'Morning Sequence' })).toBeInTheDocument();
    expect(screen.getByText(/up next: ajapa \(15 min\)/i)).toBeInTheDocument();
  });
});
