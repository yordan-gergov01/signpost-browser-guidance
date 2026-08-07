import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'success' | 'info' | 'danger';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
  success: 'bg-success-50 text-success-700 ring-success-200',
  info: 'bg-accent-50 text-accent-700 ring-accent-200',
  danger: 'bg-danger-50 text-danger-700 ring-danger-200',
};

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
