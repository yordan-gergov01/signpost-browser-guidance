import { useId, type InputHTMLAttributes } from 'react';

export type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Field({ label, hint, ...props }: FieldProps) {
  const id = useId();

  return (
    <div className="max-w-sm">
      <label htmlFor={id} className="block text-sm font-medium text-ink-700">
        {label}
      </label>
      <input
        id={id}
        className="mt-1 w-full rounded-md border border-ink-300 px-3 py-1.5 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
        {...props}
      />
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}
