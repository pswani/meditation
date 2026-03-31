import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SyncStatusProvider } from '../features/sync/SyncStatusProvider';
import { TimerProvider } from '../features/timer/TimerContext';
import SettingsPage from './SettingsPage';

const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';

function createJsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function renderSettingsPage() {
  render(
    <MemoryRouter initialEntries={['/settings']}>
      <SyncStatusProvider>
        <TimerProvider>
          <Routes>
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </TimerProvider>
      </SyncStatusProvider>
    </MemoryRouter>
  );
}

async function waitForSettingsPageReady() {
  await waitFor(() => expect(screen.getByLabelText(/default duration \(minutes\)/i)).toBeEnabled());
}

describe('SettingsPage UX', () => {
  beforeEach(() => {
    localStorage.clear();
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
  });

  afterEach(() => {
    cleanup();
  });

  it('shows unsaved-edits state and disables save when unchanged', async () => {
    renderSettingsPage();

    await waitForSettingsPageReady();
    const saveButton = screen.getByRole('button', { name: /save defaults/i });
    expect(screen.getByText(/all timer defaults are saved/i)).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/default duration \(minutes\)/i), { target: { value: '25' } });

    expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument();
    expect(saveButton).toBeEnabled();
  });

  it('saves defaults and persists the updated settings to local storage', async () => {
    renderSettingsPage();

    await waitForSettingsPageReady();
    fireEvent.change(screen.getByLabelText(/default duration \(minutes\)/i), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /save defaults/i }));

    expect(await screen.findByText(/settings saved/i)).toBeInTheDocument();

    const persisted = localStorage.getItem(TIMER_SETTINGS_KEY);
    expect(persisted).not.toBeNull();
    expect(JSON.parse(persisted ?? '{}')).toMatchObject({
      durationMinutes: 30,
      meditationType: 'Vipassana',
    });
  });

  it('blocks persistence when draft defaults are invalid', async () => {
    renderSettingsPage();

    await waitForSettingsPageReady();
    fireEvent.click(screen.getByLabelText(/enable interval bell by default/i));
    fireEvent.change(screen.getByLabelText(/default interval \(minutes\)/i), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /save defaults/i }));

    expect(screen.getByText(/less than total duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/default interval \(minutes\)/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/default interval \(minutes\)/i)).toHaveAttribute(
      'aria-describedby',
      'settings-interval-error'
    );
    expect(screen.queryByText(/settings saved/i)).not.toBeInTheDocument();

    const persisted = localStorage.getItem(TIMER_SETTINGS_KEY);
    expect(JSON.parse(persisted ?? '{}')).toMatchObject({
      intervalEnabled: false,
      intervalMinutes: 5,
    });
  });

  it('locks defaults controls until backend timer settings finish hydrating', async () => {
    let resolveSettingsResponse: ((response: ReturnType<typeof createJsonResponse>) => void) | null = null;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return await new Promise((resolve) => {
            resolveSettingsResponse = resolve;
          });
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );

    renderSettingsPage();

    expect(screen.getByLabelText(/default duration \(minutes\)/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /save defaults/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reset to app defaults/i })).toBeDisabled();

    resolveSettingsResponse?.(
      createJsonResponse(200, {
        id: 'default',
        durationMinutes: 20,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
        updatedAt: '2026-03-26T12:00:00.000Z',
      })
    );

    await waitForSettingsPageReady();
    expect(screen.getByRole('button', { name: /reset to app defaults/i })).toBeEnabled();
  });

  it('waits for backend persistence before showing a saved message', async () => {
    let resolvePersistResponse: ((response: ReturnType<typeof createJsonResponse>) => void) | null = null;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = init?.method ?? 'GET';

        if (url.endsWith('/api/settings/timer') && method === 'GET') {
          return createJsonResponse(200, {
            id: 'default',
            durationMinutes: 20,
            meditationType: 'Vipassana',
            startSound: 'None',
            endSound: 'Temple Bell',
            intervalEnabled: false,
            intervalMinutes: 5,
            intervalSound: 'Temple Bell',
            updatedAt: '2026-03-26T12:00:00.000Z',
          });
        }

        if (url.endsWith('/api/settings/timer') && method === 'PUT') {
          return await new Promise((resolve) => {
            resolvePersistResponse = resolve;
          });
        }

        if (url.endsWith('/api/session-logs') && method === 'GET') {
          return createJsonResponse(200, []);
        }

        return createJsonResponse(404, { message: `Unhandled test fetch for ${method} ${url}` });
      })
    );

    renderSettingsPage();

    await waitForSettingsPageReady();
    fireEvent.change(screen.getByLabelText(/default duration \(minutes\)/i), { target: { value: '28' } });
    fireEvent.click(screen.getByRole('button', { name: /save defaults/i }));

    expect(screen.getByText(/saving timer preferences to the backend/i)).toBeInTheDocument();
    expect(screen.queryByText(/^settings saved\.$/i)).not.toBeInTheDocument();

    resolvePersistResponse?.(
      createJsonResponse(200, {
        id: 'default',
        durationMinutes: 28,
        meditationType: 'Vipassana',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
        updatedAt: '2026-03-26T12:05:00.000Z',
      })
    );

    expect(await screen.findByText(/^settings saved\.$/i)).toBeInTheDocument();
  });

  it('resets persisted defaults back to the app baseline', async () => {
    renderSettingsPage();

    await waitForSettingsPageReady();
    fireEvent.click(screen.getByRole('button', { name: /reset to app defaults/i }));

    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem(TIMER_SETTINGS_KEY) ?? '{}')).toMatchObject({
        timerMode: 'fixed',
        durationMinutes: 20,
        lastFixedDurationMinutes: 20,
        meditationType: '',
        startSound: 'None',
        endSound: 'Temple Bell',
        intervalEnabled: false,
        intervalMinutes: 5,
        intervalSound: 'Temple Bell',
      })
    );
  });
});
