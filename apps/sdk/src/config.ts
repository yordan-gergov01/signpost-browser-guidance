import { ENDPOINT_ATTRIBUTE, HOTKEY_ATTRIBUTE } from '@signpost/core/config/attributes';
import { ACCENT_ATTRIBUTE } from '@signpost/overlay/theme';
import type { SignpostConfig, SignpostOptions } from '@signpost/sdk/types';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

const OFF = new Set(['off', 'false', '0', 'no']);

/**
 * The endpoint arrives as page content, and page content is untrusted here for
 * the same reason it is untrusted in the distiller. It is parsed, restricted to
 * two protocols, and dropped whole if it is anything else. `javascript:` on a
 * script tag attribute is the case this function exists for.
 */
export function resolveEndpoint(
  raw: string | null | undefined,
  base: string,
): string | null {
  const value = raw?.trim();
  if (!value) return null;

  try {
    const url = new URL(value, base);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Script tag first, document root second.
 *
 * Both exist because the tag is not always writable: plenty of customers inject
 * it through a tag manager and can only reach their own markup.
 */
function attributeOf(name: string, doc: Document, script: Element | null): string | null {
  return script?.getAttribute(name) ?? doc.documentElement.getAttribute(name);
}

/** Null when there is nowhere to send a page map. The caller stays inert. */
export function resolveConfig(
  doc: Document,
  script: Element | null,
  overrides: SignpostOptions = {},
): SignpostConfig | null {
  // The programmatic value goes through the same check: a customer passing their
  // own user input straight in is not a case worth being surprised by.
  const endpoint = resolveEndpoint(
    overrides.endpoint ?? attributeOf(ENDPOINT_ATTRIBUTE, doc, script),
    doc.baseURI,
  );

  if (!endpoint) return null;

  const accent =
    overrides.accent ?? attributeOf(ACCENT_ATTRIBUTE, doc, script) ?? undefined;
  const hotkey =
    overrides.hotkey ??
    !OFF.has(attributeOf(HOTKEY_ATTRIBUTE, doc, script)?.trim().toLowerCase() ?? '');

  return {
    endpoint,
    suggestions: overrides.suggestions ?? [],
    hotkey,
    ...(accent ? { accent } : {}),
    ...(overrides.onTelemetry ? { onTelemetry: overrides.onTelemetry } : {}),
  };
}
