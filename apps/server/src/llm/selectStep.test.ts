import { describe as suite, expect, test } from 'vitest';
import type { GuideResponse } from '@signpost/core/types/guide';
import type { PromptPageMap } from '@signpost/core/types/pageMap';
import { isConsistent } from '@signpost/server/llm/selectStep';

const PAGE: PromptPageMap = {
  url: '/settings/notifications',
  title: 'Settings',
  headings: ['Settings'],
  elements: [
    {
      id: 'e0',
      role: 'textbox',
      name: 'Notification email',
      tag: 'input',
      state: { disabled: false },
      section: ['main', 'Notification email'],
      inViewport: true,
    },
    {
      id: 'e1',
      role: 'checkbox',
      name: 'Deal stage changes',
      tag: 'input',
      state: { disabled: false, checked: true },
      section: ['main', 'What we send'],
      inViewport: true,
    },
  ],
};

function answer(elementId: string, instruction: string): GuideResponse {
  return {
    status: 'step',
    elementId,
    action: 'click',
    instruction,
    typeValue: null,
    confidence: 0.9,
    reasoning: '',
    suggestedNavigation: null,
  };
}

suite('isConsistent', () => {
  // The failure this exists for: a correct sentence attached to the wrong id.
  // The words read right, so the user trusts a highlight on something else.
  test('rejects an instruction that names a different control on the page', () => {
    expect(
      isConsistent(answer('e1', "Click on the 'Notification email' textbox."), PAGE),
    ).toBe(false);
  });

  test('accepts an instruction that names the control it chose', () => {
    expect(
      isConsistent(answer('e0', "Click on the 'Notification email' textbox."), PAGE),
    ).toBe(true);
  });

  test('leaves an unquoted description alone', () => {
    expect(isConsistent(answer('e1', 'Turn off the deal alerts toggle.'), PAGE)).toBe(
      true,
    );
  });

  test('accepts a quoted phrase that is part of the name', () => {
    expect(isConsistent(answer('e0', "Click 'Notification email'."), PAGE)).toBe(true);
  });

  test('has nothing to check when no element was chosen', () => {
    const response = {
      ...answer('e0', 'x'),
      status: 'unclear' as const,
      elementId: null,
    };
    expect(isConsistent(response, PAGE)).toBe(true);
  });
});
