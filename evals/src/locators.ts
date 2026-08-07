import { distillWithElements } from '@hintora/core/distiller/distill';
import { elementKey } from '@hintora/core/distiller/signature';

/**
 * A strategy for writing down where a control is, and finding it again later.
 *
 * The three naive ones are what a scripted product actually ships: a recorded
 * CSS path, the visible label, or a chain of increasingly desperate selectors.
 * They are here to be beaten, and to be honest about where they win.
 */
export type Locator = {
  name: string;
  record: (target: Element, doc: Document) => string;
  find: (recorded: string, doc: Document) => Element | null;
};

function textOf(element: Element): string {
  return (element.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function pathOf(target: Element): string {
  const steps: string[] = [];

  for (let node: Element | null = target; node && node.tagName !== 'BODY';) {
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    const index = Array.from(parent.children).indexOf(node) + 1;
    steps.unshift(`${node.tagName.toLowerCase()}:nth-child(${index})`);
    node = parent;
  }

  return `body > ${steps.join(' > ')}`;
}

/** What a recorder produces. Survives renaming, dies on any reflow. */
export const nthChildPath: Locator = {
  name: 'nth-child path',
  record: (target) => pathOf(target),
  find: (recorded, doc) => doc.querySelector(recorded),
};

/** What a human writes down. Survives a reflow, dies on a copy change. */
export const textMatch: Locator = {
  name: 'text match',
  record: (target) => textOf(target),
  find: (recorded, doc) =>
    Array.from(doc.querySelectorAll('a,button,input,select,textarea,[role]')).find(
      (element) =>
        textOf(element) === recorded || element.getAttribute('aria-label') === recorded,
    ) ?? null,
};

/** The ordered chain most teams settle on after being burned by both. */
export const selectorChain: Locator = {
  name: 'selector chain',
  record: (target) => {
    const testId = target.getAttribute('data-testid');
    if (testId) return `testid:${testId}`;
    const label = target.getAttribute('aria-label');
    if (label) return `label:${label}`;
    return `role:${target.getAttribute('role') ?? target.tagName.toLowerCase()}:${textOf(target)}`;
  },
  find: (recorded, doc) => {
    const [kind = '', ...rest] = recorded.split(':');
    const value = rest.join(':');

    if (kind === 'testid') return doc.querySelector(`[data-testid="${value}"]`);
    if (kind === 'label') return doc.querySelector(`[aria-label="${value}"]`);

    const [role = '', ...text] = value.split(':');
    const wanted = text.join(':');
    return (
      Array.from(doc.querySelectorAll(`[role="${role}"], ${role}`)).find(
        (element) => textOf(element) === wanted,
      ) ?? null
    );
  },
};

/**
 * Ours. The control is described the way the distiller describes it - role,
 * accessible name, landmark path, test id, href - and found again by matching
 * that description against a fresh reading of the page. No position, no CSS.
 */
export const fingerprint: Locator = {
  name: 'hintora fingerprint',
  record: (target, doc) => {
    const { pageMap, byId } = distillWithElements(doc);
    const entry = pageMap.elements.find((element) => byId.get(element.id) === target);
    return entry ? elementKey(entry) : '';
  },
  find: (recorded, doc) => {
    const { pageMap, byId } = distillWithElements(doc);
    const matches = pageMap.elements.filter(
      (element) => elementKey(element) === recorded,
    );
    // Two equally good matches is not a match. Guessing between them is the
    // failure mode that puts a highlight on the wrong control.
    return matches.length === 1 ? (byId.get(matches[0]!.id) ?? null) : null;
  },
};

export const LOCATORS: readonly Locator[] = [
  nthChildPath,
  textMatch,
  selectorChain,
  fingerprint,
];
