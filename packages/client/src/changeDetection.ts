const DEBOUNCE_MS = 250;

type HistoryMethod = 'pushState' | 'replaceState';

/**
 * Single-page applications navigate without a document load, so the events a
 * plain listener sees are not enough. pushState and replaceState are patched
 * once, globally, and restored on teardown.
 *
 * Mutations are debounced because a React render fires dozens of them for one
 * logical change, and re-distilling on each would be both wasteful and wrong.
 */
export function watchForChange(
  onChange: () => void,
  debounceMs = DEBOUNCE_MS,
): () => void {
  let timer = 0;

  const schedule = (): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(onChange, debounceMs);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'disabled', 'aria-expanded', 'aria-selected', 'hidden'],
  });

  window.addEventListener('popstate', schedule);
  window.addEventListener('hashchange', schedule);

  const original: Partial<Record<HistoryMethod, History[HistoryMethod]>> = {};
  for (const method of ['pushState', 'replaceState'] as const) {
    original[method] = history[method];
    history[method] = function patched(
      this: History,
      ...args: Parameters<History['pushState']>
    ) {
      original[method]?.apply(this, args);
      schedule();
    };
  }

  return () => {
    window.clearTimeout(timer);
    observer.disconnect();
    window.removeEventListener('popstate', schedule);
    window.removeEventListener('hashchange', schedule);
    for (const method of ['pushState', 'replaceState'] as const) {
      const restore = original[method];
      if (restore) history[method] = restore;
    }
  };
}
