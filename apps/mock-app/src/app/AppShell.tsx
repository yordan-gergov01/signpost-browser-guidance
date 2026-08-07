import type { ReactNode } from 'react';
import { Sidebar } from '@/features/navigation/Sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky header: the overlay has to keep the spotlight aligned under it. */}
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink-200 bg-white px-6 py-3">
          <input
            type="search"
            aria-label="Search Acme CRM"
            placeholder="Search"
            className="w-72 rounded-md border border-ink-300 px-3 py-1.5 text-sm outline-none focus:border-accent-500"
          />
          <div className="flex items-center gap-2">
            {/* Acme's Help button, wired to Hintora by one attribute. There is no
                Hintora affordance anywhere on this page; the host owns the door. */}
            <button
              type="button"
              data-hintora-trigger=""
              className="rounded-md px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-200"
            >
              Help
            </button>
            <button
              type="button"
              aria-label="Account menu"
              className="rounded-full bg-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700"
            >
              JD
            </button>
          </div>
        </header>
        <main className="flex-1 space-y-6 p-6">{children}</main>
      </div>
    </div>
  );
}
