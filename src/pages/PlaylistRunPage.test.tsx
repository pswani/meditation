import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

const ACTIVE_PLAYLIST_RUN_STATE_KEY = 'meditation.activePlaylistRunState.v1';
const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';

function buildStoredPlaylistRun(isPaused: boolean) {
  const nowMs = Date.now();

  return {
    activePlaylistRun: {
      runId: 'playlist-1-run',
      playlistId: 'playlist-1',
      playlistName: 'Morning Sequence',
      runStartedAt: new Date(nowMs - 5 * 60 * 1000).toISOString(),
      items: [
        {
          id: 'item-1',
          meditationType: 'Vipassana',
          durationMinutes: 10,
        },
        {
          id: 'item-2',
          meditationType: 'Ajapa',
          durationMinutes: 5,
        },
      ],
      currentIndex: 0,
      currentItemStartedAt: new Date(nowMs - 5 * 60 * 1000).toISOString(),
      currentItemStartedAtMs: nowMs - 5 * 60 * 1000,
      currentItemRemainingSeconds: 300,
      currentItemEndAtMs: nowMs + 5 * 60 * 1000,
      completedItems: 0,
      completedDurationSeconds: 0,
      totalIntendedDurationSeconds: 900,
    },
    isPaused,
  };
}

describe('PlaylistRunPage UX', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('supports resuming a paused recovered playlist run', () => {
    localStorage.setItem(ACTIVE_PLAYLIST_RUN_STATE_KEY, JSON.stringify(buildStoredPlaylistRun(true)));

    render(
      <MemoryRouter initialEntries={['/practice/playlists/active']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/^paused$/i)).toBeInTheDocument();
    expect(screen.getByText(/up next: ajapa \(5 min\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^resume$/i }));

    expect(screen.getByText(/^running$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^pause$/i })).toBeInTheDocument();
  });

  it('confirms ending early and records an ended-early playlist log outcome', () => {
    localStorage.setItem(ACTIVE_PLAYLIST_RUN_STATE_KEY, JSON.stringify(buildStoredPlaylistRun(false)));

    render(
      <MemoryRouter initialEntries={['/practice/playlists/active']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /^end early$/i }));
    const dialog = screen.getByRole('dialog', { name: /end playlist early confirmation/i });
    expect(dialog).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: /^end early$/i }));

    expect(screen.getByRole('heading', { level: 2, name: /playlist ended early/i })).toBeInTheDocument();
    expect(screen.getByText(/morning sequence .* 0\/2 items logged/i)).toBeInTheDocument();

    const storedLogs = JSON.parse(localStorage.getItem(SESSION_LOGS_KEY) ?? '[]') as Array<Record<string, unknown>>;
    expect(storedLogs).toHaveLength(1);
    expect(storedLogs[0]).toMatchObject({
      playlistId: 'playlist-1',
      playlistName: 'Morning Sequence',
      playlistRunId: 'playlist-1-run',
      playlistItemPosition: 1,
      playlistItemCount: 2,
      status: 'ended early',
      source: 'auto log',
    });
    expect(Number(storedLogs[0].completedDurationSeconds)).toBeGreaterThan(0);
    expect(Number(storedLogs[0].completedDurationSeconds)).toBeLessThanOrEqual(600);
  });
});
