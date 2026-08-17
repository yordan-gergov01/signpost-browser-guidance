import { z } from 'zod';
import { MAX_ELEMENTS, MAX_INTENT_LENGTH } from '@signpost/core/config/budgets';
import { promptPageMapSchema } from '@signpost/core/types/pageMap';

/**
 * Every optional field is `.nullable()` and still required.
 *
 * OpenAI strict structured outputs will not accept a schema with genuinely
 * optional keys: everything must appear in `required` and `additionalProperties`
 * must be false. Nullable-and-required is the shape that satisfies both the API
 * and the fact that most of these fields do not apply to most answers.
 */
export const guideResponseSchema = z.object({
  status: z.enum(['step', 'not_on_this_page', 'done', 'unclear', 'refused']),
  /** Must be an id from the snapshot we sent. Never a selector. */
  elementId: z.string().nullable(),
  action: z.enum(['click', 'type', 'select', 'scroll_to']),
  /** One short sentence, shown to the user as-is. */
  instruction: z.string(),
  typeValue: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  /** Short. Surfaced in the debug panel, never in the guidance copy. */
  reasoning: z.string(),
  suggestedNavigation: z.string().nullable(),
});

export type GuideResponse = z.infer<typeof guideResponseSchema>;

export const guideRequestSchema = z.object({
  sessionId: z.string().min(1).max(128),
  intent: z.string().min(1).max(MAX_INTENT_LENGTH),
  stepIndex: z.number().int().min(0).max(64),
  pageMap: promptPageMapSchema.refine(
    (map) => map.elements.length <= MAX_ELEMENTS,
    `at most ${MAX_ELEMENTS} elements`,
  ),
  /** What the user has already been guided through, for continuity. */
  history: z.array(z.string().max(300)).max(16).default([]),
  /**
   * Controls already offered on this exact page state, and what came of them.
   * They have been removed from the snapshot; this says why they are missing.
   */
  tried: z.array(z.string().max(300)).max(8).default([]),
});

export type GuideRequest = z.infer<typeof guideRequestSchema>;

export const guideCallStatsSchema = z.object({
  model: z.string(),
  promptTokens: z.number(),
  cachedPromptTokens: z.number(),
  completionTokens: z.number(),
  usd: z.number(),
  latencyMs: z.number(),
  escalated: z.boolean(),
});

export type GuideCallStats = z.infer<typeof guideCallStatsSchema>;

export const guideResultSchema = z.object({
  response: guideResponseSchema,
  stats: guideCallStatsSchema,
  /** Set when the session hit a budget and stopped on purpose. */
  exhausted: z.boolean().default(false),
});

export type GuideResult = z.infer<typeof guideResultSchema>;
