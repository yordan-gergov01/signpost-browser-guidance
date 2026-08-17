import type { ElementState } from '@signpost/core/types/pageMap';

export const REDACTED = '[redacted]';

function ariaBoolean(element: Element, attribute: string): boolean | undefined {
  const raw = element.getAttribute(attribute);
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return undefined;
}

function isDisabled(element: Element): boolean {
  if (element.getAttribute('aria-disabled') === 'true') return true;
  const disableable = element as { disabled?: boolean };
  if (typeof disableable.disabled === 'boolean') return disableable.disabled;
  return element.hasAttribute('disabled');
}

function checkedOf(element: Element): boolean | undefined {
  const aria = ariaBoolean(element, 'aria-checked');
  if (aria !== undefined) return aria;

  if (element.tagName.toLowerCase() !== 'input') return undefined;
  const type = (element.getAttribute('type') ?? '').toLowerCase();
  if (type !== 'checkbox' && type !== 'radio') return undefined;
  return (element as HTMLInputElement).checked;
}

function expandedOf(element: Element): boolean | undefined {
  const aria = ariaBoolean(element, 'aria-expanded');
  if (aria !== undefined) return aria;
  if (element.tagName.toLowerCase() !== 'summary') return undefined;
  return element.parentElement?.hasAttribute('open') ?? undefined;
}

function selectedOf(element: Element): boolean | undefined {
  const aria = ariaBoolean(element, 'aria-selected');
  if (aria !== undefined) return aria;
  if (element.getAttribute('aria-current') === 'page') return true;
  return undefined;
}

export function stateOf(element: Element): ElementState {
  const state: ElementState = { disabled: isDisabled(element) };

  const checked = checkedOf(element);
  if (checked !== undefined) state.checked = checked;

  const expanded = expandedOf(element);
  if (expanded !== undefined) state.expanded = expanded;

  const selected = selectedOf(element);
  if (selected !== undefined) state.selected = selected;

  return state;
}

/**
 * Free-text values never leave the page. Only select state is real, because a
 * chosen option is part of the page's meaning rather than user input, and
 * checkbox/radio state already travels in `state.checked`.
 */
export function safeValueOf(element: Element): string | undefined {
  const tag = element.tagName.toLowerCase();

  if (tag === 'select') {
    const select = element as HTMLSelectElement;
    const option = select.selectedOptions?.[0] ?? select.options[select.selectedIndex];
    const label = option?.textContent ?? option?.getAttribute('value') ?? '';
    const trimmed = label.trim();
    return trimmed === '' ? undefined : trimmed;
  }

  if (tag === 'input') {
    const type = (element.getAttribute('type') ?? 'text').toLowerCase();
    if (type === 'checkbox' || type === 'radio') return undefined;
    return (element as HTMLInputElement).value === '' ? undefined : REDACTED;
  }

  if (tag === 'textarea') {
    return (element as HTMLTextAreaElement).value === '' ? undefined : REDACTED;
  }

  // contenteditable innerText is never read at all.
  return undefined;
}
