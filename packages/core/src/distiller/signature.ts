import type { PageElement, PageMap } from '@signpost/core/types/pageMap';

/**
 * What a control is, independent of what it is currently doing.
 *
 * Snapshot ids are positional and only live as long as the snapshot that issued
 * them, so anything the loop needs to remember across two looks at a page has to
 * be remembered by description instead. This is the poor relation of a real
 * fingerprint: no weighting, no tolerance for a renamed label. It is enough to
 * recognise a control we have already tried on a page that has not moved.
 */
export function elementKey(element: PageElement): string {
  return [
    element.role,
    element.name,
    element.section.join('>'),
    element.testId ?? '',
    element.href ?? '',
  ].join('|');
}

/** State the application owns: nothing here changes because a user typed. */
function appliedState(element: PageElement): string {
  return [
    element.state.disabled ? 'disabled' : '',
    element.state.checked === undefined ? '' : `checked:${element.state.checked}`,
    element.state.expanded === undefined ? '' : `expanded:${element.state.expanded}`,
    element.state.selected ? 'selected' : '',
  ].join('|');
}

/**
 * What a control is currently doing, including what has been put into it.
 *
 * Only ever compared against the one control the user was sent to. A field
 * elsewhere on the page taking a value says nothing about whether the control we
 * pointed at works.
 */
export function elementState(element: PageElement): string {
  return `${appliedState(element)}|${element.value ?? ''}`;
}

/**
 * Whether the page changed in a way that counts as progress.
 *
 * Not a DOM diff. A React render replaces whole subtrees and a hover restyles
 * half of them, and neither means the user got anywhere. The signature is taken
 * over the same reduction the model is given, so anything it cannot see is
 * something the model could not have acted on either.
 *
 * Three things are left out on purpose:
 *
 * - geometry and viewport membership, because scrolling is not progress;
 * - field values, because a user typing into a search box they were never sent
 *   to would otherwise close the step they are actually stuck on;
 * - snapshot ids, because they are positions in a list rather than identities.
 *
 * Callers should prefer the signature the distiller returns. Handed a page map
 * that has already been trimmed to the prompt budget, this computes a signature
 * of the trimmed list, which is a different and less stable thing.
 */
export function pageSignature(pageMap: PageMap): string {
  const lines = [
    pageMap.url,
    pageMap.title,
    pageMap.activeModal ?? '',
    // Headings, because a single page application can swap a whole screen while
    // keeping the same shell of controls around it. Sometimes the only thing
    // that moved is the word at the top, and that is still somewhere else.
    ...pageMap.headings,
    ...pageMap.elements.map(
      (element) => `${elementKey(element)}#${appliedState(element)}`,
    ),
  ];

  return hash(lines.join('\n'));
}

/** FNV-1a, 32-bit. Equality of two consecutive snapshots is all this is for. */
function hash(input: string): string {
  let value = 0x811c9dc5;

  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }

  return (value >>> 0).toString(16).padStart(8, '0');
}
