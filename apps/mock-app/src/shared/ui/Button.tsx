import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent-600 text-white shadow-card hover:bg-accent-700 active:bg-accent-700',
  secondary:
    'bg-white text-ink-700 ring-1 ring-ink-200 shadow-card hover:bg-ink-50 hover:text-ink-900',
  danger: 'bg-danger-600 text-white shadow-card hover:bg-danger-700',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
