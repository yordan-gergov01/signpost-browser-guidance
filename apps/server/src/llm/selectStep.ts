import OpenAI from 'openai';
import {
  costUsd,
  MODELS,
  supportsTemperature,
  type ModelId,
} from '@signpost/core/config/models';
import { ESCALATE_BELOW_CONFIDENCE } from '@signpost/core/config/budgets';
import { guideResponseSchema, type GuideResponse } from '@signpost/core/types/guide';
import type { PromptPageMap } from '@signpost/core/types/pageMap';
import { toStrictJsonSchema } from '@signpost/server/llm/jsonSchema';
import {
  buildUserMessage,
  PROMPT_VERSION,
  SYSTEM_PROMPT,
} from '@signpost/server/prompts/nextStep.v1';

const RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'signpost_next_step',
    strict: true,
    schema: toStrictJsonSchema(guideResponseSchema),
  },
} as const;

export type SelectionOutcome = {
  response: GuideResponse;
  model: ModelId;
  promptTokens: number;
  cachedPromptTokens: number;
  completionTokens: number;
  usd: number;
  latencyMs: number;
  escalated: boolean;
  calls: number;
};

/**
 * Strict mode guarantees the shape, not the truth. An id that is well-formed but
 * absent from the snapshot is exactly the failure this catches, and it is the
 * one that would otherwise put a highlight on nothing.
 */
function isGrounded(response: GuideResponse, pageMap: PromptPageMap): boolean {
  if (response.status !== 'step') return true;
  if (!response.elementId) return false;
  return pageMap.elements.some((element) => element.id === response.elementId);
}

export type Selector = ReturnType<typeof createSelector>;

/**
 * The words and the id have to agree.
 *
 * A weaker tier will write a perfectly correct sentence naming one control and
 * then hand back the id of another, which is the worst shape of wrong answer we
 * can get: the instruction reads right, so the user trusts it, and the highlight
 * lands on something else entirely. Grounding does not catch it, because the id
 * is a real id.
 *
 * Only quoted names are compared, because that is the one part of the sentence
 * the model is copying from the snapshot rather than composing.
 */
export function isConsistent(response: GuideResponse, pageMap: PromptPageMap): boolean {
  if (response.status !== 'step' || !response.elementId) return true;

  const chosen = pageMap.elements.find((element) => element.id === response.elementId);
  if (!chosen) return true;

  const quoted = Array.from(response.instruction.matchAll(/['"]([^'"]{2,60})['"]/g)).map(
    (match) => (match[1] ?? '').trim().toLowerCase(),
  );
  if (quoted.length === 0) return true;

  const name = chosen.name.trim().toLowerCase();
  if (
    name !== '' &&
    quoted.some((phrase) => name.includes(phrase) || phrase.includes(name))
  ) {
    return true;
  }

  // The sentence names a control that is on this page and is not the one it
  // chose. Anything vaguer than that is left alone: the model is allowed to
  // describe a control in words that are not its label.
  return !pageMap.elements.some(
    (element) =>
      element.id !== chosen.id &&
      element.name !== '' &&
      quoted.includes(element.name.trim().toLowerCase()),
  );
}

export function createSelector(apiKey: string) {
  const client = new OpenAI({ apiKey });

  async function callOnce(
    model: ModelId,
    pageMap: PromptPageMap,
    intent: string,
    history: readonly string[],
    tried: readonly string[],
  ) {
    const completion = await client.chat.completions.create({
      model,
      // Deterministic where the model allows it. The eval suite depends on this,
      // and so does any hope of reproducing a user's complaint. Models that fix
      // their own sampling reject the parameter rather than ignoring it, so it
      // is omitted rather than sent and swallowed.
      ...(supportsTemperature(model) ? { temperature: 0 } : {}),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage(pageMap, intent, history, tried) },
      ],
      response_format: RESPONSE_FORMAT,
    });

    const usage = {
      promptTokens: completion.usage?.prompt_tokens ?? 0,
      cachedPromptTokens: completion.usage?.prompt_tokens_details?.cached_tokens ?? 0,
      completionTokens: completion.usage?.completion_tokens ?? 0,
    };

    const raw = completion.choices[0]?.message.content ?? '';
    const parsed = guideResponseSchema.safeParse(JSON.parse(raw));

    return { parsed, usage };
  }

  return {
    promptVersion: PROMPT_VERSION,

    async selectStep(
      pageMap: PromptPageMap,
      intent: string,
      history: readonly string[],
      tried: readonly string[] = [],
    ): Promise<SelectionOutcome> {
      const started = Date.now();
      let calls = 0;
      let promptTokens = 0;
      let cachedPromptTokens = 0;
      let completionTokens = 0;
      let usd = 0;

      // Cheap model first, always. Escalation is earned by a bad answer, not
      // predicted by the shape of the page.
      for (const [tier, model] of [
        ['select', MODELS.select],
        ['escalate', MODELS.escalate],
      ] as const) {
        const attempt = await callOnce(model, pageMap, intent, history, tried);
        calls += 1;
        promptTokens += attempt.usage.promptTokens;
        cachedPromptTokens += attempt.usage.cachedPromptTokens;
        completionTokens += attempt.usage.completionTokens;
        usd += costUsd(model, attempt.usage);

        // The nano tier reliably bails to not_on_this_page on navigation steps -
        // it answers "go to Settings" while the Settings link is sitting in the
        // list it was given. The mini tier gets those right. Rather than fight it
        // with prompt wording, that answer is treated as a bad one and earns the
        // escalation the tier system already exists for. The eval suite reports
        // how often this fires.
        const bailedOnNavigation = attempt.parsed.success
          ? attempt.parsed.data.status === 'not_on_this_page'
          : false;

        const usable =
          attempt.parsed.success &&
          isGrounded(attempt.parsed.data, pageMap) &&
          isConsistent(attempt.parsed.data, pageMap) &&
          !bailedOnNavigation &&
          attempt.parsed.data.confidence > ESCALATE_BELOW_CONFIDENCE;

        const lastTier = tier === 'escalate';

        if (usable || lastTier) {
          const response: GuideResponse = attempt.parsed.success
            ? attempt.parsed.data
            : {
                status: 'unclear',
                elementId: null,
                action: 'click',
                instruction: 'I could not read the page well enough to be sure.',
                typeValue: null,
                confidence: 0,
                reasoning: 'schema validation failed',
                suggestedNavigation: null,
              };

          const unusable = !isGrounded(response, pageMap)
            ? 'model returned an id that is not in the snapshot'
            : !isConsistent(response, pageMap)
              ? 'instruction named one control and the id pointed at another'
              : null;

          // Both failures end the same way. Highlighting something the sentence
          // does not describe is worse than admitting we are not sure, so the
          // answer is downgraded rather than drawn.
          const grounded = unusable
            ? {
                ...response,
                status: 'unclear' as const,
                elementId: null,
                confidence: 0,
                reasoning: unusable,
              }
            : response;

          return {
            response: grounded,
            model,
            promptTokens,
            cachedPromptTokens,
            completionTokens,
            usd,
            latencyMs: Date.now() - started,
            escalated: calls > 1,
            calls,
          };
        }
      }

      throw new Error('unreachable: escalation tier always returns');
    },
  };
}
