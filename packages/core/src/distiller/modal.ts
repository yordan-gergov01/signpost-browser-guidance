import { accessibleNameOf } from '@hintora/core/distiller/accessibleName';
import { isSemanticallyVisible } from '@hintora/core/distiller/visibility';

const MODAL_SELECTOR =
  '[role="dialog"],[role="alertdialog"],[aria-modal="true"],dialog[open]';

/**
 * When a modal is open, only what is inside it can be acted on. Narrowing the
 * map to that subtree removes a whole class of wrong answers - pointing at a
 * button the user physically cannot reach - for the cost of one query.
 */
export function findActiveModal(root: ParentNode): Element | null {
  const candidates = Array.from(root.querySelectorAll(MODAL_SELECTOR)).filter(
    (element) => isSemanticallyVisible(element) || element.hasAttribute('open'),
  );

  // Last in document order is the closest approximation of topmost without
  // resolving stacking contexts, and matches how dialogs are appended.
  return candidates.at(-1) ?? null;
}

export function modalNameOf(modal: Element): string {
  return accessibleNameOf(modal);
}
