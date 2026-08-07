/** Only the accent is themeable, and only through this attribute. */
export const ACCENT_ATTRIBUTE = 'data-hintora-accent';

export const DEFAULT_ACCENT = '#ffd24a';

const SAFE_COLOUR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * The value comes from the host page, which is untrusted input like any other
 * page content, and it ends up inside a stylesheet. Anything that is not a plain
 * hex colour is discarded rather than escaped.
 *
 * Deliberately narrow: the layer is meant to stay visually distinct from the
 * application it guides. A customer may retune the beam colour so it does not
 * clash; they may not make the guide look like their own UI. The user has to be
 * able to tell at a glance whether the product or the guide is speaking, and
 * that is a safety property as much as a branding one.
 */
export function resolveAccent(doc: Document, override?: string): string {
  const requested = (
    override ?? doc.documentElement.getAttribute(ACCENT_ATTRIBUTE)
  )?.trim();
  return requested && SAFE_COLOUR.test(requested) ? requested : DEFAULT_ACCENT;
}
