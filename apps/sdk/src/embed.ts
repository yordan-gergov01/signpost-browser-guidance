import { boot } from '@hintora/sdk/boot';
import { drainQueue } from '@hintora/sdk/queue';

// Read at evaluation time: `document.currentScript` only points at our tag while
// the tag itself is executing.
const script = document.currentScript;

function start(): void {
  const pending = window.hintora;

  const hintora = boot({ script });
  if (!hintora) return;

  window.hintora = hintora;
  drainQueue(pending, hintora);
}

// The tag usually sits in <head>, and the overlay wants a page to attach to.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
