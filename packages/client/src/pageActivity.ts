/**
 * A request that never finishes stops counting. Server-sent events, long polls
 * and hanging keep-alives are normal in the applications we guide, and one of
 * them would otherwise mean the page is busy for the rest of the session.
 */
const REQUEST_PATIENCE_MS = 10_000;

export type PageActivity = {
  /** True while the host application looks like it is still working. */
  busy: () => boolean;
  stop: () => void;
};

export type ActivityOptions = {
  /** Our own calls to the guidance service are not the application working. */
  ignore?: (url: string) => boolean;
};

type Pending = { at: number };

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/**
 * Answers one question: is the host application in the middle of something?
 *
 * Without it, deciding whether a click did anything comes down to a fixed
 * deadline, which is a guess about software we have never seen. The same click
 * is a synchronous re-render in one application and a two second round trip in
 * the next, and no single number is right for both.
 *
 * fetch and XMLHttpRequest are wrapped because nothing else reports a request
 * that is still in flight; the performance timeline only reports them once they
 * are over, which is too late to be worth anything here. The wrappers count and
 * nothing else: every argument is passed through untouched, the result is never
 * inspected, failures propagate exactly as they would have. On teardown they are
 * removed only if they are still the outermost wrapper, because a customer's own
 * instrumentation may well have wrapped ours since, and restoring blindly would
 * break theirs instead of ours.
 */
export function trackActivity(options: ActivityOptions = {}): PageActivity {
  const ignore = options.ignore ?? (() => false);
  const pending = new Set<Pending>();

  function begin(): Pending {
    const token: Pending = { at: Date.now() };
    pending.add(token);
    return token;
  }

  const originalFetch = window.fetch;
  const patchedFetch: typeof window.fetch = (input, init) => {
    if (ignore(urlOf(input))) return originalFetch.call(window, input, init);

    const token = begin();
    // finally, never catch: a request that fails has to reject exactly as it
    // would have without us in the way.
    return originalFetch.call(window, input, init).finally(() => pending.delete(token));
  };
  window.fetch = patchedFetch;

  const originalSend = XMLHttpRequest.prototype.send;
  function patchedSend(
    this: XMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit | null,
  ): void {
    const token = begin();
    this.addEventListener('loadend', () => pending.delete(token));
    originalSend.call(this, body);
  }
  XMLHttpRequest.prototype.send = patchedSend;

  return {
    busy() {
      const cutoff = Date.now() - REQUEST_PATIENCE_MS;

      // Insertion order, so the stale ones are always at the front.
      for (const token of pending) {
        if (token.at >= cutoff) return true;
        pending.delete(token);
      }

      // The one loading signal the platform standardised. Its absence proves
      // nothing, which is why it is the last thing asked rather than the first.
      return document.querySelector('[aria-busy="true"]') !== null;
    },

    stop() {
      if (window.fetch === patchedFetch) window.fetch = originalFetch;
      if (XMLHttpRequest.prototype.send === patchedSend) {
        XMLHttpRequest.prototype.send = originalSend;
      }
      pending.clear();
    },
  };
}
