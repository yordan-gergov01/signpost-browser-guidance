/** Marker on the overlay host so distillation never maps our own UI. */
export const OVERLAY_HOST_ATTRIBUTE = 'data-hintora-overlay';

/**
 * Everything that could plausibly be a guidance target. Deliberately broad: it
 * is cheaper to over-collect here and filter on visibility and naming than to
 * miss a custom control that only carries a role.
 */
export const CANDIDATE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[role]',
  '[tabindex]',
  '[contenteditable]',
  '[onclick]',
].join(',');

const INTERACTIVE_TAGS = new Set([
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
]);

export function isInteractiveTag(tag: string): boolean {
  return INTERACTIVE_TAGS.has(tag);
}
