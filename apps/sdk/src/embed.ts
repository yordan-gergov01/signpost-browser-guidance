import { boot } from '@signpost/sdk/boot';
import { drainQueue } from '@signpost/sdk/queue';

// Read at evaluation time: `document.currentScript` only points at our tag while
// the tag itself is executing.
const script = document.currentScript;

function start(): void {
  const pending = window.signpost;

  const signpost = boot({ script });
  if (!signpost) return;

  window.signpost = signpost;
  drainQueue(pending, signpost);
}

// The tag usually sits in <head>, and the overlay wants a page to attach to.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}
