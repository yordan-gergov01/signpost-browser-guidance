import { beforeEach, describe as suite, expect, test } from 'vitest';
import { resolveConfig, resolveEndpoint } from '@hintora/sdk/config';

const BASE = 'https://app.business.test/contacts';

function scriptWith(attributes: Record<string, string>): Element {
  const element = document.createElement('script');
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

suite('resolveEndpoint', () => {
  test('accepts an absolute https endpoint', () => {
    expect(resolveEndpoint('https://guide.business.test/hintora', BASE)).toBe(
      'https://guide.business.test/hintora',
    );
  });

  test('resolves a same-origin relative endpoint against the page', () => {
    expect(resolveEndpoint('/hintora/guide', BASE)).toBe(
      'https://app.business.test/hintora/guide',
    );
  });

  test('rejects a javascript url', () => {
    expect(resolveEndpoint('javascript:fetch("/steal")', BASE)).toBeNull();
  });

  test('rejects a data url', () => {
    expect(resolveEndpoint('data:text/plain,x', BASE)).toBeNull();
  });

  test('rejects blank and missing values', () => {
    expect(resolveEndpoint('   ', BASE)).toBeNull();
    expect(resolveEndpoint(null, BASE)).toBeNull();
    expect(resolveEndpoint(undefined, BASE)).toBeNull();
  });
});

suite('resolveConfig', () => {
  beforeEach(() => {
    for (const name of [
      'data-hintora-endpoint',
      'data-hintora-accent',
      'data-hintora-hotkey',
    ]) {
      document.documentElement.removeAttribute(name);
    }
  });

  test('is null when nothing configures an endpoint', () => {
    expect(resolveConfig(document, null)).toBeNull();
  });

  test('reads the endpoint from the document root', () => {
    document.documentElement.setAttribute(
      'data-hintora-endpoint',
      'https://guide.business.test/hintora',
    );
    expect(resolveConfig(document, null)?.endpoint).toBe(
      'https://guide.business.test/hintora',
    );
  });

  test('prefers the script tag over the document root', () => {
    document.documentElement.setAttribute(
      'data-hintora-endpoint',
      'https://root.test/guide',
    );
    const script = scriptWith({ 'data-hintora-endpoint': 'https://tag.test/guide' });
    expect(resolveConfig(document, script)?.endpoint).toBe('https://tag.test/guide');
  });

  test('prefers an explicit option over both', () => {
    document.documentElement.setAttribute(
      'data-hintora-endpoint',
      'https://root.test/guide',
    );
    const config = resolveConfig(document, null, { endpoint: 'https://code.test/guide' });
    expect(config?.endpoint).toBe('https://code.test/guide');
  });

  test('refuses a javascript endpoint even when it is the only one', () => {
    document.documentElement.setAttribute('data-hintora-endpoint', 'javascript:alert(1)');
    expect(resolveConfig(document, null)).toBeNull();
  });

  test('keeps the hotkey on by default', () => {
    const script = scriptWith({ 'data-hintora-endpoint': 'https://tag.test/guide' });
    expect(resolveConfig(document, script)?.hotkey).toBe(true);
  });

  test('lets a host that already owns ctrl+k turn it off', () => {
    const script = scriptWith({
      'data-hintora-endpoint': 'https://tag.test/guide',
      'data-hintora-hotkey': 'Off',
    });
    expect(resolveConfig(document, script)?.hotkey).toBe(false);
  });

  test('carries the accent through to the overlay', () => {
    const script = scriptWith({
      'data-hintora-endpoint': 'https://tag.test/guide',
      'data-hintora-accent': '#4f46e5',
    });
    expect(resolveConfig(document, script)?.accent).toBe('#4f46e5');
  });
});
