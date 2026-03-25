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

    const toolsButton = screen.getByRole('button', { name: /show tools/i });
    expect(toolsButton).toBeInTheDocument();
    expect(toolsButton).toHaveAttribute('aria-expanded', 'false');
    expect(toolsButton).toHaveAttribute('aria-controls', 'practice-tools-panel');
    expect(screen.queryByRole('heading', { name: /custom plays/i })).not.toBeInTheDocument();

    fireEvent.click(toolsButton);
    expect(screen.getByRole('button', { name: /hide tools/i })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('heading', { name: /custom plays/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open playlists/i })).toBeInTheDocument();
  });

  it('exposes expanded state and invalid-field semantics in timer setup controls', () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <TimerProvider>
          <Routes>
            <Route path="/practice" element={<PracticePage />} />
          </Routes>
        </TimerProvider>
      </MemoryRouter>
    );

    const advancedButton = screen.getByRole('button', { name: /show advanced options/i });
    expect(advancedButton).toHaveAttribute('aria-expanded', 'false');
    expect(advancedButton).toHaveAttribute('aria-controls', 'practice-advanced-options');

    fireEvent.click(advancedButton);

    const intervalCheckbox = screen.getByRole('checkbox', { name: /enable interval bell/i });
    expect(intervalCheckbox).toHaveAttribute('aria-controls', 'practice-interval-options');
    expect(intervalCheckbox).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: /start session/i }));

    const meditationTypeSelect = screen.getByRole('combobox', { name: /meditation type/i });
    expect(meditationTypeSelect).toHaveAttribute('aria-invalid', 'true');
    expect(meditationTypeSelect).toHaveAttribute('aria-describedby', 'practice-meditation-type-error');
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

    expect(screen.getByRole('button', { name: /start session/i })).toBeDisabled();
    const guidanceText = screen.getByText(/resume or end the playlist run before starting a separate timer session/i);
    expect(guidanceText).toBeInTheDocument();

    const guidanceBanner = guidanceText.closest('.status-banner');
    expect(guidanceBanner).not.toBeNull();
    expect(within(guidanceBanner ?? document.body).getByRole('button', { name: /resume playlist run/i })).toBeInTheDocument();
  });
});
