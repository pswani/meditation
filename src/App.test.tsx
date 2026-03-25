import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from './App';

const ACTIVE_TIMER_STATE_KEY = 'meditation.activeTimerState.v1';
const ACTIVE_PLAYLIST_RUN_STATE_KEY = 'meditation.activePlaylistRunState.v1';

describe('App shell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders home route with functional quick-start content and Sankalpa navigation label', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(screen.getAllByText('Sankalpa').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /start timer now/i })).toBeInTheDocument();
  });

  it('renders settings route with functional defaults form', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save defaults/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/default duration \(minutes\)/i)).toBeInTheDocument();
  });

  it('reflects saved defaults from Settings in timer setup', () => {
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/default duration \(minutes\)/i), { target: { value: '32' } });
    fireEvent.change(screen.getByLabelText(/default meditation type/i), { target: { value: 'Sahaj' } });
    fireEvent.click(screen.getByRole('button', { name: /save defaults/i }));

    fireEvent.click(screen.getAllByRole('link', { name: /^Practice$/i })[0]);

    expect(screen.getByRole('heading', { name: /timer setup/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/duration \(minutes\)/i)).toHaveValue(32);
    expect(screen.getByRole('combobox', { name: /meditation type/i })).toHaveValue('Sahaj');
  });

  it('shows a global active timer resume banner outside Practice', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    const meditationTypeSelect = screen.getAllByLabelText(/meditation type/i)[0];
    fireEvent.change(meditationTypeSelect, { target: { value: 'Vipassana' } });
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));

    fireEvent.click(screen.getByRole('button', { name: /view history/i }));

    expect(screen.getByText(/active timer: vipassana/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /resume active timer/i }));
    expect(screen.getByRole('heading', { level: 2, name: /\d{2}:\d{2}/i })).toBeInTheDocument();
  });

  it('recovers an active timer snapshot from local storage and resumes it from the shell banner', () => {
    localStorage.setItem(
      ACTIVE_TIMER_STATE_KEY,
      JSON.stringify({
        activeSession: {
          startedAt: '2026-03-24T10:00:00.000Z',
          startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          intendedDurationSeconds: 1200,
          remainingSeconds: 900,
          meditationType: 'Vipassana',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
          endAtMs: Date.parse('2099-03-24T10:20:00.000Z'),
        },
        isPaused: true,
      })
    );

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/recovered an active timer from your previous app state/i)).toBeInTheDocument();
    expect(screen.getByText(/active timer: vipassana/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /resume active timer/i }));

    expect(screen.getByText(/^paused$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^resume$/i })).toBeInTheDocument();
  });

  it('recovers an active playlist run snapshot from local storage and resumes it from the shell banner', () => {
    localStorage.setItem(
      ACTIVE_PLAYLIST_RUN_STATE_KEY,
      JSON.stringify({
        activePlaylistRun: {
          runId: 'playlist-1-run',
          playlistId: 'playlist-1',
          playlistName: 'Evening Sequence',
          runStartedAt: '2026-03-24T10:00:00.000Z',
          items: [
            {
              id: 'item-1',
              meditationType: 'Vipassana',
              durationMinutes: 10,
            },
          ],
          currentIndex: 0,
          currentItemStartedAt: '2026-03-24T10:00:00.000Z',
          currentItemStartedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          currentItemRemainingSeconds: 600,
          currentItemEndAtMs: Date.parse('2099-03-24T10:10:00.000Z'),
          completedItems: 0,
          completedDurationSeconds: 0,
          totalIntendedDurationSeconds: 600,
        },
        isPaused: true,
      })
    );

    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/recovered an active playlist run from your previous app state/i)).toBeInTheDocument();
    expect(screen.getByText(/active playlist run: evening sequence/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /resume playlist run/i }));

    expect(screen.getByRole('heading', { level: 2, name: /evening sequence/i })).toBeInTheDocument();
    expect(screen.getByText(/^paused$/i)).toBeInTheDocument();
  });

  it('redirects /sankalpa to the Sankalpa route', () => {
    render(
      <MemoryRouter initialEntries={['/sankalpa']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Sankalpa' })).toBeInTheDocument();
    expect(screen.getByText(/review summaries and track sankalpa progress/i)).toBeInTheDocument();
  });

  it('redirects unknown routes to Home', () => {
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /quick start/i })).toBeInTheDocument();
  });
});
