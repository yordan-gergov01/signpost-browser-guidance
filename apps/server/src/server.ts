import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { createSelector } from '@signpost/server/llm/selectStep';
import { registerGuideRoute } from '@signpost/server/routes/guide';
import { registerHealthRoute } from '@signpost/server/routes/health';
import { createSessionStore } from '@signpost/server/sessions';
import type { Env } from '@signpost/server/env';

const MAX_BODY_BYTES = 256 * 1024;

/**
 * Composition only: build the dependencies, set the two policies that apply to
 * every request, and hand both to the routes. Anything that decides what a
 * response contains lives under routes/.
 */
export function buildServer(env: Env): FastifyInstance {
  const app = Fastify({
    logger: { level: 'info' },
    bodyLimit: MAX_BODY_BYTES,
  });

  const dependencies = {
    selector: createSelector(env.openAiKey),
    sessions: createSessionStore(),
  };

  void app.register(cors, {
    origin: env.corsOrigins,
    methods: ['POST'],
  });

  registerHealthRoute(app, dependencies);
  registerGuideRoute(app, dependencies);

  return app;
}
