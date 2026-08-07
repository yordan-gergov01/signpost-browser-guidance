import { SESSION_BUDGET } from '@hintora/core/config/budgets';

type SessionState = {
  llmCalls: number;
  inputTokens: number;
  steps: number;
  startedAt: number;
};

const SESSION_TTL_MS = 30 * 60_000;

/**
 * In-memory and per-process, which is the honest shape for a proof of concept.
 * In production this is Redis keyed by tenant and session, because the budget
 * has to hold across instances to mean anything.
 *
 * The client tracks its own count as well. Only this one is trusted: the client
 * is code we shipped to someone else's browser.
 */
export function createSessionStore() {
  const sessions = new Map<string, SessionState>();

  function sweep(): void {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [id, state] of sessions) {
      if (state.startedAt < cutoff) sessions.delete(id);
    }
  }

  return {
    get(sessionId: string): SessionState {
      sweep();
      const existing = sessions.get(sessionId);
      if (existing) return existing;

      const created: SessionState = {
        llmCalls: 0,
        inputTokens: 0,
        steps: 0,
        startedAt: Date.now(),
      };
      sessions.set(sessionId, created);
      return created;
    },

    exhausted(sessionId: string, stepIndex: number): string | null {
      const state = this.get(sessionId);
      if (state.llmCalls >= SESSION_BUDGET.maxLlmCalls) return 'call budget';
      if (state.inputTokens >= SESSION_BUDGET.maxInputTokens) return 'token budget';
      if (stepIndex >= SESSION_BUDGET.maxSteps) return 'step budget';
      return null;
    },

    record(sessionId: string, calls: number, inputTokens: number): void {
      const state = this.get(sessionId);
      state.llmCalls += calls;
      state.inputTokens += inputTokens;
      state.steps += 1;
    },

    size(): number {
      return sessions.size;
    },
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;
