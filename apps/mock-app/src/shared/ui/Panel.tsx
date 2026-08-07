import { useId, type ReactNode } from 'react';

export type PanelProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

// aria-labelledby promotes the section to a named region landmark, which is the
// signal the distiller turns into a section path.
export function Panel({ title, description, actions, children }: PanelProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-ink-200"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-200 bg-gradient-to-b from-white to-ink-50/60 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2
            id={headingId}
            className="text-[13px] font-semibold tracking-tight text-ink-900"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-ink-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}
