import { describe as suite, expect, test } from 'vitest';
import { distill } from '@signpost/core/distiller/distill';
import { formatCompression, measureCompression } from '@signpost/core/distiller/stats';
import { mountHtml, readFixture } from '@signpost/core/testing/domFixtures';
import { stubLayout } from '@signpost/core/testing/stubLayout';
import type { CompressionReport } from '@signpost/core/distiller/stats';

const FIXTURES = ['business-contacts.html', 'edge-cases.html', 'modal.html'] as const;

function report(fixture: string): CompressionReport {
  const html = readFixture(import.meta.url, `fixtures/${fixture}`);
  mountHtml(html);
  stubLayout(document);
  return measureCompression(html, distill(document));
}

suite('compression', () => {
  test.each(FIXTURES)('reports the distillation ratio for %s', (fixture) => {
    console.info(formatCompression(fixture, report(fixture)));
    expect(report(fixture).elementCount).toBeGreaterThan(0);
  });

  test('compresses markup produced by a real component tree', () => {
    expect(report('business-contacts.html').reduction).toBeGreaterThan(0.6);
  });

  /**
   * The honest counter-case. Distillation wins by discarding markup overhead -
   * nesting, class attributes, styling wrappers - so a hand-written fixture that
   * is almost entirely controls has nothing to discard and the structured map
   * costs more than the HTML it replaces. Real applications sit far on the other
   * side of this line, but the mechanism is worth stating rather than averaging
   * away.
   */
  test('does not compress markup that is already nothing but controls', () => {
    expect(report('edge-cases.html').reduction).toBeLessThan(0);
  });

  test('geometry is stripped on the path to the model', () => {
    const measured = report('business-contacts.html');
    expect(measured.pageMapBytes - measured.promptBytes).toBeGreaterThan(0);
  });
});
