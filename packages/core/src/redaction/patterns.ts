export type PiiKind = 'token' | 'email' | 'iban' | 'card' | 'phone' | 'number';

export type PiiPattern = {
  kind: PiiKind;
  pattern: RegExp;
  placeholder: string;
  /** Match is only accepted when this also matches, used to narrow a loose rule. */
  guard?: RegExp;
};

/**
 * Order is significant: the greedier patterns run first so a card number is not
 * consumed by the generic long-digit rule and lose its label.
 *
 * These are heuristics. They are the second line of defence - the first is that
 * input values are never read in the first place - so a false negative here does
 * not by itself leak a form field.
 */
export const PII_PATTERNS: readonly PiiPattern[] = [
  { kind: 'token', pattern: /\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, placeholder: '[token]' },
  { kind: 'email', pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/g, placeholder: '[email]' },
  { kind: 'iban', pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,28}\b/g, placeholder: '[iban]' },
  { kind: 'card', pattern: /\b(?:\d[ -]?){13,19}\b/g, placeholder: '[card]' },
  {
    kind: 'phone',
    pattern: /\+?\d[\d\s().-]{7,}\d/g,
    placeholder: '[phone]',
    // A digit run with no separator and no country prefix is far more likely an
    // order or account id, so it falls through to the generic number rule and
    // gets labelled honestly.
    guard: /[+\s().-]/,
  },
  { kind: 'number', pattern: /\b\d{7,}\b/g, placeholder: '[number]' },
];
