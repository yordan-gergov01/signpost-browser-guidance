import { afterEach, beforeEach, describe as suite, expect, test, vi } from 'vitest';
import { watchOutcome } from '@hintora/client/actionOutcome';

const onChanged = vi.fn();
const onInert = vi.fn();

let changed = false;
let busy = false;
let cancel: () => void;

function watch(): void {
  cancel = watchOutcome({
    changed: () => changed,
    busy: () => busy,
    onChanged,
    onInert,
  });
}

/** Whatever the host application does to its own DOM. */
function churn(): void {
  document.body.insertAdjacentHTML('beforeend', '<span>rendered</span>');
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  document.body.innerHTML = '';
  changed = false;
  busy = false;
});

afterEach(() => {
  cancel();
  vi.useRealTimers();
});

suite('watchOutcome', () => {
  test('calls it inert once the page has gone quiet', async () => {
    watch();
    await vi.advanceTimersByTimeAsync(600);

    expect(onInert).toHaveBeenCalledTimes(1);
    expect(onChanged).not.toHaveBeenCalled();
  });

  test('does not call anything inert in the first moments', async () => {
    watch();
    await vi.advanceTimersByTimeAsync(300);
    expect(onInert).not.toHaveBeenCalled();
  });

  test('reports a change as soon as the page shows one', async () => {
    watch();
    changed = true;
    churn();
    await vi.advanceTimersByTimeAsync(10);

    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(onInert).not.toHaveBeenCalled();
  });

  // The case a fixed deadline gets wrong: a click that goes to the server. There
  // is nothing to see for as long as the request is out, and the application is
  // working perfectly.
  test('waits out a request rather than calling the control dead', async () => {
    busy = true;
    watch();

    await vi.advanceTimersByTimeAsync(5_000);
    expect(onInert).not.toHaveBeenCalled();

    changed = true;
    busy = false;
    await vi.advanceTimersByTimeAsync(500);

    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  test('answers as soon as the request comes back with nothing to show', async () => {
    busy = true;
    watch();
    await vi.advanceTimersByTimeAsync(2_000);

    busy = false;
    await vi.advanceTimersByTimeAsync(500);

    expect(onInert).toHaveBeenCalledTimes(1);
  });

  // A dashboard with a live feed never holds still. It still has to get an
  // answer, and the answer is the same one the quiet path would have given.
  test('gives a verdict on a page that never stops moving', async () => {
    const ticking = setInterval(churn, 100);
    watch();

    await vi.advanceTimersByTimeAsync(9_000);
    clearInterval(ticking);

    expect(onInert).toHaveBeenCalledTimes(1);
  });

  test('stops reporting once cancelled', async () => {
    watch();
    cancel();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(onInert).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  test('reports once, whatever happens afterwards', async () => {
    watch();
    await vi.advanceTimersByTimeAsync(600);

    changed = true;
    churn();
    await vi.advanceTimersByTimeAsync(2_000);

    expect(onInert).toHaveBeenCalledTimes(1);
    expect(onChanged).not.toHaveBeenCalled();
  });
});
