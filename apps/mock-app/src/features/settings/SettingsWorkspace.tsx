import { useParams } from 'react-router';
import { SettingsTabList } from '@/features/settings/components/SettingsTabList';
import { ProfilePanel } from '@/features/settings/components/ProfilePanel';
import { BillingPanel } from '@/features/settings/components/BillingPanel';
import { NotificationsPanel } from '@/features/settings/components/NotificationsPanel';
import { ApiKeysPanel } from '@/features/settings/components/ApiKeysPanel';
import { resolveSettingsTab } from '@/features/settings/utils/resolveSettingsTab';
import type { SettingsTabId } from '@/features/settings/types/settings';

function renderPanel(tabId: SettingsTabId) {
  switch (tabId) {
    case 'billing':
      return <BillingPanel />;
    case 'notifications':
      return <NotificationsPanel />;
    case 'api-keys':
      return <ApiKeysPanel />;
    case 'profile':
      return <ProfilePanel />;
  }
}

export function SettingsWorkspace() {
  const { tab } = useParams<{ tab: string }>();
  const active = resolveSettingsTab(tab);

  return (
    <>
      <h1 className="text-xl font-semibold text-ink-900">Settings</h1>
      <SettingsTabList active={active} />
      <div role="tabpanel" aria-label={active.label} className="space-y-6">
        {renderPanel(active.id)}
      </div>
    </>
  );
}
