import { isInteractiveTag } from '@hintora/core/distiller/selectors';
import type { PageElement } from '@hintora/core/types/pageMap';

export const DEFAULT_MAX_ELEMENTS = 120;

const IN_VIEWPORT_WEIGHT = 8;
const NAMED_WEIGHT = 4;
const INTERACTIVE_TAG_WEIGHT = 2;

/**
 * Ranking is only consulted when a page exceeds the budget. Order of the terms
 * is the priority order from the spec: visible beats named, named beats merely
 * interactive, and ties break towards the top of the page.
 */
export function rankScore(element: PageElement): number {
  let score = 0;
  if (element.inViewport) score += IN_VIEWPORT_WEIGHT;
  if (element.name !== '') score += NAMED_WEIGHT;
  if (isInteractiveTag(element.tag)) score += INTERACTIVE_TAG_WEIGHT;

  // Normalised so proximity can only break ties, never outrank a signal above.
  const top = element.bbox[1];
  score += 1 / (1 + Math.max(top, 0) / 1000);

  return score;
}

/**
 * Returns document order, not rank order: ids are handed out afterwards and a
 * numbered list that jumps around the page reads badly in the prompt.
 */
export function applyBudget(
  elements: readonly PageElement[],
  maxElements = DEFAULT_MAX_ELEMENTS,
): PageElement[] {
  if (elements.length <= maxElements) return [...elements];

  const kept = elements
    .map((element, index) => ({ element, index, score: rankScore(element) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxElements)
    .sort((a, b) => a.index - b.index);

  return kept.map((entry) => entry.element);
}
