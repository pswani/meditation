import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TimerProvider } from '../features/timer/TimerContext';
import SettingsPage from './SettingsPage';

const TIMER_SETTINGS_KEY = 'meditation.timerSettings.v1';

function renderSettingsPage() {
  render(
    <MemoryRouter initialEntries={['/settings']}>
      <TimerProvider>
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </TimerProvider>
    </MemoryRouter>
  );
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

  it('shows unsaved-edits state and disables save when unchanged', () => {
    renderSettingsPage();

    const saveButton = screen.getByRole('button', { name: /save defaults/i });
    expect(screen.getByText(/all timer defaults are saved/i)).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/default duration \(minutes\)/i), { target: { value: '25' } });

    expect(screen.getByText(/you have unsaved changes/i)).toBeInTheDocument();
    expect(saveButton).toBeEnabled();
  });

  it('saves defaults and persists the updated settings to local storage', () => {
    renderSettingsPage();

    fireEvent.change(screen.getByLabelText(/default duration \(minutes\)/i), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /save defaults/i }));

    expect(screen.getByText(/settings saved/i)).toBeInTheDocument();

    const persisted = localStorage.getItem(TIMER_SETTINGS_KEY);
    expect(persisted).not.toBeNull();
    expect(JSON.parse(persisted ?? '{}')).toMatchObject({
      durationMinutes: 30,
      meditationType: 'Vipassana',
    });
  });

  it('blocks persistence when draft defaults are invalid', () => {
    renderSettingsPage();

    fireEvent.click(screen.getByLabelText(/enable interval bell by default/i));
    fireEvent.change(screen.getByLabelText(/default interval \(minutes\)/i), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /save defaults/i }));

    expect(screen.getByText(/less than total duration/i)).toBeInTheDocument();
    expect(screen.queryByText(/settings saved/i)).not.toBeInTheDocument();

    const persisted = localStorage.getItem(TIMER_SETTINGS_KEY);
    expect(JSON.parse(persisted ?? '{}')).toMatchObject({
      intervalEnabled: false,
      intervalMinutes: 5,
    });
  });
});
