import { Link } from 'react-router';
import { SETTINGS_TABS } from '@/features/settings/data/settingsTabs';
import type { SettingsTab } from '@/features/settings/types/settings';

// Link rather than NavLink: the tab role needs aria-selected, which NavLink does
// not derive, and mixing its aria-current with aria-selected muddies the tree.
export function SettingsTabList({ active }: { active: SettingsTab }) {
  return (
    <div
      role="tablist"
      aria-label="Settings sections"
      className="flex gap-1 border-b border-ink-200"
    >
      {SETTINGS_TABS.map((tab) => {
        const selected = tab.id === active.id;
        return (
          <Link
            key={tab.id}
            to={tab.href}
            role="tab"
            aria-selected={selected}
            data-testid={tab.testId}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              selected
                ? 'border-accent-600 text-accent-700'
                : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
