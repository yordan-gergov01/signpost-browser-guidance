/**
 * Model configuration lives here and nowhere else.
 *
 * Selecting an element from a list we generated is a classification problem over
 * ten to twenty options, not a reasoning problem, so the default is the cheapest
 * tier that does the job. Escalation is earned by a bad answer - low confidence
 * or a schema failure - never predicted from the shape of the page.
 *
 * On the choice of family: gpt-5-nano is cheaper on input ($0.05 vs $0.10 per 1M)
 * and much cheaper on cached input, and it was the first pick for that reason.
 * It rejects `temperature: 0` outright, because the GPT-5 tier fixes sampling.
 * That trade is not worth taking here: reproducing a session is how a wrong
 * highlight gets diagnosed and how the eval numbers mean anything, and the
 * saving is around seven cents per ten thousand guidance calls. Determinism wins.
 *
 * Prices verified against OpenAI's pricing page, August 2026.
 */
export const MODELS = {
  select: 'gpt-4.1-nano',
  escalate: 'gpt-4.1-mini',
} as const;

export type ModelTier = keyof typeof MODELS;
export type ModelId = keyof typeof PRICING;

/** USD per million tokens. */
export type ModelPricing = {
  input: number;
  cachedInput: number;
  output: number;
  /**
   * The GPT-5 tier fixes sampling and rejects the parameter rather than
   * ignoring it, so this is a capability flag rather than a preference.
   */
  supportsTemperature: boolean;
};

/**
 * Both families are listed so the eval suite can put accuracy against cost for
 * each, instead of the default being an assertion.
 */
export const PRICING = {
  'gpt-4.1-nano': {
    input: 0.1,
    cachedInput: 0.025,
    output: 0.4,
    supportsTemperature: true,
  },
  'gpt-4.1-mini': {
    input: 0.4,
    cachedInput: 0.1,
    output: 1.6,
    supportsTemperature: true,
  },
  'gpt-5-nano': {
    input: 0.05,
    cachedInput: 0.005,
    output: 0.4,
    supportsTemperature: false,
  },
  'gpt-5-mini': {
    input: 0.25,
    cachedInput: 0.025,
    output: 2.0,
    supportsTemperature: false,
  },
} as const satisfies Record<string, ModelPricing>;

export type TokenUsage = {
  promptTokens: number;
  cachedPromptTokens: number;
  completionTokens: number;
};

export function supportsTemperature(model: ModelId): boolean {
  return PRICING[model].supportsTemperature;
}

export function costUsd(model: ModelId, usage: TokenUsage): number {
  const price = PRICING[model];
  const fresh = Math.max(0, usage.promptTokens - usage.cachedPromptTokens);

  return (
    (fresh * price.input +
      usage.cachedPromptTokens * price.cachedInput +
      usage.completionTokens * price.output) /
    1_000_000
  );
}
