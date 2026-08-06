import { beforeEach, describe as suite, expect, test } from 'vitest';
import { distill } from '@hintora/core/distiller/distill';
import { REDACTED } from '@hintora/core/distiller/state';
import { pageMapSchema } from '@hintora/core/types/pageMap';
import type { PageElement, PageMap } from '@hintora/core/types/pageMap';
import { mountHtml, readFixture } from '@hintora/core/testing/domFixtures';
import { stubLayout } from '@hintora/core/testing/stubLayout';

function load(fixture: string): PageMap {
  mountHtml(readFixture(import.meta.url, `fixtures/${fixture}`));
  stubLayout(document);
  return distill(document);
}

function byName(pageMap: PageMap, name: string): PageElement[] {
  return pageMap.elements.filter((element) => element.name === name);
}

function named(pageMap: PageMap, name: string): PageElement {
  const [element] = byName(pageMap, name);
  if (!element) throw new Error(`no element named "${name}"`);
  return element;
}

suite('distill', () => {
  suite('acme contacts fixture', () => {
    let pageMap: PageMap;

    beforeEach(() => {
      pageMap = load('acme-contacts.html');
    });

    test('produces a map that satisfies the schema', () => {
      expect(() => pageMapSchema.parse(pageMap)).not.toThrow();
    });

    test('assigns contiguous snapshot ids in document order', () => {
      expect(pageMap.elements.map((element) => element.id)).toEqual(
        pageMap.elements.map((_, index) => `e${index}`),
      );
    });

    test('collects page headings', () => {
      expect(pageMap.headings).toEqual(['Contacts', 'All contacts', 'Saved reports']);
    });

    test('separates the two Export buttons by section path', () => {
      const exports = byName(pageMap, 'Export');
      expect(exports).toHaveLength(2);
      expect(exports.map((element) => element.section.at(-1))).toEqual([
        'All contacts',
        'Saved reports',
      ]);
      expect(exports.map((element) => element.testId)).toEqual([
        'contacts-export',
        'reports-export',
      ]);
    });

    test('records nav links with roles, hrefs and test ids', () => {
      const contacts = named(pageMap, 'Contacts');
      expect(contacts.role).toBe('link');
      expect(contacts.href).toBe('/contacts');
      expect(contacts.testId).toBe('nav-contacts');
      expect(contacts.state.selected).toBe(true);
    });

    test('keeps the nearest heading and the landmark trail', () => {
      const addContact = named(pageMap, 'Add contact');
      expect(addContact.section).toEqual(['main', 'All contacts']);
      expect(addContact.nearestHeading).toBe('All contacts');
    });

    test('does not emit an active modal when none is open', () => {
      expect(pageMap.activeModal).toBeUndefined();
    });

    test('falls back to a nominal viewport when the view reports no size', () => {
      mountHtml(readFixture(import.meta.url, 'fixtures/acme-contacts.html'));
      stubLayout(document);
      const collapsed = distill(document, { viewport: { width: 0, height: 0 } });
      expect(collapsed.elements.some((element) => element.inViewport)).toBe(true);
    });

    test('drops non-interactive text content', () => {
      const names = pageMap.elements.map((element) => element.name);
      expect(names).not.toContain('Ada Lovelace');
      expect(names).not.toContain('128 rows');
    });
  });

  suite('modal narrowing', () => {
    let pageMap: PageMap;

    beforeEach(() => {
      pageMap = load('modal.html');
    });

    test('names the active modal', () => {
      expect(pageMap.activeModal).toBe('Add contact');
    });

    test('maps only elements inside the modal', () => {
      expect(pageMap.elements.map((element) => element.name)).toEqual([
        'Full name',
        'Cancel',
        'Save contact',
      ]);
    });

    test('drops the navigation and page content behind the modal', () => {
      expect(byName(pageMap, 'Export')).toHaveLength(0);
      expect(byName(pageMap, 'Deals')).toHaveLength(0);
    });

    test('still reports page headings from the whole document', () => {
      expect(pageMap.headings).toContain('Contacts');
    });

    test('detects a modal whose own box is collapsed', () => {
      mountHtml(readFixture(import.meta.url, 'fixtures/modal.html'));
      stubLayout(document);
      document
        .querySelector('[role="dialog"]')
        ?.setAttribute('data-stub-rect', '0,0,0,0');
      stubLayout(document);

      expect(distill(document).activeModal).toBe('Add contact');
    });
  });

  suite('visibility filtering', () => {
    let pageMap: PageMap;

    beforeEach(() => {
      pageMap = load('edge-cases.html');
    });

    test.each([
      ['Aria hidden'],
      ['Inert'],
      ['Display none'],
      ['Visibility hidden'],
      ['Zero area'],
      ['Clipped'],
      ['Off canvas'],
    ])('excludes %s', (name) => {
      expect(byName(pageMap, name)).toHaveLength(0);
    });

    test('keeps a plainly visible button', () => {
      expect(named(pageMap, 'Keep me').testId).toBe('ok');
    });

    test('keeps elements scrolled above the fold', () => {
      mountHtml(readFixture(import.meta.url, 'fixtures/edge-cases.html'));
      stubLayout(document);
      document
        .querySelector('[data-testid="ok"]')
        ?.setAttribute('data-stub-rect', '0,-600,120,24');
      stubLayout(document);

      const scrolled = distill(document, { scroll: { x: 0, y: 900 } });
      const target = scrolled.elements.find((element) => element.testId === 'ok');

      expect(target).toBeDefined();
      expect(target?.inViewport).toBe(false);
    });

    test('still drops elements parked off the document', () => {
      const scrolled = distill(document, { scroll: { x: 0, y: 900 } });
      expect(scrolled.elements.some((element) => element.name === 'Off canvas')).toBe(
        false,
      );
    });
  });

  suite('roles and state', () => {
    let pageMap: PageMap;

    beforeEach(() => {
      pageMap = load('edge-cases.html');
    });

    test('resolves explicit roles over implicit ones', () => {
      expect(named(pageMap, 'Custom control').role).toBe('button');
    });

    test('resolves implicit roles from tag and input type', () => {
      expect(named(pageMap, 'Weekly digest').role).toBe('checkbox');
      expect(named(pageMap, 'Stage').role).toBe('combobox');
      expect(named(pageMap, 'Work email').role).toBe('textbox');
      expect(named(pageMap, 'More options').role).toBe('button');
    });

    test('treats aria-disabled the same as the disabled attribute', () => {
      expect(named(pageMap, 'Disabled button').state.disabled).toBe(true);
      expect(named(pageMap, 'Aria disabled').state.disabled).toBe(true);
      expect(named(pageMap, 'Keep me').state.disabled).toBe(false);
    });

    test('carries checked and expanded state', () => {
      expect(named(pageMap, 'Weekly digest').state.checked).toBe(true);
      expect(named(pageMap, 'Monthly').state.checked).toBe(false);
      expect(named(pageMap, 'Open menu').state.expanded).toBe(false);
    });

    test('strips the query string from hrefs', () => {
      expect(named(pageMap, 'Reports').href).toBe('/reports');
    });

    test('picks up elements that only carry an onclick attribute', () => {
      expect(byName(pageMap, 'Legacy handler')).toHaveLength(1);
    });
  });

  suite('value handling', () => {
    let pageMap: PageMap;

    beforeEach(() => {
      pageMap = load('edge-cases.html');
    });

    test('redacts free-text input values', () => {
      expect(named(pageMap, 'Work email').value).toBe(REDACTED);
      expect(named(pageMap, 'Notes').value).toBe(REDACTED);
    });

    test('omits the value of an empty field', () => {
      expect(named(pageMap, 'Empty field').value).toBeUndefined();
    });

    test('keeps select state, which is page meaning rather than user input', () => {
      expect(named(pageMap, 'Stage').value).toBe('Negotiation');
    });

    test('never reads contenteditable content', () => {
      expect(named(pageMap, 'Rich note').value).toBeUndefined();
    });

    test('leaks no personal data from the fixture into the map', () => {
      const serialized = JSON.stringify(pageMap);
      expect(serialized).not.toContain('jane@acme.test');
      expect(serialized).not.toContain('4111');
      expect(serialized).not.toContain('900123');
    });
  });
});
