import { afterEach, beforeEach, describe as suite, expect, test, vi } from 'vitest';
import { MAX_INTENT_LENGTH } from '@signpost/core/config/budgets';
import { bindTriggers } from '@signpost/sdk/triggers';

const target = { ask: vi.fn(), run: vi.fn() };

let unbind: () => void;

beforeEach(() => {
  target.ask.mockReset();
  target.run.mockReset();
  document.body.innerHTML = '';
  unbind = bindTriggers(document, target);
});

afterEach(() => unbind());

function mount(html: string): HTMLElement {
  document.body.insertAdjacentHTML('beforeend', html);
  return document.body.lastElementChild as HTMLElement;
}

suite('bindTriggers', () => {
  test('opens the command bar for a trigger with no intent', () => {
    mount('<button data-signpost-trigger>Help</button>').click();
    expect(target.ask).toHaveBeenCalledTimes(1);
    expect(target.run).not.toHaveBeenCalled();
  });

  test('treats the jsx spelling of an empty attribute as no intent', () => {
    mount('<button data-signpost-trigger="true">Help</button>').click();
    expect(target.ask).toHaveBeenCalledTimes(1);
    expect(target.run).not.toHaveBeenCalled();
  });

  test('runs the intent when the trigger names one', () => {
    mount('<button data-signpost-trigger="export my contacts">How?</button>').click();
    expect(target.run).toHaveBeenCalledWith('export my contacts');
  });

  test('finds the trigger from a click on something inside it', () => {
    const button = mount('<button data-signpost-trigger><span>Help</span></button>');
    button.querySelector('span')?.dispatchEvent(new Event('click', { bubbles: true }));
    expect(target.ask).toHaveBeenCalledTimes(1);
  });

  test('picks up controls mounted after binding', () => {
    mount('<div id="late"></div>');
    document.querySelector('#late')!.innerHTML =
      '<button data-signpost-trigger>Help</button>';
    document
      .querySelector('#late button')!
      .dispatchEvent(new Event('click', { bubbles: true }));
    expect(target.ask).toHaveBeenCalledTimes(1);
  });

  test('ignores clicks anywhere else in the application', () => {
    mount('<button>Add contact</button>').click();
    expect(target.ask).not.toHaveBeenCalled();
    expect(target.run).not.toHaveBeenCalled();
  });

  test('claims the click on a link so the page does not navigate away', () => {
    const link = mount('<a href="/help" data-signpost-trigger>Help</a>');
    const event = new Event('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(target.ask).toHaveBeenCalledTimes(1);
  });

  test('stands down when the host already handled the click', () => {
    const button = mount('<button data-signpost-trigger>Help</button>');
    button.addEventListener('click', (event) => event.preventDefault());
    button.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
    expect(target.ask).not.toHaveBeenCalled();
  });

  test('bounds an intent that came from host markup', () => {
    mount(
      `<button data-signpost-trigger="${'a'.repeat(MAX_INTENT_LENGTH + 50)}">Go</button>`,
    ).click();
    expect(target.run.mock.calls[0]?.[0]).toHaveLength(MAX_INTENT_LENGTH);
  });

  test('goes quiet once unbound', () => {
    const button = mount('<button data-signpost-trigger>Help</button>');
    unbind();
    button.click();
    expect(target.ask).not.toHaveBeenCalled();
  });
});
