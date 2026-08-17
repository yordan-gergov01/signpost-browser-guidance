import type { Signpost } from '@signpost/sdk/types';

/**
 * The embed is meant to be loaded async, which means host code can call us
 * before we exist. The documented stub is an array:
 *
 *   window.signpost = window.signpost || [];
 *   window.signpost.push(['run', 'export my contacts']);
 *
 * Anything unrecognised is dropped rather than thrown: this runs inside someone
 * else's page, and a stale queued call is not worth breaking their app over.
 */
export function drainQueue(pending: unknown, signpost: Signpost): void {
  if (!Array.isArray(pending)) return;

  for (const call of pending) {
    if (!Array.isArray(call)) continue;
    const [method, argument] = call as readonly unknown[];

    if (method === 'ask') signpost.ask();
    else if (method === 'stop') signpost.stop();
    else if (method === 'run' && typeof argument === 'string') signpost.run(argument);
  }
}
