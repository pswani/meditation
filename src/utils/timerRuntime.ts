interface ExtendedNavigator {
  readonly userAgent?: string;
  readonly standalone?: boolean;
}

interface TimerRuntimeDependencies {
  readonly navigator?: ExtendedNavigator;
  readonly matchMedia?: (query: string) => Pick<MediaQueryList, 'matches'>;
  readonly Notification?: typeof Notification;
}

export interface TimerRuntimeEnvironment {
  readonly isLikelyIPhoneSafariBrowser: boolean;
  readonly isStandaloneDisplayMode: boolean;
  readonly notificationCapability: 'available' | 'unavailable';
  readonly notificationPermission: NotificationPermission | 'unsupported';
  readonly canRequestNotificationPermission: boolean;
}

const NON_SAFARI_IOS_BROWSERS = /(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|Brave)/i;

function getDefaultRuntimeDependencies(): TimerRuntimeDependencies {
  return {
    navigator: typeof window !== 'undefined' ? (window.navigator as ExtendedNavigator) : undefined,
    matchMedia:
      typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : undefined,
    Notification: typeof window !== 'undefined' ? window.Notification : undefined,
  };
}

export function detectTimerRuntimeEnvironment(
  deps: TimerRuntimeDependencies = getDefaultRuntimeDependencies()
): TimerRuntimeEnvironment {
  const userAgent = deps.navigator?.userAgent ?? '';
  const isIPhone = /iPhone/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !NON_SAFARI_IOS_BROWSERS.test(userAgent);
  const isStandaloneDisplayMode =
    Boolean(deps.matchMedia?.('(display-mode: standalone)').matches) || Boolean(deps.navigator?.standalone);
  const hasNotificationApi = Boolean(deps.Notification && typeof deps.Notification === 'function');
  const notificationPermission = hasNotificationApi ? deps.Notification?.permission ?? 'default' : 'unsupported';

  return {
    isLikelyIPhoneSafariBrowser: isIPhone && isSafari && !isStandaloneDisplayMode,
    isStandaloneDisplayMode,
    notificationCapability: hasNotificationApi ? 'available' : 'unavailable',
    notificationPermission,
    canRequestNotificationPermission:
      hasNotificationApi &&
      typeof deps.Notification?.requestPermission === 'function' &&
      notificationPermission === 'default',
  };
}

export async function requestTimerNotificationPermission(
  deps: TimerRuntimeDependencies = getDefaultRuntimeDependencies()
): Promise<NotificationPermission | 'unsupported'> {
  const NotificationApi = deps.Notification;
  if (!NotificationApi || typeof NotificationApi.requestPermission !== 'function') {
    return 'unsupported';
  }

  const permission = await NotificationApi.requestPermission();
  return permission ?? NotificationApi.permission ?? 'default';
}
