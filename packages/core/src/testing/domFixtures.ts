import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Test-only helpers. Nothing under src/testing is imported by shipped code.

/**
 * Resolved through node:path rather than `new URL(relative, import.meta.url)`:
 * under happy-dom the global URL resolves relative paths against
 * window.location, which silently rewrites the fixture path.
 */
export function readFixture(moduleUrl: string, relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(moduleUrl)), relativePath), 'utf8');
}

/**
 * Mounts fixture markup into the live document rather than a detached one:
 * accessible name computation needs a defaultView, and a parsed-only document
 * does not have one. External script and stylesheet tags are dropped so the test
 * environment never reaches for the network.
 */
export function mountHtml(html: string): void {
  const inner = html
    .replace(/^[\s\S]*?<html[^>]*>/i, '')
    .replace(/<\/html>[\s\S]*$/i, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, '');

  document.documentElement.innerHTML = inner;
}
