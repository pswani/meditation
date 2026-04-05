import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const iphoneSafariUserAgent =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

async function waitForPracticeSetupReady() {
  await waitFor(() => expect(screen.getAllByLabelText(/meditation type/i).length).toBeGreaterThan(0));
}

describe('ActiveTimerPage UX', () => {
  const originalUserAgent = window.navigator.userAgent;

  beforeEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    });
  });

  afterEach(() => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: originalUserAgent,
    });
  });

  it('requires confirmation before ending early', async () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    await waitForPracticeSetupReady();
    const meditationTypeSelect = screen.getAllByLabelText(/meditation type/i)[0];
    fireEvent.change(meditationTypeSelect, { target: { value: 'Vipassana' } });
    await waitFor(() => expect(screen.getByRole('button', { name: /start session/i })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    expect(await screen.findByRole('button', { name: /end early/i })).toBeInTheDocument();
    expect(screen.queryByText(/on iphone safari browser tabs/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /end early/i }));
    expect(screen.getByRole('dialog', { name: /end session early confirmation/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continue session/i }));
    expect(screen.queryByRole('dialog', { name: /end session early confirmation/i })).not.toBeInTheDocument();
  });

  it('shows elapsed time and end-session wording for open-ended sessions', async () => {
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    await waitForPracticeSetupReady();
    fireEvent.click(screen.getByRole('radio', { name: /open-ended/i }));

    const meditationTypeSelect = screen.getAllByLabelText(/meditation type/i)[0];
    fireEvent.change(meditationTypeSelect, { target: { value: 'Vipassana' } });

    const startButton = screen.getByRole('button', { name: /start open-ended session/i });
    await waitFor(() => expect(startButton).toBeEnabled());
    fireEvent.click(startButton);

    expect(await screen.findByText(/elapsed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /end session/i })).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(
      screen.getByText(/stay present\. pause or resume anytime, then end the session whenever it feels complete\./i)
    ).toBeInTheDocument();
  });

  it('shows iPhone Safari guidance only in likely relevant runtime contexts', async () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      configurable: true,
      value: iphoneSafariUserAgent,
    });

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    await waitForPracticeSetupReady();
    const meditationTypeSelect = screen.getAllByLabelText(/meditation type/i)[0];
    fireEvent.change(meditationTypeSelect, { target: { value: 'Vipassana' } });
    await waitFor(() => expect(screen.getByRole('button', { name: /start session/i })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));

    expect(
      screen.getByText(/on iphone safari browser tabs, if the phone is locked before this timer ends/i)
    ).toBeInTheDocument();
  });

  it('explains deferred completion after foreground catch-up', async () => {
    const dateNowSpy = vi.spyOn(Date, 'now');
    dateNowSpy.mockReturnValue(Date.parse('2026-04-03T12:00:00.000Z'));

    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>
    );

    await waitForPracticeSetupReady();
    fireEvent.change(screen.getByLabelText(/duration \(minutes\)/i), { target: { value: '1' } });
    fireEvent.change(screen.getAllByLabelText(/meditation type/i)[0], { target: { value: 'Vipassana' } });
    await waitFor(() => expect(screen.getByRole('button', { name: /start session/i })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: /start session/i }));
    expect(await screen.findByRole('button', { name: /end early/i })).toBeInTheDocument();

    dateNowSpy.mockReturnValue(Date.parse('2026-04-03T12:01:02.000Z'));
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    document.dispatchEvent(new Event('visibilitychange'));

    expect(
      await screen.findByText(/this fixed timer reached its scheduled end while safari was in the background/i)
    ).toBeInTheDocument();
  });
});
