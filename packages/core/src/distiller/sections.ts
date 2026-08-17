import { accessibleNameOf } from '@signpost/core/distiller/accessibleName';

/** Landmark tags mapped to the keyword used when the landmark has no name. */
const LANDMARK_TAGS: Record<string, string> = {
  nav: 'nav',
  main: 'main',
  aside: 'aside',
  form: 'form',
  section: 'section',
};

const LANDMARK_ROLES = new Set([
  'navigation',
  'main',
  'complementary',
  'form',
  'region',
  'search',
  'banner',
  'contentinfo',
  'dialog',
]);

function landmarkKeyword(element: Element): string | null {
  const role = element.getAttribute('role')?.trim().split(/\s+/)[0];
  if (role && LANDMARK_ROLES.has(role)) return role;

  const tag = element.tagName.toLowerCase();

  // header and footer are only landmarks when not scoped to a sectioning element.
  if (tag === 'header' || tag === 'footer') {
    const scoped = element.parentElement?.closest('article,aside,main,nav,section');
    return scoped ? null : tag === 'header' ? 'banner' : 'contentinfo';
  }

  return LANDMARK_TAGS[tag] ?? null;
}

/**
 * Outermost to innermost landmark trail. An unnamed landmark contributes its
 * keyword, a named one contributes the name, which is what makes two identically
 * labelled buttons distinguishable.
 */
export function sectionPathOf(element: Element, root: Element): string[] {
  const path: string[] = [];

  for (
    let current = element.parentElement;
    current && current !== root.parentElement;
    current = current.parentElement
  ) {
    const keyword = landmarkKeyword(current);
    if (!keyword) continue;
    const name = accessibleNameOf(current);
    path.push(name || keyword);
  }

  return path.reverse();
}

/**
 * Last heading preceding the element in document order. Cheaper and more
 * predictable than climbing for a sectioning ancestor, and it matches how a
 * reader would attribute the control to a heading.
 */
export function nearestHeadingOf(element: Element, headings: readonly Element[]): string {
  for (let index = headings.length - 1; index >= 0; index -= 1) {
    const heading = headings[index];
    if (!heading) continue;
    const position = heading.compareDocumentPosition(element);
    const precedesElement = (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    if (precedesElement) return accessibleNameOf(heading);
  }
  return '';
}
