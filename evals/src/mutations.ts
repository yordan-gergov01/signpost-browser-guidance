/**
 * What a real application does to its own DOM between two releases, or between
 * two renders. Each one is applied to a page that has already been recorded, and
 * the question is whether the recording still points at the same control.
 *
 * `survivable` is whether a locator is expected to find the target at all: when
 * the control has been removed, the correct answer is to find nothing, and a
 * strategy that returns something anyway has produced a confident error.
 */
export type Mutation = {
  name: string;
  survivable: boolean;
  apply: (target: Element, doc: Document) => void;
};

/** A copy change. The control is the same control with a different label. */
export const rename: Mutation = {
  name: 'target renamed',
  survivable: true,
  apply: (target) => {
    if (target.hasAttribute('aria-label')) {
      target.setAttribute('aria-label', `${target.getAttribute('aria-label')} now`);
      return;
    }
    target.textContent = `${target.textContent ?? ''} now`;
  },
};

/** A sibling arrives above it, which is all it takes to shift every index. */
export const reorder: Mutation = {
  name: 'siblings reordered',
  survivable: true,
  apply: (target, doc) => {
    const parent = target.parentElement;
    if (!parent) return;
    const filler = doc.createElement('div');
    filler.textContent = 'New this release';
    parent.insertBefore(filler, parent.firstChild);
  },
};

/** A design system upgrade wraps everything in two more layers. */
export const wrap: Mutation = {
  name: 'wrapped in divs',
  survivable: true,
  apply: (target, doc) => {
    const outer = doc.createElement('div');
    const inner = doc.createElement('div');
    target.replaceWith(outer);
    outer.append(inner);
    inner.append(target);
  },
};

/** Another control with the same words on it, somewhere else on the page. */
export const decoys: Mutation = {
  name: 'decoys added',
  survivable: true,
  apply: (target, doc) => {
    const decoy = target.cloneNode(true) as Element;
    decoy.removeAttribute('data-testid');
    const host = doc.createElement('footer');
    host.append(decoy);
    doc.body.append(host);
  },
};

/** The feature was retired. Finding anything here is worse than finding nothing. */
export const remove: Mutation = {
  name: 'target removed',
  survivable: false,
  apply: (target) => target.remove(),
};

export const MUTATIONS: readonly Mutation[] = [rename, reorder, wrap, decoys, remove];
