export type Box = [x: number, y: number, width: number, height: number];

export type Viewport = { width: number; height: number };

export type ScrollOffset = { x: number; y: number };

/** Below this, a box is an sr-only or clipped element rather than a target. */
const MIN_SIDE_PX = 2;

export function boxOf(element: Element): Box {
  const rect = element.getBoundingClientRect();
  return [rect.x, rect.y, rect.width, rect.height];
}

export function scrollOffsetOf(doc: Document): ScrollOffset {
  const view = doc.defaultView;
  return { x: view?.scrollX ?? 0, y: view?.scrollY ?? 0 };
}

function hasHiddenAncestor(element: Element): boolean {
  return (
    element.closest('[aria-hidden="true"]') !== null ||
    element.closest('[inert]') !== null
  );
}

function passesCssVisibility(element: Element): boolean {
  // checkVisibility covers display:none, visibility, content-visibility and
  // opacity:0 in one call. Older engines fall back to the layout box alone.
  const el = element as Element & {
    checkVisibility?: (options?: {
      checkOpacity?: boolean;
      checkVisibilityCSS?: boolean;
    }) => boolean;
  };
  if (typeof el.checkVisibility !== 'function') return true;
  return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
}

function isRenderedBox(box: Box, scroll: ScrollOffset): boolean {
  const [x, y, width, height] = box;
  if (width < MIN_SIDE_PX || height < MIN_SIDE_PX) return false;

  // Tested in document coordinates, not viewport ones. An element scrolled above
  // the fold has a negative viewport y but is perfectly reachable; only the
  // left:-9999px parking pattern lands outside the document box.
  if (x + scroll.x + width <= 0) return false;
  if (y + scroll.y + height <= 0) return false;

  return true;
}

/**
 * Visibility without the geometry test. Containers are legitimately zero-sized -
 * a portal wrapper, a `display: contents` node, a flex parent whose children are
 * absolutely positioned - so asking whether a container is "rendered" by its own
 * box gives the wrong answer.
 */
export function isSemanticallyVisible(element: Element): boolean {
  if (hasHiddenAncestor(element)) return false;
  if (!passesCssVisibility(element)) return false;
  return element.getClientRects().length > 0;
}

/** Full check for a candidate target, which does have to occupy space. */
export function isVisible(element: Element, box: Box, scroll: ScrollOffset): boolean {
  return isSemanticallyVisible(element) && isRenderedBox(box, scroll);
}

export function isInViewport(box: Box, viewport: Viewport): boolean {
  const [x, y, width, height] = box;
  return x < viewport.width && y < viewport.height && x + width > 0 && y + height > 0;
}
