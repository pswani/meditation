import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const CUSTOM_PLAYS_KEY = 'meditation.customPlays.v1';
const PLAYLISTS_KEY = 'meditation.playlists.v1';
const SANKALPAS_KEY = 'meditation.sankalpas.v1';

describe('HomePage UX', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders calm empty states when there is no stored activity', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/no session log entries yet today/i)).toBeInTheDocument();
    expect(screen.getByText(/no active sankalpa right now/i)).toBeInTheDocument();
    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /next actions/i })).not.toBeInTheDocument();
  });

  it('shows populated today, sankalpa, and favorites content from local storage data', () => {
    const now = new Date();
    const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    localStorage.setItem(
      SESSION_LOGS_KEY,
      JSON.stringify([
        {
          id: 'log-1',
          startedAt: twentyMinutesAgo,
          endedAt: now.toISOString(),
          meditationType: 'Vipassana',
          intendedDurationSeconds: 1200,
          completedDurationSeconds: 1200,
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
          name: 'Morning Breath Focus',
          durationMinutes: 25,
          meditationType: 'Ajapa',
          favorite: true,
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
          name: 'Evening Sequence',
          favorite: true,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
          items: [
            {
              id: 'playlist-item-1',
              name: 'Sequence Start',
              durationMinutes: 10,
              meditationType: 'Vipassana',
              startSound: 'None',
              endSound: 'Temple Bell',
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
          targetValue: 180,
          days: 7,
          createdAt: oneDayAgo,
        },
      ])
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /sankalpa snapshot/i })).toBeInTheDocument();
    expect(screen.getByText(/progress:/i)).toBeInTheDocument();
    expect(screen.getByText(/morning breath focus/i)).toBeInTheDocument();
    expect(screen.getByText(/evening sequence/i)).toBeInTheDocument();
  });

  it('shows quick-start guidance on Practice when defaults are invalid', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /start timer now/i }));

    expect(screen.getByRole('heading', { name: /timer setup/i })).toBeInTheDocument();
    expect(screen.getByText(/quick start needs valid defaults/i)).toBeInTheDocument();
  });
});
