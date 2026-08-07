/**
 * hit    - found the control that was recorded
 * wrong  - found a different control, and said nothing about it
 * missed - found nothing
 *
 * The three are not equally bad. A miss shows the user a sentence instead of a
 * highlight, which is disappointing. A wrong answer points confidently at the
 * wrong button, which is how a guidance product deletes somebody's account.
 */
export type Verdict = 'hit' | 'wrong' | 'missed';

export type Trial = {
  locator: string;
  mutation: string;
  verdict: Verdict;
  /** False when the correct answer was to find nothing. */
  survivable: boolean;
};

export type Score = {
  locator: string;
  trials: number;
  /** Found the right control when there was a right control to find. */
  top1: number;
  /** Pointed at the wrong thing. The metric that matters most. */
  confidentErrors: number;
  /** Declined to answer when the control was gone. */
  correctAbstentions: number;
};

function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
}

export function score(trials: readonly Trial[]): Score[] {
  const byLocator = new Map<string, Trial[]>();
  for (const trial of trials) {
    byLocator.set(trial.locator, [...(byLocator.get(trial.locator) ?? []), trial]);
  }

  return Array.from(byLocator, ([locator, own]) => {
    const findable = own.filter((trial) => trial.survivable);
    const gone = own.filter((trial) => !trial.survivable);

    return {
      locator,
      trials: own.length,
      top1: percent(
        findable.filter((trial) => trial.verdict === 'hit').length,
        findable.length,
      ),
      confidentErrors: percent(
        own.filter((trial) => trial.verdict === 'wrong').length,
        own.length,
      ),
      correctAbstentions: percent(
        gone.filter((trial) => trial.verdict === 'missed').length,
        gone.length,
      ),
    };
  });
}

export function table(scores: readonly Score[]): string {
  const rows = scores.map(
    (row) =>
      `${row.locator.padEnd(22)} ${String(row.top1).padStart(5)}% ` +
      `${String(row.confidentErrors).padStart(6)}% ${String(row.correctAbstentions).padStart(6)}%`,
  );

  return [
    `${'locator'.padEnd(22)} ${'top-1'.padStart(6)} ${'wrong'.padStart(7)} ${'abstain'.padStart(7)}`,
    ...rows,
  ].join('\n');
}
