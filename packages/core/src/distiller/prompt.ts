import type { PageMap, PromptPageMap } from '@hintora/core/types/pageMap';

/**
 * Strips geometry. The overlay needs bbox to draw; the model must never see it,
 * both to save tokens and because pixel coordinates invite the model to reason
 * about layout instead of semantics.
 */
export function toPromptPageMap(pageMap: PageMap): PromptPageMap {
  return {
    ...pageMap,
    elements: pageMap.elements.map(({ bbox: _bbox, ...rest }) => rest),
  };
}
