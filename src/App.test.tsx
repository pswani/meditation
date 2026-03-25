import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const ACTIVE_TIMER_STATE_KEY = 'meditation.activeTimerState.v1';
const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';
const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';
const CUSTOM_PLAYS_KEY = 'meditation.customPlays.v1';
const PLAYLISTS_KEY = 'meditation.playlists.v1';

describe('App shell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders home route with functional quick-start content and Sankalpa navigation label', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
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

  it('avoids redundant persistence writes on a stable initial mount', () => {
    localStorage.setItem(
      TIMER_SETTINGS_KEY,
      JSON.stringify({
        durationMinutes: 20,
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
          startedAt: '2026-03-24T09:40:00.000Z',
          endedAt: '2026-03-24T10:00:00.000Z',
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
          name: 'Morning Focus',
          meditationType: 'Ajapa',
          durationMinutes: 25,
          startSound: 'None',
          endSound: 'Temple Bell',
          mediaAssetId: '',
          mediaAssetLabel: '',
          mediaAssetPath: '',
          recordingLabel: '',
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
          name: 'Morning Sequence',
          favorite: false,
          createdAt: '2026-03-24T08:00:00.000Z',
          updatedAt: '2026-03-24T08:00:00.000Z',
          items: [
            {
              id: 'item-1',
              meditationType: 'Vipassana',
              durationMinutes: 10,
            },
          ],
        },
      ])
    );
    localStorage.setItem(
      ACTIVE_TIMER_STATE_KEY,
      JSON.stringify({
        activeSession: {
          startedAt: '2026-03-24T10:00:00.000Z',
          startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          intendedDurationSeconds: 1200,
          remainingSeconds: 600,
          meditationType: 'Vipassana',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
          endAtMs: Date.parse('2026-03-24T10:20:00.000Z'),
        },
        isPaused: true,
      })
    );

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
    setItemSpy.mockClear();
    removeItemSpy.mockClear();

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/active timer: vipassana/i)).toBeInTheDocument();
    expect(setItemSpy).not.toHaveBeenCalled();
    expect(removeItemSpy).not.toHaveBeenCalled();
  });

  it('rehydrates a persisted active timer and lets the user resume it from the shell', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T10:05:00.000Z'));

    localStorage.setItem(
      ACTIVE_TIMER_STATE_KEY,
      JSON.stringify({
        activeSession: {
          startedAt: '2026-03-24T10:00:00.000Z',
          startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          intendedDurationSeconds: 1200,
          remainingSeconds: 1200,
          meditationType: 'Vipassana',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
          endAtMs: Date.parse('2026-03-24T10:20:00.000Z'),
        },
        isPaused: false,
      })
    );

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/recovered an active timer from your previous app state/i)).toBeInTheDocument();
    expect(screen.getByText(/active timer: vipassana/i)).toBeInTheDocument();

    const persistedState = JSON.parse(localStorage.getItem(ACTIVE_TIMER_STATE_KEY) ?? '{}');
    expect(persistedState.activeSession?.remainingSeconds).toBe(900);

    fireEvent.click(screen.getByRole('button', { name: /^dismiss$/i }));
    expect(screen.queryByText(/recovered an active timer from your previous app state/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /resume active timer/i }));
    expect(screen.getByRole('heading', { level: 2, name: /\d{2}:\d{2}/i })).toBeInTheDocument();
  });

  it('clears stale persisted active timer state that can no longer be safely resumed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T10:25:00.000Z'));

    localStorage.setItem(
      ACTIVE_TIMER_STATE_KEY,
      JSON.stringify({
        activeSession: {
          startedAt: '2026-03-24T10:00:00.000Z',
          startedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          intendedDurationSeconds: 1200,
          remainingSeconds: 1200,
          meditationType: 'Ajapa',
          startSound: 'None',
          endSound: 'Temple Bell',
          intervalEnabled: false,
          intervalMinutes: 0,
          intervalSound: 'None',
          endAtMs: Date.parse('2026-03-24T10:20:00.000Z'),
        },
        isPaused: false,
      })
    );

    render(
      <MemoryRouter initialEntries={['/history']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/previous active timer was cleared because it could not be safely resumed/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resume active timer/i })).not.toBeInTheDocument();
    expect(localStorage.getItem(ACTIVE_TIMER_STATE_KEY)).toBeNull();
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
