export type PageVerdict = { allowed: true } | { allowed: false; reason: string };

/**
 * Paths where a guidance layer has no business reading the page at all. Matched
 * on the pathname only, since the query string is never in our hands anyway.
 */
const SENSITIVE_PATH =
  /\/(login|signin|sign-in|signup|checkout|payment|reset|verify|2fa|mfa)(\/|$)/i;

/**
 * A circuit breaker, not a filter: on a sensitive page nothing is distilled and
 * nothing is sent. Failing closed is the only defensible default when the cost
 * of being wrong is transmitting a credential.
 */
export function assessPage(doc: Document): PageVerdict {
  if (doc.querySelector('input[type="password"]')) {
    return { allowed: false, reason: 'This page contains a password field.' };
  }

  const pathname = doc.location?.pathname ?? '';
  if (SENSITIVE_PATH.test(pathname)) {
    return { allowed: false, reason: 'This looks like a sign-in or payment page.' };
  }

  return { allowed: true };
}
