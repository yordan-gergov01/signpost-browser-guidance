import { Link, useLocation } from 'react-router';
import { NAV_ITEMS } from '@/features/navigation/data/navItems';
import { isNavItemActive } from '@/features/navigation/utils/isNavItemActive';

/** Column beside the content on a desktop, scrolling strip above it on a phone. */
export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-ink-200 bg-white px-3 py-2 md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:overflow-x-visible md:border-b-0 md:border-r md:px-3 md:py-4"
    >
      <div className="mb-0 hidden items-center gap-2.5 px-2 pb-4 md:flex">
        <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 text-sm font-bold text-white shadow-card">
          A
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-ink-900">
          Acme CRM
        </span>
      </div>

      <p className="hidden px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400 md:block">
        Workspace
      </p>

      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(item, pathname);
        return (
          <Link
            key={item.href}
            to={item.href}
            data-testid={item.testId}
            aria-current={active ? 'page' : undefined}
            className={`relative shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? 'bg-accent-50 text-accent-700 md:before:absolute md:before:inset-y-1.5 md:before:left-0 md:before:w-0.5 md:before:rounded-full md:before:bg-accent-600'
                : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
            }`}
          >
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto hidden items-center gap-2.5 rounded-lg border border-ink-200 p-2.5 md:flex">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-100 text-xs font-semibold text-ink-600">
          JD
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-ink-800">
            Jane Doe
          </span>
          <span className="block truncate text-xs text-ink-500">Acme Industries</span>
        </span>
      </div>
    </nav>
  );
}
