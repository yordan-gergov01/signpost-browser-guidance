import type { ReactNode } from 'react';

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-600">
      {children}
    </span>
  );
}
