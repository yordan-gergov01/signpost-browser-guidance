import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { guideRequestSchema, type GuideResult } from '@hintora/core/types/guide';
import { createSelector } from '@hintora/server/llm/selectStep';
import { createSessionStore } from '@hintora/server/sessions';
import type { Env } from '@hintora/server/env';

const MAX_BODY_BYTES = 256 * 1024;

export function buildServer(env: Env): FastifyInstance {
  const app = Fastify({
    // Structured logs, but never page content. Counts, tokens, latency and
    // outcome are enough to operate the thing; the map itself is the customer's.
    logger: { level: 'info' },
    bodyLimit: MAX_BODY_BYTES,
  });

  const selector = createSelector(env.openAiKey);
  const sessions = createSessionStore();

  void app.register(cors, {
    origin: env.corsOrigins,
    methods: ['POST'],
  });

  app.get('/health', () => ({ ok: true, prompt: selector.promptVersion }));

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
    if (exhausted) {
      const result: GuideResult = {
        exhausted: true,
        response: {
          status: 'unclear',
          elementId: null,
          action: 'click',
          instruction: "I've lost the thread on this one. Try asking again.",
          typeValue: null,
          confidence: 0,
          reasoning: `session hit the ${exhausted}`,
          suggestedNavigation: null,
        },
        stats: {
          model: 'none',
          promptTokens: 0,
          cachedPromptTokens: 0,
          completionTokens: 0,
          usd: 0,
          latencyMs: 0,
          escalated: false,
        },
      };
      return reply.send(result);
    }

    const outcome = await selector.selectStep(pageMap, intent, history, tried);
    sessions.record(sessionId, outcome.calls, outcome.promptTokens);

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

    return reply.send(result);
  });

  return app;
}
