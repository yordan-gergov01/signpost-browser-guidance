/** How long the page has to hold still before "nothing happened" is a verdict. */
const QUIET_MS = 400;

/** Nothing is called inert sooner than this: some handlers start late. */
const MIN_WAIT_MS = 500;

/** Backstop for a page that never goes quiet, a dashboard with a live feed. */
const CEILING_MS = 8_000;

/** Reading the page is not free, so it is bounded during a busy render. */
const CHECK_THROTTLE_MS = 250;

export type OutcomeOptions = {
  /** Evidence that the action did something. Re-reads the page, so throttled. */
  changed: () => boolean;
  busy: () => boolean;
  onChanged: () => void;
  onInert: () => void;
};

/**
 * Decides whether what the user just did actually did anything.
 *
 * The naive version is a deadline: wait N milliseconds, then look. There is no N
 * that holds across other people's software. The same click is a synchronous
 * re-render in one application and a two second round trip in the next, so a
 * deadline short enough to feel responsive calls working software broken, and
 * one long enough to be safe makes every dead end feel like a hang.
 *
 * So the deadline is replaced by evidence. Positive evidence ends the wait
 * immediately and at any point. Only the negative verdict has to be waited for,
 * and what it waits for is the application going quiet: no DOM churn, no request
 * in flight, nothing marked busy. That is a property of the page rather than a
 * number we picked, and it is the same property in every application.
 *
 * The ceiling is not a deadline in disguise. It is there for the page that never
 * goes quiet at all, and reaching it says what the quiet path would have said.
 */
export function watchOutcome(options: OutcomeOptions): () => void {
  const startedAt = Date.now();

  let settled = false;
  let quietTimer = 0;
  let ceilingTimer = 0;
  let checkedAt = 0;

  function stop(): void {
    settled = true;
    observer.disconnect();
    window.clearTimeout(quietTimer);
    window.clearTimeout(ceilingTimer);
  }

  function conclude(report: () => void): void {
    if (settled) return;
    stop();
    report();
  }

  function scheduleQuiet(): void {
    window.clearTimeout(quietTimer);
    const floor = MIN_WAIT_MS - (Date.now() - startedAt);
    quietTimer = window.setTimeout(onQuiet, Math.max(QUIET_MS, floor));
  }

  function onQuiet(): void {
    if (settled) return;

    if (options.changed()) {
      conclude(options.onChanged);
      return;
    }

    // Still on the surface, still working underneath: a request is out, or the
    // application has told us so itself. Give it as long as it needs.
    if (options.busy()) {
      scheduleQuiet();
      return;
    }

    conclude(options.onInert);
  }

  function onMutation(): void {
    if (settled) return;

    scheduleQuiet();

    if (Date.now() - checkedAt < CHECK_THROTTLE_MS) return;
    checkedAt = Date.now();
    if (options.changed()) conclude(options.onChanged);
  }

  const observer = new MutationObserver(onMutation);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });

  ceilingTimer = window.setTimeout(() => conclude(options.onInert), CEILING_MS);
  scheduleQuiet();

  return stop;
}
