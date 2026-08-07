/**
 * How a step was arrived at, in descending order of certainty.
 *
 * The point of the ladder is that the model is the fallback, not the mechanism.
 * A mature deployment answers most intents from the top two rungs and only pays
 * for inference on genuinely novel ground.
 */
export type GuidanceTier =
  /** Authored and verified by the customer. Deterministic, no inference. */
  | 'curated'
  /** Learned from an earlier successful session and replayed. No inference. */
  | 'cached'
  /** Novel page or intent. Inferred, and gated on confidence. */
  | 'inferred';

export const TIER_LABEL: Record<GuidanceTier, string> = {
  curated: 'Verified flow',
  cached: 'Known flow',
  inferred: 'Working it out',
};
