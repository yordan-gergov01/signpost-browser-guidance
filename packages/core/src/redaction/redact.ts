import { PII_PATTERNS, type PiiKind } from '@signpost/core/redaction/patterns';

export type RedactionReport = Partial<Record<PiiKind, number>>;

export function mergeRedactionReports(
  into: RedactionReport,
  from: RedactionReport,
): void {
  for (const [kind, count] of Object.entries(from) as [PiiKind, number][]) {
    into[kind] = (into[kind] ?? 0) + count;
  }
}

export function totalRedactions(report: RedactionReport): number {
  return Object.values(report).reduce((sum, count) => sum + count, 0);
}

export function redactText(value: string): { text: string; report: RedactionReport } {
  const report: RedactionReport = {};
  let text = value;

  for (const { kind, pattern, placeholder, guard } of PII_PATTERNS) {
    // Fresh regex per call: the shared literals carry /g and therefore lastIndex.
    const matcher = new RegExp(pattern.source, pattern.flags);
    let hits = 0;
    text = text.replace(matcher, (match) => {
      if (guard && !guard.test(match)) return match;
      hits += 1;
      return placeholder;
    });
    if (hits > 0) report[kind] = hits;
  }

  return { text, report };
}
