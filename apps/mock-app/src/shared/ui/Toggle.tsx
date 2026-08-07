import { useId } from 'react';

export type ToggleProps = {
  name: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
};

export function Toggle({ name, label, description, defaultChecked }: ToggleProps) {
  const id = useId();

  return (
    <div className="flex items-start gap-3 border-b border-ink-100 py-3 last:border-b-0">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 rounded accent-accent-600"
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-ink-800">
          {label}
        </label>
        {description ? <p className="text-xs text-ink-500">{description}</p> : null}
      </div>
    </div>
  );
}
