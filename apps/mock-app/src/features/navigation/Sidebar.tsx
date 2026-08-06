import { Link, useLocation } from 'react-router';
import { NAV_ITEMS } from '@/features/navigation/data/navItems';
import { isNavItemActive } from '@/features/navigation/utils/isNavItemActive';

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Main"
      className="flex w-56 shrink-0 flex-col gap-1 border-r border-ink-200 bg-white p-3"
    >
      <div className="mb-4 flex items-center gap-2 px-2">
        <span className="grid size-7 place-items-center rounded bg-accent-600 text-sm font-bold text-white">
          A
        </span>
        <span className="text-sm font-semibold text-ink-900">Acme CRM</span>
      </div>

      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(item, pathname);
        return (
          <Link
            key={item.href}
            to={item.href}
            data-testid={item.testId}
            aria-current={active ? 'page' : undefined}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              active ? 'bg-accent-50 text-accent-700' : 'text-ink-600 hover:bg-ink-100'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
