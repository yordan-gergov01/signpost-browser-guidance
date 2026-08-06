import { useEffect, useId, useRef, type ReactNode } from 'react';

export type DialogProps = {
  title: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
};

// Real role="dialog" with aria-modal, not a styled div: the distiller narrows
// the PageMap to the topmost modal, which only works if the app declares one.
export function Dialog({ title, onClose, footer, children }: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-lg bg-white shadow-xl outline-none"
      >
        <header className="border-b border-ink-200 px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold text-ink-900">
            {title}
          </h2>
        </header>
        <div className="space-y-3 p-4">{children}</div>
        <footer className="flex justify-end gap-2 border-t border-ink-200 px-4 py-3">
          {footer}
        </footer>
      </div>
    </div>
  );
}
