import type { NotificationRuntime, SaveMessageTone } from '../../pages/settingsPageHelpers';
import { getNotificationCapabilityCopy, getNotificationPermissionCopy } from '../../pages/settingsPageHelpers';

interface NotificationSettingsPanelProps {
  readonly notificationRuntime: NotificationRuntime;
  readonly notificationMessage: string | null;
  readonly notificationMessageTone: SaveMessageTone;
  readonly isRequestingNotificationPermission: boolean;
  readonly notificationActionLabel: string;
  readonly onEnableCompletionNotifications: () => void;
}

export function NotificationSettingsPanel({
  notificationRuntime,
  notificationMessage,
  notificationMessageTone,
  isRequestingNotificationPermission,
  notificationActionLabel,
  onEnableCompletionNotifications,
}: NotificationSettingsPanelProps) {
  return (
    <section className="settings-panel">
      <h3 className="section-title">Completion Notifications</h3>
      <div className="mode-hint-card">
        <strong>Optional completion notice</strong>
        <p className="section-subtitle">
          If the browser allows it, the app can post a timer completion notice while the app is not visible.
        </p>
      </div>

      {notificationMessage ? (
        <div
          className={`status-banner ${notificationMessageTone === 'ok' ? 'ok' : notificationMessageTone === 'warn' ? 'warn' : ''}`}
          role="status"
        >
          <p>{notificationMessage}</p>
        </div>
      ) : null}

      <p className="section-subtitle">Capability: {getNotificationCapabilityCopy(notificationRuntime.notificationCapability)}</p>
      <p className="section-subtitle">Permission: {getNotificationPermissionCopy(notificationRuntime.notificationPermission)}</p>

      {notificationRuntime.isLikelyIPhoneSafariBrowser ? (
        <p className="hint-text">
          In iPhone Safari browser tabs, timer completion can still wait until Safari returns to the foreground. This setting
          only helps when browser support and permission are both available.
        </p>
      ) : null}

      <div className="timer-actions">
        <button
          type="button"
          className={notificationRuntime.canRequestNotificationPermission ? '' : 'secondary'}
          disabled={!notificationRuntime.canRequestNotificationPermission || isRequestingNotificationPermission}
          onClick={onEnableCompletionNotifications}
        >
          {notificationActionLabel}
        </button>
      </div>
    </section>
  );
}
