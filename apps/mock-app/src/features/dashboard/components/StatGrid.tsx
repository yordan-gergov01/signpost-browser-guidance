import type { Stat } from '@/features/dashboard/types/dashboard';

export function StatGrid({ stats }: { stats: readonly Stat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl bg-white p-4 shadow-card ring-1 ring-ink-200 sm:p-5"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-ink-500">
            {stat.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink-900 tabular-nums">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
