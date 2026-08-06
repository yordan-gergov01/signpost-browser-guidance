export type CardButton = {
  label: string;
  variant?: 'primary' | 'danger';
  onClick: () => void;
};

// A view model, so the optional fields accept an explicit undefined rather than
// forcing every caller to build the object conditionally.
export type CardView = {
  /** Rendered as "2/4". Omitted for messages that are not a step. */
  counter?: string | undefined;
  instruction: string;
  consequence?: string | undefined;
  buttons: readonly CardButton[];
};

export type Card = {
  element: HTMLDivElement;
  render: (view: CardView) => void;
};

export function createCard(): Card {
  const element = document.createElement('div');
  element.className = 'card hidden';
  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', 'polite');

  const counter = document.createElement('span');
  counter.className = 'counter';

  const instruction = document.createElement('p');
  instruction.className = 'instruction';

  const consequence = document.createElement('p');
  consequence.className = 'consequence hidden';

  const actions = document.createElement('div');
  actions.className = 'actions';

  element.append(counter, instruction, consequence, actions);

  return {
    element,
    render(view) {
      // textContent throughout, never innerHTML. The instruction is written by a
      // model that read attacker-controllable page text, so it is treated as
      // untrusted data all the way to the screen.
      counter.textContent = view.counter ?? '';
      counter.classList.toggle('hidden', !view.counter);

      instruction.textContent = view.instruction;

      consequence.textContent = view.consequence ?? '';
      consequence.classList.toggle('hidden', !view.consequence);

      actions.replaceChildren();
      for (const spec of view.buttons) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = spec.label;
        if (spec.variant) button.className = spec.variant;
        button.addEventListener('click', spec.onClick);
        actions.append(button);
      }
    },
  };
}
