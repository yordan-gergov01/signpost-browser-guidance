import type { FastifyInstance } from 'fastify';
import { guideRequestSchema, type GuideResult } from '@hintora/core/types/guide';
import type { Selector } from '@hintora/server/llm/selectStep';
import type { SessionStore } from '@hintora/server/sessions';

export type GuideRouteDeps = {
  selector: Selector;
  sessions: SessionStore;
};

const NO_CALL_STATS = {
  model: 'none',
  promptTokens: 0,
  cachedPromptTokens: 0,
  completionTokens: 0,
  usd: 0,
  latencyMs: 0,
  escalated: false,
};

/**
 * A session that has spent its budget still gets a well-formed answer, because
 * the client has to render something and an error would look like a bug rather
 * than a limit. The honest content is that we have lost the thread.
 */
function exhaustedResult(reason: string): GuideResult {
  return {
    exhausted: true,
    response: {
      status: 'unclear',
      elementId: null,
      action: 'click',
      instruction: "I've lost the thread on this one. Try asking again.",
      typeValue: null,
      confidence: 0,
      reasoning: `session hit the ${reason}`,
      suggestedNavigation: null,
    },
    stats: NO_CALL_STATS,
  };
}

/**
 * The one route that spends money.
 *
 * Everything here is HTTP: validate, enforce the budget, log what it cost, and
 * hand the shape back. Choosing a step is the selector's job and remembering
 * what a session has spent is the store's; this file only decides what the wire
 * sees.
 */
export function registerGuideRoute(app: FastifyInstance, deps: GuideRouteDeps): void {
  const { selector, sessions } = deps;

  app.post('/guide', async (request, reply) => {
    const parsed = guideRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      // Never trust the client: an oversized or malformed map is rejected before
      // a single token is spent on it.
      return reply
        .code(400)
        .send({ error: 'invalid request', detail: parsed.error.issues });
    }

    const { sessionId, intent, pageMap, stepIndex, history, tried } = parsed.data;

    const exhausted = sessions.exhausted(sessionId, stepIndex);
    if (exhausted) return reply.code(200).send(exhaustedResult(exhausted));

    const outcome = await selector.selectStep(pageMap, intent, history, tried);
    sessions.record(sessionId, outcome.calls, outcome.promptTokens);

    // Structured, but never page content. Counts, tokens, latency and outcome are
    // enough to operate the thing; the map itself is the customer's.
    request.log.info({
      sessionId,
      stepIndex,
      elements: pageMap.elements.length,
      tried: tried.length,
      status: outcome.response.status,
      confidence: outcome.response.confidence,
      model: outcome.model,
      escalated: outcome.escalated,
      promptTokens: outcome.promptTokens,
      cachedPromptTokens: outcome.cachedPromptTokens,
      completionTokens: outcome.completionTokens,
      usd: outcome.usd,
      latencyMs: outcome.latencyMs,
    });

    const result: GuideResult = {
      response: outcome.response,
      exhausted: false,
      stats: {
        model: outcome.model,
        promptTokens: outcome.promptTokens,
        cachedPromptTokens: outcome.cachedPromptTokens,
        completionTokens: outcome.completionTokens,
        usd: outcome.usd,
        latencyMs: outcome.latencyMs,
        escalated: outcome.escalated,
      },
    };

    return reply.code(200).send(result);
  });
}
