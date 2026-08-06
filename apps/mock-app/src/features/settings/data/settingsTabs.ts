import type { SettingsTab } from '@/features/settings/types/settings';

// Non-empty tuple type so the fallback in resolveSettingsTab is provably defined
// under noUncheckedIndexedAccess.
export const SETTINGS_TABS: readonly [SettingsTab, ...SettingsTab[]] = [
  { id: 'profile', href: '/settings/profile', label: 'Profile', testId: 'tab-profile' },
  { id: 'billing', href: '/settings/billing', label: 'Billing', testId: 'tab-billing' },
  {
    id: 'notifications',
    href: '/settings/notifications',
    label: 'Notifications',
    testId: 'tab-notifications',
  },
  {
    id: 'api-keys',
    href: '/settings/api-keys',
    label: 'API Keys',
    testId: 'tab-api-keys',
  },
];
