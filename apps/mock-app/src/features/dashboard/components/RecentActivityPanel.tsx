import { Link } from 'react-router';
import { Panel } from '@/shared/ui/Panel';
import { RECENT_ACTIVITY } from '@/features/dashboard/data/recentActivity';

export function RecentActivityPanel() {
  return (
    <Panel title="Recent activity" description="Last 7 days">
      <ul className="divide-y divide-ink-200 text-sm">
        {RECENT_ACTIVITY.map((entry) => (
          <li key={entry} className="py-2">
            {entry}
          </li>
        ))}
      </ul>
      <Link
        to="/contacts"
        className="mt-3 inline-block text-sm font-medium text-accent-600 hover:underline"
      >
        View all contacts
      </Link>
    </Panel>
  );
}
