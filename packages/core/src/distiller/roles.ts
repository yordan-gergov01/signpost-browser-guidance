const INPUT_TYPE_ROLES: Record<string, string> = {
  button: 'button',
  submit: 'button',
  reset: 'button',
  image: 'button',
  checkbox: 'checkbox',
  radio: 'radio',
  range: 'slider',
  number: 'spinbutton',
  search: 'searchbox',
  email: 'textbox',
  tel: 'textbox',
  text: 'textbox',
  url: 'textbox',
  password: 'textbox',
};

const TAG_ROLES: Record<string, string> = {
  a: 'link',
  button: 'button',
  textarea: 'textbox',
  summary: 'button',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
};

/**
 * Explicit role wins, otherwise the implicit role for the tag. This is a subset
 * of the HTML-AAM mapping covering the tags the candidate selector can return,
 * not a general-purpose implementation.
 */
export function resolveRole(element: Element): string {
  const explicit = element.getAttribute('role')?.trim().split(/\s+/)[0];
  if (explicit) return explicit;

  const tag = element.tagName.toLowerCase();

  if (tag === 'input') {
    const type = (element.getAttribute('type') ?? 'text').toLowerCase();
    return INPUT_TYPE_ROLES[type] ?? 'textbox';
  }

  if (tag === 'select') {
    const multiple = element.hasAttribute('multiple');
    const size = Number(element.getAttribute('size') ?? '0');
    return multiple || size > 1 ? 'listbox' : 'combobox';
  }

  if (element.hasAttribute('contenteditable')) {
    const value = element.getAttribute('contenteditable');
    if (value !== 'false') return 'textbox';
  }

  return TAG_ROLES[tag] ?? 'generic';
}
