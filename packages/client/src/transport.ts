import {
  guideResultSchema,
  type GuideRequest,
  type GuideResult,
} from '@hintora/core/types/guide';

/**
 * The client never holds an API key. It talks to our own endpoint, which holds
 * the key and enforces the budget, and it validates what comes back because a
 * server response is input like any other.
 */
export async function requestStep(
  endpoint: string,
  request: GuideRequest,
  signal?: AbortSignal,
): Promise<GuideResult> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...(signal ? { signal } : {}),
  });

  if (!response.ok) {
    throw new Error(`guide endpoint returned ${response.status}`);
  }

  return guideResultSchema.parse(await response.json());
}
