import { describe as suite, expect, test } from 'vitest';
import { applyBudget, rankScore } from '@hintora/core/distiller/budget';
import type { PageElement } from '@hintora/core/types/pageMap';

function element(overrides: Partial<PageElement> = {}): PageElement {
  return {
    id: 'e0',
    role: 'button',
    name: 'Save',
    tag: 'button',
    state: { disabled: false },
    section: [],
    inViewport: true,
    bbox: [0, 0, 100, 24],
    ...overrides,
  };
}

suite('rankScore', () => {
  test('ranks an in-viewport element above an off-screen one', () => {
    expect(rankScore(element({ inViewport: true }))).toBeGreaterThan(
      rankScore(element({ inViewport: false })),
    );
  });

  test('ranks a named element above an unnamed one', () => {
    const unnamed = element({ inViewport: false, name: '' });
    const named = element({ inViewport: false, name: 'Save' });
    expect(rankScore(named)).toBeGreaterThan(rankScore(unnamed));
  });

  test('ranks an interactive tag above a generic one', () => {
    const generic = element({ inViewport: false, name: '', tag: 'div' });
    const button = element({ inViewport: false, name: '', tag: 'button' });
    expect(rankScore(button)).toBeGreaterThan(rankScore(generic));
  });

  test('breaks ties towards the top of the page', () => {
    const high = element({ bbox: [0, 100, 100, 24] });
    const low = element({ bbox: [0, 4000, 100, 24] });
    expect(rankScore(high)).toBeGreaterThan(rankScore(low));
  });

  test('lets no lower signal outrank a higher one', () => {
    const viewportOnly = element({ inViewport: true, name: '', tag: 'div' });
    const everythingElse = element({ inViewport: false, name: 'Save', tag: 'button' });
    expect(rankScore(viewportOnly)).toBeGreaterThan(rankScore(everythingElse));
  });
});

suite('applyBudget', () => {
  test('returns everything when under budget', () => {
    const elements = [element({ id: 'e0' }), element({ id: 'e1' })];
    expect(applyBudget(elements, 10)).toHaveLength(2);
  });

  test('keeps the highest ranked elements when over budget', () => {
    const elements = [
      element({ id: 'e0', inViewport: false, name: '', tag: 'div' }),
      element({ id: 'e1', inViewport: true, name: 'Keep me' }),
      element({ id: 'e2', inViewport: false, name: '', tag: 'span' }),
    ];
    expect(applyBudget(elements, 1).map((kept) => kept.name)).toEqual(['Keep me']);
  });

  test('returns survivors in document order, not rank order', () => {
    const elements = [
      element({ id: 'e0', inViewport: true, name: 'First', bbox: [0, 900, 100, 24] }),
      element({ id: 'e1', inViewport: false, name: '', tag: 'div' }),
      element({ id: 'e2', inViewport: true, name: 'Third', bbox: [0, 10, 100, 24] }),
    ];
    expect(applyBudget(elements, 2).map((kept) => kept.name)).toEqual(['First', 'Third']);
  });
});
