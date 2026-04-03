import { describe, expect, it, vi } from 'vitest';
import { detectTimerRuntimeEnvironment, requestTimerNotificationPermission } from './timerRuntime';

const iphoneSafariUserAgent =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

describe('timerRuntime', () => {
  it('detects iPhone Safari browser guidance relevance', () => {
    const environment = detectTimerRuntimeEnvironment({
      navigator: {
        userAgent: iphoneSafariUserAgent,
      },
      matchMedia: () => ({ matches: false }),
    });

    expect(environment.isLikelyIPhoneSafariBrowser).toBe(true);
    expect(environment.isStandaloneDisplayMode).toBe(false);
  });

  it('suppresses Safari guidance for unrelated desktop contexts', () => {
    const environment = detectTimerRuntimeEnvironment({
      navigator: {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      },
      matchMedia: () => ({ matches: false }),
    });

    expect(environment.isLikelyIPhoneSafariBrowser).toBe(false);
  });

  it('treats installed standalone display mode as a separate context', () => {
    const environment = detectTimerRuntimeEnvironment({
      navigator: {
        userAgent: iphoneSafariUserAgent,
        standalone: true,
      },
      matchMedia: () => ({ matches: true }),
    });

    expect(environment.isStandaloneDisplayMode).toBe(true);
    expect(environment.isLikelyIPhoneSafariBrowser).toBe(false);
  });

  it('reports notification capability and requestability when the API is available', () => {
    const NotificationMock = class {
      static permission: NotificationPermission = 'default';
      static requestPermission = vi.fn(async () => 'granted' satisfies NotificationPermission);
    } as unknown as typeof Notification;

    const environment = detectTimerRuntimeEnvironment({
      Notification: NotificationMock,
    });

    expect(environment.notificationCapability).toBe('available');
    expect(environment.notificationPermission).toBe('default');
    expect(environment.canRequestNotificationPermission).toBe(true);
  });

  it('returns unsupported when notification permission cannot be requested', async () => {
    await expect(requestTimerNotificationPermission()).resolves.toBe('unsupported');
  });

  it('requests notification permission when supported', async () => {
    const requestPermission = vi.fn(async () => 'granted' satisfies NotificationPermission);
    const NotificationMock = class {
      static permission: NotificationPermission = 'default';
      static requestPermission = requestPermission;
    } as unknown as typeof Notification;

    await expect(
      requestTimerNotificationPermission({
        Notification: NotificationMock,
      })
    ).resolves.toBe('granted');
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });
});
