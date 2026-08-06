import type { NavItem } from '@/features/navigation/types/navigation';

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: '/dashboard',
    section: '/dashboard',
    label: 'Dashboard',
    testId: 'nav-dashboard',
  },
  { href: '/contacts', section: '/contacts', label: 'Contacts', testId: 'nav-contacts' },
  { href: '/deals', section: '/deals', label: 'Deals', testId: 'nav-deals' },
  {
    href: '/settings/profile',
    section: '/settings',
    label: 'Settings',
    testId: 'nav-settings',
  },
];
