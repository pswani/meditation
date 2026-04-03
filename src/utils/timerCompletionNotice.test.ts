import { describe, expect, it, vi } from 'vitest';
import { canNotifyOnTimerCompletion, notifyTimerCompletion } from './timerCompletionNotice';

describe('timer completion notifications', () => {
  it('returns false when Notification API is unavailable', () => {
    expect(canNotifyOnTimerCompletion({ isDocumentHidden: () => true })).toBe(false);
  });

  it('returns false when permission is not granted', () => {
    const NotificationMock = class {
      static permission: NotificationPermission = 'denied';
      constructor() {}
    } as unknown as typeof Notification;

    expect(canNotifyOnTimerCompletion({ Notification: NotificationMock, isDocumentHidden: () => true })).toBe(false);
  });

  it('returns false when document is visible even if permission is granted', () => {
    const NotificationMock = class {
      static permission: NotificationPermission = 'granted';
      constructor() {}
    } as unknown as typeof Notification;

    expect(canNotifyOnTimerCompletion({ Notification: NotificationMock, isDocumentHidden: () => false })).toBe(false);
  });

  it('creates a completion notification only when permission is granted and document is hidden', () => {
    const notificationConstructor = vi.fn();
    const NotificationMock = class {
      static permission: NotificationPermission = 'granted';

      constructor(title: string, options?: NotificationOptions) {
        notificationConstructor(title, options);
      }
    } as unknown as typeof Notification;

    notifyTimerCompletion('Your session has completed.', {
      Notification: NotificationMock,
      isDocumentHidden: () => true,
    });

    expect(notificationConstructor).toHaveBeenCalledWith('Meditation timer completed', {
      body: 'Your session has completed.',
      silent: false,
      tag: 'meditation-timer-completed',
    });
  });

  it('does not create a notification when document is visible', () => {
    const notificationConstructor = vi.fn();
    const NotificationMock = class {
      static permission: NotificationPermission = 'granted';

      constructor(title: string, options?: NotificationOptions) {
        notificationConstructor(title, options);
      }
    } as unknown as typeof Notification;

    notifyTimerCompletion('Your session has completed.', {
      Notification: NotificationMock,
      isDocumentHidden: () => false,
    });

    expect(notificationConstructor).not.toHaveBeenCalled();
  });
});
