export type InjectionReport = { hits: number; samples: string[] };

const MAX_SAMPLES = 5;

/**
 * Instruction-shaped text that has no business appearing in a button label.
 *
 * Deliberately short and boring. These heuristics are defence in depth, not the
 * defence: a determined phrasing will get through. What actually contains an
 * injection is that the model may only answer with an id from a list we built,
 * so the worst a successful one achieves is pointing at a different real button.
 */
const INJECTION_PATTERNS: readonly RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)/gi,
  /disregard\s+(the\s+)?(previous|prior|above|instructions)/gi,
  /system\s+prompt/gi,
  /you\s+are\s+now\b/gi,
  /new\s+instructions?\b/gi,
  /\b(assistant|system|developer)\s*:/gi,
];

export function stripInjection(value: string): { text: string; report: InjectionReport } {
  const samples: string[] = [];
  let text = value;

  for (const pattern of INJECTION_PATTERNS) {
    const matcher = new RegExp(pattern.source, pattern.flags);
    text = text.replace(matcher, (match) => {
      if (samples.length < MAX_SAMPLES) samples.push(match);
      return '[filtered]';
    });
  }

  return { text, report: { hits: samples.length, samples } };
}

export function containsInjection(value: string): boolean {
  return stripInjection(value).report.hits > 0;
}
