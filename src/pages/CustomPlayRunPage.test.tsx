import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const ACTIVE_CUSTOM_PLAY_RUN_STATE_KEY = 'meditation.activeCustomPlayRunState.v1';
const SESSION_LOGS_KEY = 'meditation.sessionLogs.v1';

async function flushRouteLoad() {
  await act(async () => {
    if (vi.isFakeTimers()) {
      vi.advanceTimersByTime(0);
    }
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function warmCustomPlayRunRoute() {
  await act(async () => {
    await import('./CustomPlayRunPage');
  });
}

describe('CustomPlayRunPage UX', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-02T12:05:00.000Z'));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('ends an active custom play early and saves a custom-play-aware session log', async () => {
    await warmCustomPlayRunRoute();
    localStorage.setItem(
      ACTIVE_CUSTOM_PLAY_RUN_STATE_KEY,
      JSON.stringify({
        runId: 'custom-play-1-1000',
        customPlayId: 'custom-play-1',
        customPlayName: 'Morning Focus',
        meditationType: 'Vipassana',
        recordingLabel: 'Breath emphasis',
        mediaAssetId: 'media-vipassana-sit-20',
        mediaLabel: 'Vipassana Sit (20 min)',
        mediaFilePath: '/media/custom-plays/vipassana-sit-20.mp3',
        durationSeconds: 1200,
        startedAt: '2026-04-02T12:00:00.000Z',
        startedAtMs: Date.parse('2026-04-02T12:00:00.000Z'),
        currentPositionSeconds: 300,
        isPaused: false,
        startSound: 'Temple Bell',
        endSound: 'Gong',
      })
    );

    render(
      <MemoryRouter initialEntries={['/practice/custom-plays/active']}>
        <App />
      </MemoryRouter>
    );

    await flushRouteLoad();
    expect(screen.getByRole('heading', { level: 2, name: /morning focus/i })).toBeInTheDocument();
    expect(screen.getByText(/recording: vipassana sit \(20 min\)/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /end early/i }));
    const confirmDialog = screen.getByRole('dialog', { name: /end custom play early confirmation/i });
    expect(confirmDialog).toBeInTheDocument();
    fireEvent.click(within(confirmDialog).getByRole('button', { name: /^end early$/i }));

    expect(screen.getByRole('heading', { level: 2, name: /custom play ended early/i })).toBeInTheDocument();
    expect(screen.getByText(/logged duration: 5 min/i)).toBeInTheDocument();

    const storedLogs = JSON.parse(localStorage.getItem(SESSION_LOGS_KEY) ?? '[]');
    expect(storedLogs).toHaveLength(1);
    expect(storedLogs[0]).toMatchObject({
      status: 'ended early',
      source: 'auto log',
      customPlayId: 'custom-play-1',
      customPlayName: 'Morning Focus',
      customPlayRecordingLabel: 'Breath emphasis',
      completedDurationSeconds: 300,
    });
    expect(localStorage.getItem(ACTIVE_CUSTOM_PLAY_RUN_STATE_KEY)).toBeNull();
  });
});
