import type { TelemetryEvent } from '@hintora/client/guidanceSession';

/**
 * What the guidance loop just cost, on screen while the demo runs.
 *
 * Development only, and it belongs to the demo rather than to the SDK: a
 * customer's users have no business seeing our token counts. Bottom left, out of
 * the overlay's way, and plain enough that nobody mistakes it for the product.
 */
export function createCostHud(): (event: TelemetryEvent) => void {
  const hud = document.createElement('div');
  hud.style.cssText =
    'position:fixed;left:12px;bottom:12px;z-index:2147483000;padding:8px 10px;' +
    'border-radius:8px;background:#101828ee;color:#e6ebf2;font:11px/1.6 ui-monospace,' +
    'SFMono-Regular,Menlo,monospace;white-space:pre;pointer-events:none';
  document.body.append(hud);

  return ({ state, cost }) => {
    hud.textContent = [
      `state      ${state}`,
      `calls      ${cost.calls} (${cost.escalations} escalated)`,
      `prompt     ${cost.promptTokens} tok, ${cost.cachedPromptTokens} cached`,
      `usd        $${cost.usd.toFixed(5)}`,
      `latency    ${cost.meanLatencyMs}ms mean`,
    ].join('\n');
  };
}
