import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TimerProvider } from '../features/timer/TimerContext';
import PracticePage from './PracticePage';

const ACTIVE_PLAYLIST_RUN_STATE_KEY = 'meditation.activePlaylistRunState.v1';

describe('PracticePage UX', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps required meditation type error hidden until start attempt', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TimerProvider>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </TimerProvider>
      </MemoryRouter>
    );

    expect(screen.queryByText(/meditation type is required/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    expect(screen.getByText(/meditation type is required/i)).toBeInTheDocument();
  });

  it('renders and dismisses entry guidance passed from route state', () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/practice',
            state: {
              entryMessage: 'Quick start needs valid defaults.',
            },
          },
        ]}
      >
        <TimerProvider>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </TimerProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/quick start needs valid defaults/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^dismiss$/i }));
    expect(screen.queryByText(/quick start needs valid defaults/i)).not.toBeInTheDocument();
  });

  it('keeps management-heavy practice tools collapsed until requested', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TimerProvider>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </TimerProvider>
      </MemoryRouter>
    );

    const toolsToggle = screen.getByRole('button', { name: /show tools/i });
    expect(toolsToggle).toBeInTheDocument();
    expect(toolsToggle).toHaveAttribute('aria-expanded', 'false');
    expect(toolsToggle).toHaveAttribute('aria-controls', 'practice-tools-content');
    expect(screen.queryByRole('heading', { name: /custom plays/i })).not.toBeInTheDocument();

    fireEvent.click(toolsToggle);
    expect(screen.getByRole('button', { name: /hide tools/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: /custom plays/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open playlists/i })).toBeInTheDocument();
  });

  it('exposes explicit expanded state for advanced timer settings', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TimerProvider>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </TimerProvider>
      </MemoryRouter>
    );

    const advancedToggle = screen.getByRole('button', { name: /show advanced options/i });
    expect(advancedToggle).toHaveAttribute('aria-expanded', 'false');
    expect(advancedToggle).toHaveAttribute('aria-controls', 'advanced-timer-settings');

    fireEvent.click(advancedToggle);

    expect(screen.getByRole('button', { name: /hide advanced options/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText(/^start sound \(optional\)$/i)).toBeInTheDocument();
  });

  it('disables timer start and shows guidance when playlist run is active', () => {
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
              meditationType: 'Vipassana',
              durationMinutes: 10,
            },
          ],
          currentIndex: 0,
          currentItemStartedAt: '2026-03-24T10:00:00.000Z',
          currentItemStartedAtMs: Date.parse('2026-03-24T10:00:00.000Z'),
          currentItemRemainingSeconds: 500,
          currentItemEndAtMs: Date.parse('2099-03-24T10:10:00.000Z'),
          completedItems: 0,
          completedDurationSeconds: 0,
          totalIntendedDurationSeconds: 600,
        },
        isPaused: false,
      })
    );

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TimerProvider>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </TimerProvider>
      </MemoryRouter>
    );

    const startButton = screen.getByRole('button', { name: /start session/i });
    expect(startButton).toBeDisabled();
    const guidanceText = screen.getByText(/resume or end the playlist run before starting a separate timer session/i);
    expect(guidanceText).toBeInTheDocument();

    const guidanceBanner = guidanceText.closest('.status-banner');
    expect(guidanceBanner).not.toBeNull();
    expect(startButton).toHaveAttribute('aria-describedby', 'timer-start-blocked-message');
    expect(within(guidanceBanner ?? document.body).getByRole('button', { name: /resume playlist run/i })).toBeInTheDocument();
  });
});
