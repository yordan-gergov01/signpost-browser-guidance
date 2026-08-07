import type { Hintora } from '@hintora/sdk/types';

/**
 * The embed is meant to be loaded async, which means host code can call us
 * before we exist. The documented stub is an array:
 *
 *   window.hintora = window.hintora || [];
 *   window.hintora.push(['run', 'export my contacts']);
 *
 * Anything unrecognised is dropped rather than thrown: this runs inside someone
 * else's page, and a stale queued call is not worth breaking their app over.
 */
export function drainQueue(pending: unknown, hintora: Hintora): void {
  if (!Array.isArray(pending)) return;

  for (const call of pending) {
    if (!Array.isArray(call)) continue;
    const [method, argument] = call as readonly unknown[];

    if (method === 'ask') hintora.ask();
    else if (method === 'stop') hintora.stop();
    else if (method === 'run' && typeof argument === 'string') hintora.run(argument);
  }
}
