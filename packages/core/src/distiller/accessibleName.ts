import { computeAccessibleName } from 'dom-accessibility-api';

export const MAX_NAME_LENGTH = 120;

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function truncate(value: string, max = MAX_NAME_LENGTH): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

/**
 * The accessible name is the single most load-bearing field in the PageMap: it
 * is what the model matches an intent against and what the fingerprint scores
 * on. Failures here are silent, so any throw degrades to an empty name rather
 * than losing the element.
 */
export function accessibleNameOf(element: Element): string {
  let raw = '';
  try {
    raw = computeAccessibleName(element);
  } catch {
    raw = element.textContent ?? '';
  }
  return truncate(normalizeWhitespace(raw));
}

/** Above this an element is a container, and its text describes the page. */
const MAX_FALLBACK_DESCENDANTS = 3;

/**
 * Name for a candidate target. Roles that do not support name-from-content -
 * a div with an onclick, a span with a tabindex - compute to an empty accessible
 * name, which would hand the model an unusable entry. Their own text is the best
 * available label, so it is used, but only for elements small enough that the
 * text describes the control rather than everything beneath it.
 *
 * Landmarks and headings deliberately keep the strict name: a nav's text content
 * is every link inside it.
 */
export function targetNameOf(element: Element): string {
  const name = accessibleNameOf(element);
  if (name) return name;
  if (element.querySelectorAll('*').length > MAX_FALLBACK_DESCENDANTS) return '';
  return truncate(normalizeWhitespace(element.textContent ?? ''));
}
