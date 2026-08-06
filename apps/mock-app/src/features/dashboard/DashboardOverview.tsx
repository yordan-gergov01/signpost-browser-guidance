import { StatGrid } from '@/features/dashboard/components/StatGrid';
import { RecentActivityPanel } from '@/features/dashboard/components/RecentActivityPanel';
import { buildStats } from '@/features/dashboard/utils/buildStats';

export function DashboardOverview() {
  const stats = buildStats();

  return (
    <>
      <h1 className="text-xl font-semibold text-ink-900">Dashboard</h1>
      <StatGrid stats={stats} />
      <RecentActivityPanel />
    </>
  );
}
