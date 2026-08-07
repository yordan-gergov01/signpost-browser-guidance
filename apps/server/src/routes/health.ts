import type { FastifyInstance } from 'fastify';
import type { Selector } from '@hintora/server/llm/selectStep';
import type { SessionStore } from '@hintora/server/sessions';

export type HealthRouteDeps = {
  selector: Selector;
  sessions: SessionStore;
};

export function registerHealthRoute(app: FastifyInstance, deps: HealthRouteDeps): void {
  app.get('/health', (_request, reply) =>
    reply.code(200).send({
      prompt: deps.selector.promptVersion,
      sessions: deps.sessions.size(),
    }),
  );
}
