export type PrimaryRoutePath = '/' | '/practice' | '/history' | '/goals' | '/settings';

export interface PrimaryNavItem {
  readonly to: PrimaryRoutePath;
  readonly label: string;
  readonly eyebrow: string;
  readonly title: string;
}

export const primaryNavItems: readonly PrimaryNavItem[] = [
  { to: '/', label: 'Home', eyebrow: 'Daily Practice', title: 'Home' },
  { to: '/practice', label: 'Practice', eyebrow: 'Meditation Tools', title: 'Practice' },
  { to: '/history', label: 'History', eyebrow: 'Session Log', title: 'History' },
  { to: '/goals', label: 'Goals', eyebrow: 'Goal Tracking', title: 'Sankalpa' },
  { to: '/settings', label: 'Settings', eyebrow: 'Preferences', title: 'Settings' },
];

const homeNavItem = primaryNavItems[0];

export function getActiveNavItem(pathname: string): PrimaryNavItem {
  const match = primaryNavItems.find((item) => {
    if (item.to === '/') {
      return pathname === '/';
    }

    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  });

  return match ?? homeNavItem;
}
