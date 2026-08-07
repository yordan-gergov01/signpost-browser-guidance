import { TRIGGER_ATTRIBUTE } from '@hintora/core/config/attributes';
import { accessibleNameOf, targetNameOf } from '@hintora/core/distiller/accessibleName';
import { applyBudget, DEFAULT_MAX_ELEMENTS } from '@hintora/core/distiller/budget';
import { findActiveModal, modalNameOf } from '@hintora/core/distiller/modal';
import { resolveRole } from '@hintora/core/distiller/roles';
import { nearestHeadingOf, sectionPathOf } from '@hintora/core/distiller/sections';
import {
  CANDIDATE_SELECTOR,
  OVERLAY_HOST_ATTRIBUTE,
} from '@hintora/core/distiller/selectors';
import { pageSignature } from '@hintora/core/distiller/signature';
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

/**
 * Our overlay, and the host's own control for opening it. The trigger belongs to
 * the customer's UI, but pointing a user at "Help" as a step inside a session
 * they started from Help is a loop, so it never reaches the model.
 */
function isOwnSurface(element: Element): boolean {
  return element.closest(`[${OVERLAY_HOST_ATTRIBUTE}],[${TRIGGER_ATTRIBUTE}]`) !== null;
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

export type DistillResult = {
  pageMap: PageMap;
  /** Snapshot id to live element. Never leaves the browser. */
  byId: Map<string, Element>;
  /**
   * Identity of this page state, taken over every element found rather than the
   * ones that survived the prompt budget. The budget exists to bound a request;
   * letting it decide what counts as the same page would mean a scroll that
   * changes which elements make the cut reads as the user making progress.
   */
  signature: string;
};

/**
 * DOM to PageMap, keeping the element references.
 *
 * The id-to-node map is what turns the model's answer back into something the
 * overlay can point at. It stays in the browser: the server sees ids, we keep
 * the nodes.
 */
export function distillWithElements(
  doc: Document,
  options: DistillOptions = {},
): DistillResult {
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
  const nodeOf = new Map<PageElement, Element>();

  for (const element of context.root.querySelectorAll(CANDIDATE_SELECTOR)) {
    if (isOwnSurface(element)) continue;
    const box = boxOf(element);
    if (!isVisible(element, box, scroll)) continue;

    const entry = describe(element, box, context);
    described.push(entry);
    nodeOf.set(entry, element);
  }

  // Ids are handed out after trimming so the numbered list in the prompt has no
  // gaps. They are snapshot-scoped; anything persisted stores a fingerprint.
  const byId = new Map<string, Element>();
  const elements = applyBudget(described, maxElements).map((element, index) => {
    const id = `e${index}`;
    const node = nodeOf.get(element);
    if (node) byId.set(id, node);
    return { ...element, id };
  });

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

  return {
    pageMap,
    byId,
    signature: pageSignature({ ...pageMap, elements: described }),
  };
}

/**
 * DOM to PageMap.
 *
 * Read-only by contract: nothing here mutates the host page, which is what lets
 * the same function run in the extension, in the SDK and against a saved fixture
 * in a test.
 */
export function distill(doc: Document, options: DistillOptions = {}): PageMap {
  return distillWithElements(doc, options).pageMap;
}
