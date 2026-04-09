import type { TimerSettings } from '../types/timer';
import { detectTimerRuntimeEnvironment } from '../utils/timerRuntime';

export type SavePhase = 'idle' | 'awaiting-sync-start' | 'saving';
export type SaveMessageTone = 'ok' | 'status' | 'warn';
export type NotificationRuntime = ReturnType<typeof detectTimerRuntimeEnvironment>;

export function getNotificationCapabilityCopy(capability: NotificationRuntime['notificationCapability']): string {
  return capability === 'available' ? 'Available in this browser context.' : 'Unavailable in this browser context.';
}

export function getNotificationPermissionCopy(permission: NotificationRuntime['notificationPermission']): string {
  switch (permission) {
    case 'granted':
      return 'Allowed.';
    case 'denied':
      return 'Blocked.';
    case 'default':
      return 'Not requested yet.';
    default:
      return 'Unavailable.';
  }
}

export function hasTimerSettingsChanges(current: TimerSettings, baseline: TimerSettings): boolean {
  return (
    current.timerMode !== baseline.timerMode ||
    current.durationMinutes !== baseline.durationMinutes ||
    current.lastFixedDurationMinutes !== baseline.lastFixedDurationMinutes ||
    current.meditationType !== baseline.meditationType ||
    current.startSound !== baseline.startSound ||
    current.endSound !== baseline.endSound ||
    current.intervalEnabled !== baseline.intervalEnabled ||
    current.intervalMinutes !== baseline.intervalMinutes ||
    current.intervalSound !== baseline.intervalSound
  );
}
