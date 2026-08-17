/** Only the accent is themeable, and only through this attribute. */
export const ACCENT_ATTRIBUTE = 'data-signpost-accent';

/**
 * Warm on purpose. Business software is overwhelmingly cool - blues, slates,
 * the occasional green - so a warm accent is the cheapest way for the guide to
 * read as something other than a panel the application grew.
 */
export const DEFAULT_ACCENT = '#e8590c';

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

function channel(hex: string, at: number, size: number): number {
  const raw = hex.slice(at, at + size);
  const value = parseInt(size === 1 ? raw + raw : raw, 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/**
 * Text and glyphs drawn on top of the accent, black or white.
 *
 * The accent is whatever hex the customer put in an attribute, so a fixed
 * foreground would be unreadable for half of the possible values. Small text is
 * never drawn in the accent itself for the same reason: the customer picks a
 * colour, and we stay responsible for it being legible.
 */
export function onAccent(accent: string): string {
  const hex = accent.slice(1);
  const size = hex.length === 3 ? 1 : 2;

  const luminance =
    0.2126 * channel(hex, 0, size) +
    0.7152 * channel(hex, size, size) +
    0.0722 * channel(hex, size * 2, size);

  return luminance > 0.42 ? '#1a1205' : '#ffffff';
}
