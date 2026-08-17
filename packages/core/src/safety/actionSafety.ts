import type { PageElement } from '@signpost/core/types/pageMap';

export type ActionRisk = 'safe' | 'destructive' | 'irreversible';

export type RiskAssessment = {
  risk: ActionRisk;
  /** The phrase that triggered the classification, for the confirmation copy. */
  matched?: string;
};

/**
 * Checked before `DESTRUCTIVE`, because "cancel subscription" and "cancel" mean
 * opposite things and the longer phrase has to win.
 */
const IRREVERSIBLE = [
  /\bdelete\b/i,
  /\bcancel\s+(subscription|plan|account)\b/i,
  /\bdeactivate\b/i,
  /\bclose\s+account\b/i,
  /\btransfer\b/i,
  /\berase\b/i,
  /\bpermanently\b/i,
];

const DESTRUCTIVE = [
  /\bremove\b/i,
  /\brevoke\b/i,
  /\bdiscard\b/i,
  /\breset\b/i,
  /\bclear\b/i,
  /\barchive\b/i,
  /\bunsubscribe\b/i,
];

function firstMatch(text: string, patterns: readonly RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) return match[0];
  }
  return undefined;
}

/**
 * Name-based, so it works on any application without configuration. It is a
 * heuristic and will miss an unlabelled icon button, which is why the overlay
 * asks for confirmation rather than trusting the classification to be complete.
 */
export function classifyAction(element: Pick<PageElement, 'name'>): RiskAssessment {
  const text = element.name;

  const irreversible = firstMatch(text, IRREVERSIBLE);
  if (irreversible) return { risk: 'irreversible', matched: irreversible };

  const destructive = firstMatch(text, DESTRUCTIVE);
  if (destructive) return { risk: 'destructive', matched: destructive };

  return { risk: 'safe' };
}

export function requiresConfirmation(assessment: RiskAssessment): boolean {
  return assessment.risk !== 'safe';
}
