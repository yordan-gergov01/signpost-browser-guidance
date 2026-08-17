import type { ReactNode } from 'react';
import { Sidebar } from '@/features/navigation/Sidebar';

/**
 * One nav element, reflowed rather than duplicated: a second copy for small
 * screens would put two "Contacts" links in the page map and hand the resolver
 * an ambiguity the application does not actually have.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky header: the overlay has to keep the spotlight aligned under it. */}
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-ink-200 bg-white/85 px-4 py-2.5 backdrop-blur-sm sm:px-6">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400"
            >
              <circle
                cx="7"
                cy="7"
                r="4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M10.5 10.5 14 14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="search"
              aria-label="Search Business CRM"
              placeholder="Search"
              className="w-full rounded-lg border border-ink-200 bg-ink-50 py-1.5 pl-8 pr-3 text-sm text-ink-800 outline-none transition placeholder:text-ink-400 focus:border-accent-500 focus:bg-white focus:ring-4 focus:ring-accent-100"
            />
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            {/* Business's Help button, wired to Signpost by one attribute. There is no
                Signpost affordance anywhere on this page; the host owns the door. */}
            <button
              type="button"
              data-signpost-trigger=""
              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-600 transition hover:bg-ink-100 hover:text-ink-900"
            >
              Help
            </button>
            <button
              type="button"
              aria-label="Account menu"
              className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-xs font-semibold text-white shadow-card"
            >
              JD
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
