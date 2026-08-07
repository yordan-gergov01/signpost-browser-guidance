/**
 * Hard stops for a single guidance session, enforced server-side. The client
 * counts too, but only the server's count is trusted.
 *
 * A loop that cannot terminate is the failure mode that turns a cheap product
 * into an expensive one, so the budget is small and the message when it runs out
 * is honest rather than another attempt.
 */
export const SESSION_BUDGET = {
  maxSteps: 8,
  maxLlmCalls: 12,
  maxInputTokens: 60_000,
} as const;

/**
 * An intent can arrive from a host page attribute, so it is untrusted text on
 * its way into a prompt. Length is the one bound worth enforcing on both sides.
 */
export const MAX_INTENT_LENGTH = 400;

/** Cap on the elements in one PageMap. Rejected server-side above this. */
export const MAX_ELEMENTS = 120;

/** Below this the model is not confident enough to point at anything. */
export const MIN_CONFIDENCE = 0.6;

/** Escalate to the stronger model at or below this. */
export const ESCALATE_BELOW_CONFIDENCE = 0.75;
