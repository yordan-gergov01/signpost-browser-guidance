import { createGuidance } from '@hintora/client/guidanceSession';
import { createOverlay } from '@hintora/overlay/overlay';
import type { Hintora, HintoraConfig } from '@hintora/sdk/types';

/**
 * Assembles the three pieces and hands back the public API.
 *
 * Nothing here knows how a step is chosen. The overlay draws, the client runs
 * the loop, the server talks to the model. This file is the seam a customer
 * never sees past.
 */
export function createHintora(config: HintoraConfig): Hintora {
  const overlay = createOverlay({
    suggestions: config.suggestions,
    hotkey: config.hotkey,
    ...(config.accent ? { accent: config.accent } : {}),
    handlers: {
      // Three different things the user can tell us, and three different things
      // they mean. Collapsing them into one call is what made the loop repeat.
      onIntent: (intent) => api.run(intent),
      onTargetActivated: () => guidance.advance(),
      onAlreadyDone: () => guidance.skip(),
      onWrongStep: () => guidance.reject(),
      onCancel: () => guidance.stop(),
    },
  });

  const guidance = createGuidance({
    endpoint: config.endpoint,
    surface: overlay,
    ...(config.onTelemetry ? { onTelemetry: config.onTelemetry } : {}),
  });

  const api: Hintora = {
    ask: () => overlay.ask(),

    run: (intent) => void guidance.start(intent),

    stop: () => guidance.stop(),

    destroy: () => {
      guidance.stop();
      overlay.destroy();
    },
  };

  return api;
}
