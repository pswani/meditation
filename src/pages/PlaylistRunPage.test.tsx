import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const ACTIVE_PLAYLIST_RUN_STATE_KEY = 'meditation.activePlaylistRunState.v1';
const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';

const storedRun = {
  runId: 'playlist-1-1000',
  playlistId: 'playlist-1',
  playlistName: 'Morning Sequence',
  runStartedAt: '2026-03-24T10:00:00.000Z',
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
  currentIndex: 0,
  currentItemStartedAt: '2026-03-24T10:00:00.000Z',
  currentItemStartedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
  currentItemRemainingSeconds: 300,
  currentItemEndAtMs: Date.parse('2026-03-24T10:10:00.000Z'),
  completedItems: 0,
  completedDurationSeconds: 0,
  totalIntendedDurationSeconds: 1500,
};

describe('PlaylistRunPage UX', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T10:05:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ends an active playlist run early, logs progress, and keeps history continuity', () => {
    localStorage.setItem(
      ACTIVE_PLAYLIST_RUN_STATE_KEY,
      JSON.stringify({
        activePlaylistRun: storedRun,
        isPaused: false,
      })
    );

    render(
      <MemoryRouter initialEntries={['/practice/playlists/active']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/current meditation type: vipassana/i)).toBeInTheDocument();
    expect(screen.getByText(/up next: ajapa \(15 min\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /end early/i }));
    const confirmDialog = screen.getByRole('dialog', { name: /end playlist early confirmation/i });
    expect(confirmDialog).toBeInTheDocument();

    fireEvent.click(within(confirmDialog).getByRole('button', { name: /^end early$/i }));

    expect(screen.getByRole('heading', { level: 2, name: /playlist ended early/i })).toBeInTheDocument();
    expect(screen.getByText(/total completed duration: 5 min/i)).toBeInTheDocument();

    const storedLogs = JSON.parse(localStorage.getItem(SESSION_LOGS_KEY) ?? '[]');
    expect(storedLogs).toHaveLength(1);
    expect(storedLogs[0]).toMatchObject({
      source: 'auto log',
      status: 'ended early',
      meditationType: 'Vipassana',
      completedDurationSeconds: 300,
      playlistName: 'Morning Sequence',
      playlistItemPosition: 1,
      playlistItemCount: 2,
    });
    expect(localStorage.getItem(ACTIVE_PLAYLIST_RUN_STATE_KEY)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /view history/i }));

    expect(screen.getByRole('heading', { level: 1, name: 'History' })).toBeInTheDocument();
    expect(screen.getByText(/playlist run started at/i)).toBeInTheDocument();
    expect(screen.getByText(/playlist: morning sequence · item 1\/2/i)).toBeInTheDocument();
    expect(screen.getByText(/^ended early$/i)).toBeInTheDocument();
  });
});
