import { TRIGGER_ATTRIBUTE } from '@hintora/core/config/attributes';
import { MAX_INTENT_LENGTH } from '@hintora/core/config/budgets';

export type TriggerTarget = {
  ask: () => void;
  run: (intent: string) => void;
};

// JSX renders a valueless custom attribute as the string "true", so a React host
// writing `data-hintora-trigger` gets that instead of an empty value. Reading it
// as an intent would send "true" to the model on every Help click.
const NO_INTENT = new Set(['', 'true']);

/**
 * Binds the host application's own controls, marked with `data-hintora-trigger`.
 * An empty value opens the command bar; a value is the intent to run.
 *
 * Delegated rather than bound per element, because the host is a single page
 * application and their Help button will be mounted, unmounted and remounted by
 * a router we know nothing about. One listener on the document outlives all of
 * it, and covers controls that did not exist when we loaded.
 */
export function bindTriggers(doc: Document, target: TriggerTarget): () => void {
  const onClick = (event: Event): void => {
    if (event.defaultPrevented) return;

    const node = event.target;
    if (!(node instanceof Element)) return;

    const trigger = node.closest(`[${TRIGGER_ATTRIBUTE}]`);
    if (!trigger) return;

    // A navigation would unload the page and take the session with it, which
    // makes a link trigger useless unless we claim the click.
    if (trigger instanceof HTMLAnchorElement) event.preventDefault();

    // Attribute text is host page content on its way into a prompt, so it is
    // bounded here as well as on the server.
    const intent = trigger.getAttribute(TRIGGER_ATTRIBUTE)?.trim() ?? '';
    if (NO_INTENT.has(intent)) target.ask();
    else target.run(intent.slice(0, MAX_INTENT_LENGTH));
  };

  doc.addEventListener('click', onClick);
  return () => doc.removeEventListener('click', onClick);
}
