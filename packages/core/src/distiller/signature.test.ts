import { beforeEach, describe as suite, expect, test } from 'vitest';
import { distill, distillWithElements } from '@signpost/core/distiller/distill';
import { elementKey, elementState } from '@signpost/core/distiller/signature';
import { mountHtml } from '@signpost/core/testing/domFixtures';
import { stubLayout } from '@signpost/core/testing/stubLayout';

const PAGE = `
  <body>
    <main>
      <h1>Contacts</h1>
      <button data-testid="export">Export</button>
      <button id="add">Add contact</button>
      <input aria-label="Filter contacts" />
    </main>
  </body>
`;

function signatureNow(): string {
  stubLayout(document);
  return distillWithElements(document).signature;
}

suite('page signature', () => {
  beforeEach(() => mountHtml(PAGE));

  test('is stable across two looks at an unchanged page', () => {
    expect(signatureNow()).toBe(signatureNow());
  });

  test('changes when a control is renamed', () => {
    const before = signatureNow();
    document.querySelector('#add')!.textContent = 'New contact';
    expect(signatureNow()).not.toBe(before);
  });

  test('changes when a control appears', () => {
    const before = signatureNow();
    document
      .querySelector('main')!
      .insertAdjacentHTML('beforeend', '<button>Import</button>');
    expect(signatureNow()).not.toBe(before);
  });

  test('changes when the screen behind the same controls is swapped', () => {
    const before = signatureNow();
    document.querySelector('h1')!.textContent = 'Settings';
    expect(signatureNow()).not.toBe(before);
  });

  test('changes when a control becomes disabled', () => {
    const before = signatureNow();
    document.querySelector('#add')!.setAttribute('disabled', '');
    expect(signatureNow()).not.toBe(before);
  });

  test('changes when a dialog opens', () => {
    const before = signatureNow();
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div role="dialog" aria-label="Add contact"><button>Save</button></div>',
    );
    expect(signatureNow()).not.toBe(before);
  });

  // Scrolling moves every box on the page and changes what is in the viewport.
  // If that counted as progress, every scroll would close a step the user never
  // completed.
  test('ignores geometry, so scrolling is not mistaken for progress', () => {
    const before = signatureNow();
    stubLayout(document, { rowHeight: 40 });
    expect(distillWithElements(document).signature).toBe(before);
  });

  // The prompt budget decides what fits in one request. Letting it decide what
  // counts as the same page would mean a long page changes identity as the user
  // scrolls, because the budget ranks what is on screen first.
  test('ignores which elements survived the prompt budget', () => {
    stubLayout(document);
    const top = distillWithElements(document, {
      maxElements: 2,
      viewport: { width: 1280, height: 40 },
    });
    const bottom = distillWithElements(document, {
      maxElements: 2,
      viewport: { width: 1280, height: 4000 },
    });

    expect(top.pageMap.elements).not.toEqual(bottom.pageMap.elements);
    expect(top.signature).toBe(bottom.signature);
  });

  // The narrow case this exists for: the user was sent to a menu, the menu is
  // dead, and while they are looking at it they type in the application's own
  // search box. That is not the menu working.
  test('ignores what a user types into a field', () => {
    const before = signatureNow();
    document.querySelector('input')!.setAttribute('value', 'ada');
    expect(signatureNow()).toBe(before);
  });
});

suite('elementKey', () => {
  beforeEach(() => mountHtml(PAGE));

  test('tells the controls on a page apart', () => {
    stubLayout(document);
    const elements = distill(document).elements;
    expect(new Set(elements.map(elementKey)).size).toBe(elements.length);
  });

  test('does not depend on the snapshot id', () => {
    stubLayout(document);
    const [first] = distill(document).elements;
    expect(elementKey({ ...first!, id: 'e99' })).toBe(elementKey(first!));
  });

  test('survives the control reacting, so a menu stays the same menu', () => {
    stubLayout(document);
    const [first] = distill(document).elements;
    const opened = { ...first!, state: { ...first!.state, expanded: true } };
    expect(elementKey(opened)).toBe(elementKey(first!));
    expect(elementState(opened)).not.toBe(elementState(first!));
  });
});

suite('elementState', () => {
  beforeEach(() => mountHtml(PAGE));

  test('carries the value, which the page signature does not', () => {
    stubLayout(document);
    const field = distill(document).elements.find((element) => element.tag === 'input');
    expect(elementState({ ...field!, value: 'x' })).not.toBe(elementState(field!));
  });
});
