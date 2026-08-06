import type { Stat } from '@/features/dashboard/types/dashboard';

export function StatGrid({ stats }: { stats: readonly Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-ink-200"
        >
          <p className="text-xs font-medium text-ink-500">{stat.label}</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
