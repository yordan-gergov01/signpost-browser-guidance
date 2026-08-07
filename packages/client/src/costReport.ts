import type { GuideCallStats } from '@hintora/core/types/guide';

export type CostReport = {
  calls: number;
  escalations: number;
  promptTokens: number;
  cachedPromptTokens: number;
  completionTokens: number;
  usd: number;
  meanLatencyMs: number;
};

/**
 * Every call is accounted for from the first one. Cost is a product constraint
 * for something that runs on every session of every customer, so it is measured
 * rather than estimated afterwards.
 */
export function createCostReport() {
  const calls: GuideCallStats[] = [];

  return {
    record(stats: GuideCallStats): void {
      if (stats.model !== 'none') calls.push(stats);
    },

    snapshot(): CostReport {
      const total = calls.reduce(
        (sum, call) => ({
          promptTokens: sum.promptTokens + call.promptTokens,
          cachedPromptTokens: sum.cachedPromptTokens + call.cachedPromptTokens,
          completionTokens: sum.completionTokens + call.completionTokens,
          usd: sum.usd + call.usd,
          latencyMs: sum.latencyMs + call.latencyMs,
        }),
        {
          promptTokens: 0,
          cachedPromptTokens: 0,
          completionTokens: 0,
          usd: 0,
          latencyMs: 0,
        },
      );

      return {
        calls: calls.length,
        escalations: calls.filter((call) => call.escalated).length,
        promptTokens: total.promptTokens,
        cachedPromptTokens: total.cachedPromptTokens,
        completionTokens: total.completionTokens,
        usd: total.usd,
        meanLatencyMs:
          calls.length === 0 ? 0 : Math.round(total.latencyMs / calls.length),
      };
    },

    reset(): void {
      calls.length = 0;
    },
  };
}

export type CostReporter = ReturnType<typeof createCostReport>;
