import { describe as suite, expect, test } from 'vitest';
import { assessPage } from '@signpost/core/safety/sensitivePage';
import { mountHtml } from '@signpost/core/testing/domFixtures';

function pageWith(markup: string, pathname = '/dashboard'): Document {
  mountHtml(`<html><head><title>t</title></head><body>${markup}</body></html>`);
  history.replaceState(null, '', pathname);
  return document;
}

suite('assessPage', () => {
  test('blocks any page carrying a password field', () => {
    const verdict = assessPage(pageWith('<input type="password" />'));
    expect(verdict.allowed).toBe(false);
  });

  test.each([
    '/login',
    '/signin',
    '/checkout',
    '/payment/confirm',
    '/account/reset',
    '/2fa',
  ])('blocks %s by path', (pathname) => {
    expect(assessPage(pageWith('<button>Go</button>', pathname)).allowed).toBe(false);
  });

  test.each(['/dashboard', '/contacts', '/settings/billing', '/deals'])(
    'allows %s',
    (pathname) => {
      expect(assessPage(pageWith('<button>Go</button>', pathname)).allowed).toBe(true);
    },
  );

  test('explains itself, because the overlay shows the reason to the user', () => {
    const verdict = assessPage(pageWith('<input type="password" />'));
    expect(verdict.allowed === false && verdict.reason.length).toBeGreaterThan(0);
  });
});
