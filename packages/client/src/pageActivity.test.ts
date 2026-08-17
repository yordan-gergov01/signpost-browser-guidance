import { afterEach, beforeEach, describe as suite, expect, test, vi } from 'vitest';
import { trackActivity, type PageActivity } from '@signpost/client/pageActivity';

type Deferred = { promise: Promise<Response>; settle: () => void; fail: () => void };

function deferred(): Deferred {
  let settle = (): void => {};
  let fail = (): void => {};

  const promise = new Promise<Response>((resolve, reject) => {
    settle = () => resolve(new Response(null));
    fail = () => reject(new Error('offline'));
  });

  return { promise, settle, fail };
}

let hostFetch: ReturnType<typeof vi.fn>;
let activity: PageActivity;

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '';

  hostFetch = vi.fn(async () => new Response(null));
  vi.stubGlobal('fetch', hostFetch);

  activity = trackActivity({ ignore: (url) => url.includes('guide.test') });
});

afterEach(() => {
  activity.stop();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

suite('trackActivity', () => {
  test('is quiet on a page that is doing nothing', () => {
    expect(activity.busy()).toBe(false);
  });

  test('reports a fetch that has not come back yet', async () => {
    const call = deferred();
    hostFetch.mockReturnValueOnce(call.promise);

    void fetch('/api/contacts');
    expect(activity.busy()).toBe(true);

    call.settle();
    await vi.advanceTimersByTimeAsync(0);
    expect(activity.busy()).toBe(false);
  });

  test('stops waiting on a request that failed', async () => {
    const call = deferred();
    hostFetch.mockReturnValueOnce(call.promise);

    const inFlight = fetch('/api/contacts');
    call.fail();

    // The rejection has to reach the application exactly as it would have.
    await expect(inFlight).rejects.toThrow('offline');
    expect(activity.busy()).toBe(false);
  });

  test('passes arguments through untouched', async () => {
    await fetch('/api/contacts', { method: 'POST', body: 'x' });
    expect(hostFetch).toHaveBeenCalledWith('/api/contacts', {
      method: 'POST',
      body: 'x',
    });
  });

  test('does not count our own calls to the guidance service', () => {
    hostFetch.mockReturnValueOnce(deferred().promise);
    void fetch('https://guide.test/step');
    expect(activity.busy()).toBe(false);
  });

  // A stream or a long poll never completes. Treating that as "still working"
  // would mean the page is busy for the rest of the session.
  test('gives up on a request that never finishes', async () => {
    hostFetch.mockReturnValueOnce(deferred().promise);

    void fetch('/api/events');
    expect(activity.busy()).toBe(true);

    await vi.advanceTimersByTimeAsync(11_000);
    expect(activity.busy()).toBe(false);
  });

  test('reads aria-busy, which is what a design system marks a region with', () => {
    document.body.innerHTML = '<div aria-busy="true">Loading</div>';
    expect(activity.busy()).toBe(true);

    document.querySelector('div')!.setAttribute('aria-busy', 'false');
    expect(activity.busy()).toBe(false);
  });

  test('hands fetch back on teardown', () => {
    activity.stop();
    expect(window.fetch).toBe(hostFetch);
  });

  test('leaves a wrapper someone else added on top of ours alone', () => {
    const theirs = vi.fn();
    window.fetch = theirs as unknown as typeof fetch;

    activity.stop();

    expect(window.fetch).toBe(theirs);
  });
});
