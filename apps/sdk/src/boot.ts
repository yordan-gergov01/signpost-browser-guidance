import { resolveConfig } from '@signpost/sdk/config';
import { createSignpost } from '@signpost/sdk/signpost';
import { bindTriggers } from '@signpost/sdk/triggers';
import type { Signpost, SignpostOptions } from '@signpost/sdk/types';

let instance: Signpost | null = null;

/**
 * Starts the guide. Returns null when there is no usable endpoint, and warns
 * instead of throwing: this code runs inside someone else's application, and a
 * misconfigured guide has no business taking their page down with it.
 *
 * Idempotent, because a tag manager will happily deliver the same script twice.
 */
export function boot(options: SignpostOptions = {}): Signpost | null {
  if (instance) return instance;

  const config = resolveConfig(document, options.script ?? null, options);
  if (!config) {
    console.warn('Signpost: no valid endpoint configured, staying inert.');
    return null;
  }

  const signpost = createSignpost(config);
  const unbindTriggers = bindTriggers(document, signpost);

  instance = {
    ...signpost,
    destroy: () => {
      unbindTriggers();
      signpost.destroy();
      instance = null;
    },
  };

  return instance;
}
