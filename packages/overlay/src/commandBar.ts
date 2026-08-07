export type Suggestion = { label: string; intent: string };

export type CommandBarCallbacks = {
  onSubmit: (intent: string) => void;
  onDismiss: () => void;
};

export type CommandBar = {
  element: HTMLDivElement;
  open: (suggestions: readonly Suggestion[], centreX: number) => void;
  close: () => void;
  isOpen: () => boolean;
};

/**
 * Transient by design. It exists while the user is asking and then it is gone -
 * there is no docked bar and no bubble left behind, because a guide that is
 * always on screen is competing with the product it is supposed to serve.
 */
export function createCommandBar(callbacks: CommandBarCallbacks): CommandBar {
  const element = document.createElement('div');
  element.className = 'bar surface hidden';

  const row = document.createElement('div');
  row.className = 'bar__row';

  const mark = document.createElement('span');
  mark.className = 'mark';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'What are you trying to do?';
  input.setAttribute('aria-label', 'Ask Hintora');

  const hint = document.createElement('kbd');
  hint.textContent = 'esc';

  const suggestions = document.createElement('div');
  suggestions.className = 'suggest';

  row.append(mark, input, hint);
  element.append(row, suggestions);

  hint.addEventListener('click', () => callbacks.onDismiss());

  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    const intent = input.value.trim();
    if (intent) callbacks.onSubmit(intent);
  });

  return {
    element,

    open(items, centreX) {
      element.style.left = `${centreX}px`;
      element.classList.remove('hidden');
      input.value = '';

      suggestions.replaceChildren();
      items.forEach((item, position) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'suggest__item';
        option.textContent = item.label;
        option.style.animationDelay = `${50 + position * 45}ms`;
        option.addEventListener('click', () => callbacks.onSubmit(item.intent));
        suggestions.append(option);
      });
      suggestions.classList.toggle('hidden', items.length === 0);

      // Focus after the frame that unhides it, or the browser ignores it.
      requestAnimationFrame(() => input.focus());
    },

    close() {
      element.classList.add('hidden');
    },

    isOpen() {
      return !element.classList.contains('hidden');
    },
  };
}
