export interface TimerCompletionNotificationDependencies {
  readonly Notification?: typeof Notification;
  readonly isDocumentHidden?: () => boolean;
}

export function canNotifyOnTimerCompletion(
  deps: TimerCompletionNotificationDependencies = {
    Notification: typeof window !== 'undefined' ? window.Notification : undefined,
    isDocumentHidden: typeof document !== 'undefined' ? () => document.visibilityState !== 'visible' : undefined,
  }
): boolean {
  if (!deps.Notification || typeof deps.Notification !== 'function') {
    return false;
  }

  if (deps.Notification.permission !== 'granted') {
    return false;
  }

  return deps.isDocumentHidden ? deps.isDocumentHidden() : false;
}

export function notifyTimerCompletion(message: string, deps: TimerCompletionNotificationDependencies = {}): void {
  const NotificationApi = deps.Notification ?? (typeof window !== 'undefined' ? window.Notification : undefined);
  const isDocumentHidden = deps.isDocumentHidden ?? (typeof document !== 'undefined' ? () => document.visibilityState !== 'visible' : undefined);
  if (!NotificationApi) {
    return;
  }

  if (!canNotifyOnTimerCompletion({ Notification: NotificationApi, isDocumentHidden })) {
    return;
  }

  new NotificationApi('Meditation timer completed', {
    body: message,
    silent: false,
    tag: 'meditation-timer-completed',
  });
}
