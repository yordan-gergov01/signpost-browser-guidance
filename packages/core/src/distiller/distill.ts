import { accessibleNameOf, targetNameOf } from '@hintora/core/distiller/accessibleName';
import { applyBudget, DEFAULT_MAX_ELEMENTS } from '@hintora/core/distiller/budget';
import { findActiveModal, modalNameOf } from '@hintora/core/distiller/modal';
import { resolveRole } from '@hintora/core/distiller/roles';
import { nearestHeadingOf, sectionPathOf } from '@hintora/core/distiller/sections';
import {
  CANDIDATE_SELECTOR,
  OVERLAY_HOST_ATTRIBUTE,
} from '@hintora/core/distiller/selectors';
import { safeValueOf, stateOf } from '@hintora/core/distiller/state';
import {
  boxOf,
  isInViewport,
  isVisible,
  scrollOffsetOf,
} from '@hintora/core/distiller/visibility';
import type { Box, ScrollOffset, Viewport } from '@hintora/core/distiller/visibility';
import type { PageElement, PageMap } from '@hintora/core/types/pageMap';

export type DistillOptions = {
  maxElements?: number;
  viewport?: Viewport;
  /** Overridable so a scrolled page can be distilled without a live window. */
  scroll?: ScrollOffset;
};

type DistillContext = {
  root: Element;
  headings: readonly Element[];
  viewport: Viewport;
  baseUrl: string;
};

const HEADING_SELECTOR = 'h1,h2,h3,h4,h5,h6';
const PAGE_HEADING_SELECTOR = 'h1,h2,h3';

function pathnameOf(href: string, base: string): string {
  try {
    return new URL(href, base).pathname;
  } catch {
    return href;
  }
}

const FALLBACK_VIEWPORT: Viewport = { width: 1280, height: 720 };

/**
 * A detached document, a background tab or a frame that is not compositing all
 * report a 0x0 viewport. Trusting that would mark every element out of viewport
 * and remove the strongest term from the budget ranking, so an empty viewport
 * falls back to a nominal desktop one.
 */
function viewportOf(doc: Document, override?: Viewport): Viewport {
  const candidate = override ?? {
    width: doc.defaultView?.innerWidth ?? 0,
    height: doc.defaultView?.innerHeight ?? 0,
  };
  return candidate.width > 0 && candidate.height > 0 ? candidate : FALLBACK_VIEWPORT;
}

function isOwnOverlay(element: Element): boolean {
  return element.closest(`[${OVERLAY_HOST_ATTRIBUTE}]`) !== null;
}

function describe(element: Element, box: Box, context: DistillContext): PageElement {
  const pageElement: PageElement = {
    id: '',
    role: resolveRole(element),
    name: targetNameOf(element),
    tag: element.tagName.toLowerCase(),
    state: stateOf(element),
    section: sectionPathOf(element, context.root),
    inViewport: isInViewport(box, context.viewport),
    bbox: box,
  };

  const testId =
    element.getAttribute('data-testid') ??
    element.getAttribute('data-test') ??
    element.getAttribute('data-cy');
  if (testId) pageElement.testId = testId;

  const href = element.getAttribute('href');
  if (href) pageElement.href = pathnameOf(href, context.baseUrl);

  const placeholder = element.getAttribute('placeholder');
  if (placeholder) pageElement.placeholder = placeholder;

  const value = safeValueOf(element);
  if (value !== undefined) pageElement.value = value;

  const nearestHeading = nearestHeadingOf(element, context.headings);
  if (nearestHeading) pageElement.nearestHeading = nearestHeading;

  return pageElement;
}

/**
 * DOM to PageMap.
 *
 * Read-only by contract: nothing here mutates the host page, which is what lets
 * the same function run in the extension, in the SDK and against a saved fixture
 * in a test.
 */
export function distill(doc: Document, options: DistillOptions = {}): PageMap {
  const { maxElements = DEFAULT_MAX_ELEMENTS } = options;

  const modal = findActiveModal(doc.body);
  const context: DistillContext = {
    root: modal ?? doc.body,
    headings: Array.from(doc.querySelectorAll(HEADING_SELECTOR)),
    viewport: viewportOf(doc, options.viewport),
    baseUrl: doc.location?.href ?? 'http://localhost/',
  };

  const scroll = options.scroll ?? scrollOffsetOf(doc);

  const described: PageElement[] = [];
  for (const element of context.root.querySelectorAll(CANDIDATE_SELECTOR)) {
    if (isOwnOverlay(element)) continue;
    const box = boxOf(element);
    if (!isVisible(element, box, scroll)) continue;
    described.push(describe(element, box, context));
  }

  // Ids are handed out after trimming so the numbered list in the prompt has no
  // gaps. They are snapshot-scoped; anything persisted stores a fingerprint.
  const elements = applyBudget(described, maxElements).map((element, index) => ({
    ...element,
    id: `e${index}`,
  }));

  const pageMap: PageMap = {
    url: doc.location?.pathname ?? '/',
    title: doc.title,
    headings: Array.from(doc.querySelectorAll(PAGE_HEADING_SELECTOR)).map((heading) =>
      accessibleNameOf(heading),
    ),
    elements,
  };

  if (modal) {
    const name = modalNameOf(modal);
    if (name) pageMap.activeModal = name;
  }

  return pageMap;
}
