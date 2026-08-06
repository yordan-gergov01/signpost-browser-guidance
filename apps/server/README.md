# @hintora/server

Fastify LLM proxy and flow cache.

The API key lives here and only here. Clients call `POST /guide`; the server
calls OpenAI. Budgets, rate limits and payload validation are enforced on this
side, because the client is not trusted.

Filled in by the `llm-loop` phase.
