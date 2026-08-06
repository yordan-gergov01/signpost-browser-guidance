import { SETTINGS_TABS } from '@/features/settings/data/settingsTabs';
import type { SettingsTab } from '@/features/settings/types/settings';

// Falls back to the first tab so an unknown :tab param renders Profile instead
// of an empty panel.
export function resolveSettingsTab(tabId: string | undefined): SettingsTab {
  return SETTINGS_TABS.find((tab) => tab.id === tabId) ?? SETTINGS_TABS[0];
}
