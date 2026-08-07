import { resolveConfig } from '@hintora/sdk/config';
import { createHintora } from '@hintora/sdk/hintora';
import { bindTriggers } from '@hintora/sdk/triggers';
import type { Hintora, HintoraOptions } from '@hintora/sdk/types';

let instance: Hintora | null = null;

/**
 * Starts the guide. Returns null when there is no usable endpoint, and warns
 * instead of throwing: this code runs inside someone else's application, and a
 * misconfigured guide has no business taking their page down with it.
 *
 * Idempotent, because a tag manager will happily deliver the same script twice.
 */
export function boot(options: HintoraOptions = {}): Hintora | null {
  if (instance) return instance;

  const config = resolveConfig(document, options.script ?? null, options);
  if (!config) {
    console.warn('Hintora: no valid endpoint configured, staying inert.');
    return null;
  }

  const hintora = createHintora(config);
  const unbindTriggers = bindTriggers(document, hintora);

  instance = {
    ...hintora,
    destroy: () => {
      unbindTriggers();
      hintora.destroy();
      instance = null;
    },
  };

  return instance;
}
